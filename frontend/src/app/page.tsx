"use client";

import { Container, Typography, Paper, Grid, Box } from "@mui/material";
import { useCallback, useState } from "react";
import { toast, Toaster } from "sonner";
import { useFileUpload } from "@/hooks";
import { BaseButton, FileUploadZone, FileUploadList } from "@/components";
import { FileList } from "@/components/FileManager/FileList";
import { FileManagerService } from "@/services";
import { FileUploadStatus } from "@/types/file";
import { useFileManager } from "@/hooks/useFileManager";

export default function Home() {
  const { files, addFiles, removeFile, updateFileProgress } = useFileUpload();
  const { setFiles: setUploadedFiles } = useFileManager();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadCancellations, setUploadCancellations] = useState<{
    [fileId: string]: (() => void) | null;
  }>({});

  const handleFileSelect = (selectedFiles: File[]) => {
    console.log("Selected files:", selectedFiles);
    const csvFiles = selectedFiles.filter(
      (file) => file.type === "text/csv" || file.name.endsWith(".csv")
    );

    if (csvFiles.length > 0) {
      addFiles(csvFiles);
      toast.success(`Added ${csvFiles.length} CSV file(s)`, {
        description: csvFiles.map((file) => file.name).join(", "),
        id: "file-upload-toast",
      });
    } else {
      toast.error("Invalid file type", {
        description: "Only CSV files are allowed",
        id: "file-upload-error-toast",
      });
    }
  };

  const handleUpload = useCallback(async () => {
    if (files.length === 0) {
      toast.error("No files to upload", {
        description: "Please select CSV files first",
      });
      return;
    }

    setIsUploading(true);
    const newCancellations: { [fileId: string]: (() => Promise<void>) | null } =
      {};

    try {
      const uploadPromises = files
        .filter((f) => f.status !== FileUploadStatus.PAUSED)
        .map(async (fileUpload: any) => {
          try {
            const { fileUrl } = await FileManagerService.uploadFile(
              fileUpload.file,
              (progress, cancel) => {
                newCancellations[fileUpload.id] = cancel;
                setUploadCancellations(newCancellations);
                updateFileProgress(fileUpload.id, progress);
              },
              (fileUrl: string | null) => {
                setIsUploading(false);
                if (fileUrl) {
                  toast.success(`${fileUpload.name} uploaded successfully`);
                  setUploadedFiles((prevFiles: any) => [
                    ...prevFiles,
                    {
                      name: fileUpload.name,
                      url: fileUrl,
                    },
                  ]);
                  setTimeout(() => {
                    removeFile(fileUpload.id);
                  }, 4000);
                }
                setUploadCancellations({});
              }
            );

            return fileUrl;
          } catch (error) {
            console.log(error);
          }
        });

      await Promise.all(uploadPromises);
    } catch (error: any) {
      toast.error("Upload failed", {
        description: "Some files could not be uploaded",
      });
      console.log(error);
    } finally {
      setIsUploading(false);
    }
  }, [files, updateFileProgress]);

  const handleCancelFile = async (fileId: string) => {
    const cancelMethod = uploadCancellations[fileId];
    const fileToCancel = files.find((f) => f.id === fileId);

    if (cancelMethod) {
      try {
        toast.info(`Upload cancelled for ${fileToCancel?.name}`);
        removeFile(fileId);

        await cancelMethod();
      } catch (error) {
        toast.error(`Error cancelling file upload`, {
          description: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      removeFile(fileId);
    }
  };
  console.log("files", files);

  return (
    <Box p={4}>
      <Toaster position="top-right" richColors closeButton />
      <Paper elevation={3} sx={{ p: 3, width: "70%", margin: "auto" }}>
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            CSV File Uploader
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FileUploadZone onFileSelect={handleFileSelect} />
            </Grid>

            {files.length > 0 && (
              <Grid item xs={12}>
                <FileUploadList files={files} onRemoveFile={handleCancelFile} />
              </Grid>
            )}

            <Grid item xs={12} sx={{ textAlign: "center" }}>
              <BaseButton
                testId="upload-button"
                onClick={handleUpload}
                disabled={files.length === 0 || isUploading}
                color="primary"
              >
                {isUploading ? "Uploading..." : "Upload Files"}
              </BaseButton>
            </Grid>
          </Grid>

          <Box mt={5}>
            <Typography variant="h4" gutterBottom>
              All Files
            </Typography>
            <FileList />
          </Box>
        </Container>
      </Paper>
    </Box>
  );
}
