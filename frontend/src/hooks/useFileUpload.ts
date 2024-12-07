import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { FileUpload, FileUploadStatus } from "../types/file";

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
    updateFileProgress,
    removeFile,
    pauseFile,
    resumeFile,
  };
};
