import axios, { AxiosProgressEvent } from "axios";
import { FileUpload, FileUploadStatus } from "../types/file";

interface UploadProgressCallback {
  (fileId: string, progress: number, status?: FileUploadStatus): void;
}

export class FileUploadService {
  private static BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  static async uploadFile(
    file: File,
    fileId: string,
    onProgress: UploadProgressCallback
  ): Promise<string | null> {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", file);

      // Track upload progress
      const config = {
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          onProgress(fileId, percentCompleted, FileUploadStatus.UPLOADING);
        },
      };

      // Perform file upload
      const response = await axios.post(
        `${this.BASE_URL}/upload`,
        formData,
        config
      );

      // Update status on successful upload
      onProgress(fileId, 100, FileUploadStatus.COMPLETED);
      return response.data.fileUrl;
    } catch (error) {
      // Handle upload errors
      console.error("File upload error:", error);
      onProgress(fileId, 0, FileUploadStatus.FAILED);
      return null;
    }
  }

  static async uploadFiles(
    files: FileUpload[],
    onProgress: UploadProgressCallback
  ): Promise<(string | null)[]> {
    // Upload files sequentially
    const uploadResults = [];
    for (const file of files) {
      const result = await this.uploadFile(file.file, file.id, onProgress);
      uploadResults.push(result);
    }
    return uploadResults;
  }
}
