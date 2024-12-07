import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { FileUpload, FileUploadStatus } from "../types/file";
import axios from "axios";
import { FileManagerService } from "./useFileManager";

export const useFileUpload = () => {
  const [files, setFiles] = useState<FileUpload[]>([]);

  const addFiles = useCallback((newFiles: File[]) => {
    const validFiles = newFiles.filter(
      (file) => file.type === "text/csv" || file.name.endsWith(".csv")
    );

    const fileUploads: FileUpload[] = validFiles.map((file) => ({
      id: uuidv4(),
      file,
      name: file.name,
      size: file.size,
      status: FileUploadStatus.PENDING,
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...fileUploads]);
  }, []);

  const uploadFile = useCallback(async (fileUpload: FileUpload) => {
    const cancelTokenSource = axios.CancelToken.source();

    try {
      // Update file status to uploading
      updateFileProgress(fileUpload.id, 0, FileUploadStatus.UPLOADING);

      // Perform chunked file upload
      const fileUrl = await FileManagerService.uploadFile(
        fileUpload.file,
        (progress: any) => {
          updateFileProgress(fileUpload.id, progress);
        },
        (fileUrl) => {
          // Handle upload completion
          console.log("File uploaded:", fileUrl);
        },
        cancelTokenSource.token
      );

      // Update file status to completed
      updateFileProgress(fileUpload.id, 100, FileUploadStatus.COMPLETED);

      return fileUrl;
    } catch (error) {
      // Check if upload was cancelled
      if (axios.isCancel(error)) {
        updateFileProgress(fileUpload.id, 0, FileUploadStatus.CANCELLED);
      } else {
        // Update file status to failed
        updateFileProgress(fileUpload.id, 0, FileUploadStatus.FAILED);
      }
      throw error;
    }
  }, []);

  const uploadFiles = useCallback(async () => {
    const pendingFiles = files.filter(
      (file) => file.status === FileUploadStatus.PENDING
    );

    const uploadPromises = pendingFiles.map((file) => uploadFile(file));

    try {
      const results = await Promise.allSettled(uploadPromises);

      results.forEach((result, index) => {
        const file = pendingFiles[index];
        if (result.status === "fulfilled") {
          // Successfully uploaded
          updateFileProgress(file.id, 100, FileUploadStatus.COMPLETED);
        } else {
          // Upload failed
          updateFileProgress(file.id, 0, FileUploadStatus.FAILED);
        }
      });

      return results;
    } catch (error) {
      console.error("Batch upload error:", error);
      throw error;
    }
  }, [files, uploadFile]);

  const updateFileProgress = useCallback(
    (fileId: string, progress: number, status?: FileUploadStatus) => {
      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === fileId
            ? {
                ...file,
                progress,
                status:
                  status ||
                  (progress === 100
                    ? FileUploadStatus.COMPLETED
                    : FileUploadStatus.UPLOADING),
              }
            : file
        )
      );
    },
    []
  );

  const pauseFile = useCallback((fileId: string) => {
    setFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.id === fileId
          ? {
              ...file,
              status: FileUploadStatus.PAUSED,
              pausedAt: Date.now(), // Record when the file was paused
            }
          : file
      )
    );
  }, []);

  const resumeFile = useCallback((fileId: string) => {
    setFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.id === fileId
          ? {
              ...file,
              status: FileUploadStatus.UPLOADING,
              pausedAt: undefined, // Clear the pausedAt timestamp
            }
          : file
      )
    );
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId));
  }, []);

  return {
    files,
    addFiles,
    updateFileProgress,
    removeFile,
    pauseFile,
    resumeFile,
  };
};
