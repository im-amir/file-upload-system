import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { FileUpload, FileUploadStatus } from "../types/file";
import { FileManagerService } from "../services/fileManagerService";
import axios from "axios";

export const useFileUpload = () => {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [uploadCancelTokens, setUploadCancelTokens] = useState<any>({});

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
    // Create a cancel token for this file
    const cancelTokenSource = axios.CancelToken.source();

    // Store the cancel token
    setUploadCancelTokens((prev: any) => ({
      ...prev,
      [fileUpload.id]: cancelTokenSource,
    }));

    try {
      // Update file status to uploading
      updateFileProgress(fileUpload.id, 0, FileUploadStatus.UPLOADING);

      // Perform chunked file upload
      const fileUrl = await FileManagerService.uploadFile(
        fileUpload.file,
        (progress: number) => {
          // Update individual file progress
          updateFileProgress(fileUpload.id, progress);
        },
        (fileUrl: string) => {
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
        updateFileProgress(
          fileUpload.id,
          fileUpload.progress,
          FileUploadStatus.PAUSED
        );
      } else {
        // Update file status to failed
        updateFileProgress(fileUpload.id, 0, FileUploadStatus.FAILED);
      }
      throw error;
    } finally {
      // Remove the cancel token
      setUploadCancelTokens((prev: any) => {
        const newTokens = { ...prev };
        delete newTokens[fileUpload.id];
        return newTokens;
      });
    }
  }, []);

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

  const removeFile = useCallback(
    (fileId: string) => {
      // Cancel the upload if it's in progress
      const cancelToken = uploadCancelTokens[fileId];
      if (cancelToken) {
        cancelToken.cancel("Upload cancelled");
      }

      setFiles((prev) => prev.filter((file) => file.id !== fileId));

      // Remove the cancel token
      setUploadCancelTokens((prev: any) => {
        const newTokens = { ...prev };
        delete newTokens[fileId];
        return newTokens;
      });
    },
    [uploadCancelTokens]
  );

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

  const pauseFile = useCallback(
    (fileId: string) => {
      // Cancel the upload for this file
      const cancelToken = uploadCancelTokens[fileId];
      if (cancelToken) {
        cancelToken.cancel("Upload paused");
      }

      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === fileId
            ? { ...file, status: FileUploadStatus.PAUSED }
            : file
        )
      );
    },
    [uploadCancelTokens]
  );

  const resumeFile = useCallback((fileId: string) => {
    setFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.id === fileId
          ? { ...file, status: FileUploadStatus.UPLOADING }
          : file
      )
    );
  }, []);

  return {
    files,
    addFiles,
    uploadFiles,
    uploadFile,
    updateFileProgress,
    removeFile,
    pauseFile,
    resumeFile,
  };
};
