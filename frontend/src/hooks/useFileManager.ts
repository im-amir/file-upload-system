import { useState, useEffect, useCallback } from "react";
import { UploadedFile } from "../types/file";
import { FileManagerService } from "../services/fileManagerService";

export const useFileManager = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const uploadedFiles = await FileManagerService.fetchUploadedFiles();
      setFiles(uploadedFiles);
      setError(null);
    } catch (err) {
      setError("Failed to fetch files");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const downloadFile = useCallback(async (file: UploadedFile) => {
    await FileManagerService.downloadFile(file.url, file.name);
  }, []);

  const previewFile = useCallback(async (file: UploadedFile) => {
    return await FileManagerService.previewFile(file.url);
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return {
    files,
    isLoading,
    error,
    fetchFiles,
    downloadFile,
    previewFile,
  };
};
