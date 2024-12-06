import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { FileUpload, FileUploadStatus } from "../types/file";

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

  const updateFileProgress = useCallback(
    (fileId: string, progress: number, status?: FileUploadStatus) => {
      setFiles((prev) =>
        prev.map((file) =>
          file.id === fileId
            ? { ...file, progress, status: status || file.status }
            : file
        )
      );
    },
    []
  );

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId));
  }, []);

  return {
    files,
    addFiles,
    updateFileProgress,
    removeFile,
  };
};
