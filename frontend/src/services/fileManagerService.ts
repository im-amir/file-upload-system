import axios, { AxiosRequestConfig, CancelToken } from "axios";
import { UploadedFile } from "../types/file";

export class FileManagerService {
  private static BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  static async fetchUploadedFiles(): Promise<UploadedFile[]> {
    try {
      const response = await axios.get(`${this.BASE_URL}/files`);
      return response.data.files.map((file: any) => ({
        id: file.id,
        name: file.name,
        size: file.size,
        uploadDate: new Date(file.uploadDate),
        url: file.url,
      }));
    } catch (error) {
      console.error("Error fetching uploaded files:", error);
      return [];
    }
  }

  static async uploadFile(
    file: File,
    onProgress?: (progress: number) => void,
    cancelToken?: CancelToken
  ): Promise<string> {
    const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let uploadedChunks = 0;

    try {
      // Generate a unique upload ID
      const uploadInitResponse = await axios.post(
        `${this.BASE_URL}/upload/init`,
        null, // No request body
        {
          params: {
            filename: file.name,
            filesize: file.size,
            totalChunks: totalChunks,
          },
          cancelToken,
        }
      );

      const { uploadId } = uploadInitResponse.data;

      // Upload chunks sequentially
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append("file", chunk);
        formData.append("uploadId", uploadId);
        formData.append("chunkIndex", chunkIndex.toString());

        await axios.post(`${this.BASE_URL}/upload/chunk`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          cancelToken,
          onUploadProgress: (progressEvent) => {
            uploadedChunks++;
            const chunkProgress = (uploadedChunks / totalChunks) * 100;
            onProgress?.(Math.min(chunkProgress, 100));
          },
        });
      }

      // Finalize upload
      const finalizeResponse = await axios.post(
        `${this.BASE_URL}/upload/finalize`,
        null, // No request body
        {
          params: {
            uploadId,
            filename: file.name,
          },
          cancelToken,
        }
      );

      return finalizeResponse.data.fileUrl;
    } catch (error) {
      console.error("Chunked file upload error:", error);
      throw error;
    }
  }

  static async downloadFile(fileUrl: string, fileName: string): Promise<void> {
    try {
      const response = await axios.get(`${this.BASE_URL}/download`, {
        params: { url: fileUrl },
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          console.log(`Download progress: ${percentCompleted}%`);
        },
        timeout: 0, // Disable timeout for large files
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("File download error:", error);
      throw error;
    }
  }

  static async previewFile(
    fileUrl: string,
    skip: number = 0,
    limit: number = 100
  ): Promise<{
    headers: string[];
    rows: any[];
    total_rows?: number;
  } | null> {
    try {
      // Increase timeout and add cancelToken for long-running requests
      const source = axios.CancelToken.source();
      const timeoutId = setTimeout(() => {
        source.cancel("Request timeout");
      }, 60000); // 60 seconds timeout

      const response = await axios.get(`${this.BASE_URL}/preview`, {
        params: {
          url: fileUrl,
          skip,
          limit,
        },
        cancelToken: source.token,
        timeout: 60000,
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      return {
        headers: response.data.headers,
        rows: response.data.rows.map((row: any, index: number) => ({
          id: skip + index + 1,
          ...row,
        })),
        total_rows: response.data.total_rows || response.data.rows.length,
      };
    } catch (error) {
      if (axios.isCancel(error)) {
        console.error("Request canceled:", error.message);
      } else {
        console.error("File preview error:", error);
      }
      return null;
    }
  }
}
