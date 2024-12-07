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
    onProgress?: (progress: number) => void,
    onComplete?: (fileUrl: string) => void,
    cancelToken?: CancelToken
  ): Promise<string> {
    const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    // Initial progress (init stage)
    onProgress?.(0);

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
          cancelToken,
          onUploadProgress: () => {
            const initProgress = 1;
            onProgress?.(initProgress);
          },
        }
      );

      const { uploadId } = uploadInitResponse.data;

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
          cancelToken,
          onUploadProgress: () => {
            // Chunks progress from 1% to 4%
            const chunkProgress = Math.floor(
              1 + (chunkIndex / totalChunks) * 3
            );

            onProgress?.(chunkProgress);
          },
        });
      }

      // Finalize upload with progress tracking
      return new Promise((resolve, reject) => {
        let lastProgressTime = Date.now();
        let currentProgress = 4; // Starting progress
        let progressInterval: NodeJS.Timeout | null = null;

        const getRandomIncrement = () => {
          // Generate a random increment between 0.05 and 0.25
          return Math.random() * 0.2 + 0.05;
        };

        const startProgressIncrement = () => {
          progressInterval = setInterval(() => {
            const timeSinceLastProgress = Date.now() - lastProgressTime;

            if (timeSinceLastProgress > 1000) {
              // Randomly increment progress
              const randomIncrement = getRandomIncrement();
              currentProgress = Math.min(
                currentProgress + randomIncrement,
                100
              );
              onProgress?.(Math.floor(currentProgress));
            }
          }, Math.floor(Math.random() * 100) + 40); // Randomize interval between 40-140ms
        };

        const stopProgressIncrement = () => {
          if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
          }
        };

        const eventSource = new EventSource(
          `${this.BASE_URL}/upload/finalize?uploadId=${uploadId}&filename=${file.name}`
        );

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("Received event:", data);

            // Reset last progress time and stop increment
            lastProgressTime = Date.now();
            stopProgressIncrement();

            if (data.progress !== undefined) {
              // Start from 4% and scale the finalize progress
              currentProgress = Math.floor(4 + (data.progress / 100) * 96);
              onProgress?.(currentProgress);

              if (data.complete) {
                eventSource.close();
                onComplete?.(data.fileUrl);
                resolve(data.fileUrl);
              } else {
                // Start progress increment if no progress for more than 1 second
                startProgressIncrement();
              }
            }
          } catch (error) {
            console.error("Error parsing progress:", error);
          }
        };

        eventSource.onerror = (error) => {
          console.error("EventSource failed:", error);
          stopProgressIncrement();
          eventSource.close();
          reject(error);
        };

        // Initial start of progress increment
        startProgressIncrement();
      });
    } catch (error) {
      console.error("Chunked file upload error:", error);
      throw error;
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

  static async previewFile(fileUrl: string): Promise<string | null> {
    try {
      const response = await axios.get(`${this.BASE_URL}/preview`, {
        params: { url: fileUrl },
        responseType: "text",
      });
      return response.data;
    } catch (error) {
      console.error("File preview error:", error);
      return null;
    }
  }
}
