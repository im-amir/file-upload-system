import axios, { CancelToken } from "axios";
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
    onProgress?: (progress: number, cancelUploadFn?: any) => void,
    onComplete?: (fileUrl: string | null) => void
  ): Promise<{ fileUrl: string }> {
    const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let uploadId: any;
    let eventSource: EventSource | null = null;
    let cancelUploadFn: (() => Promise<void>) | null = null;

    // Initial progress (init stage)
    onProgress?.(0);

    console.log("Uploading file:", {
      filename: file.name,
      filesize: file.size,
      totalChunks: Math.ceil(file.size / (1 * 1024 * 1024)),
    });

    try {
      // Upload init with progress
      const uploadInitResponse = await axios.post(
        `${this.BASE_URL}/upload/init`,
        null,
        {
          params: {
            filename: file.name,
            filesize: file.size,
            totalChunks: totalChunks,
          },
          onUploadProgress: () => {
            const initProgress = 1;
            onProgress?.(initProgress);
          },
        }
      );

      uploadId = uploadInitResponse.data.uploadId;

      // Upload chunks with progress
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
          onUploadProgress: () => {
            const chunkProgress = Math.floor(
              1 + (chunkIndex / totalChunks) * 3
            );
            onProgress?.(chunkProgress);
          },
        });
      }

      // Finalize upload with progress tracking
      return new Promise((resolve: any, reject) => {
        eventSource = new EventSource(
          `${this.BASE_URL}/upload/finalize?uploadId=${uploadId}&filename=${file.name}`
        );

        // Create cancel function
        cancelUploadFn = async () => {
          if (uploadId) {
            console.log("Cancelling upload...");
            try {
              eventSource?.close();
              onComplete?.(null);
              await this.cancelUpload(uploadId);
              reject(new Error("Upload cancelled"));
            } catch (error) {
              console.error("Error cancelling upload:", error);
            }
          }
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            onProgress?.(4, cancelUploadFn);

            if (data.progress !== undefined) {
              const adjustedProgress = 4 + data.progress * 0.96;
              onProgress?.(Math.floor(adjustedProgress), cancelUploadFn);

              if (data.complete) {
                eventSource?.close();
                onComplete?.(data.fileUrl);
                resolve({
                  fileUrl: data.fileUrl,
                });
              }
            }
          } catch (error) {
            console.error("Error parsing progress:", error);
          }
        };

        eventSource.onerror = (error) => {
          console.error("EventSource failed:", error);
          eventSource?.close();
          reject(error);
        };
      });
    } catch (error) {
      console.error("Chunked file upload error:", error);
      if (uploadId) {
        await this.cancelUpload(uploadId);
      }
      throw error;
    }
  }

  static async cancelUpload(uploadId: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.BASE_URL}/upload/cancel`,
        null,
        {
          params: { uploadId },
        }
      );
      return response.data.success;
    } catch (error) {
      console.error("Error cancelling upload:", error);
      return false;
    }
  }

  static async downloadFile(fileUrl: string, fileName: string): Promise<void> {
    try {
      // Use backend proxy for download
      const response = await axios.get(`${this.BASE_URL}/download`, {
        params: { url: fileUrl },
        responseType: "blob",
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
      // Create cancel token for timeout handling
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

      // Clear timeout on successful response
      clearTimeout(timeoutId);

      // Return formatted preview data
      return {
        headers: response.data.headers,
        rows: response.data.rows.map((row: any, index: number) => ({
          id: skip + index + 1,
          ...row,
        })),
        total_rows: response.data.total_rows,
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
