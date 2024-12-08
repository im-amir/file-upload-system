"use client";

import { Container, Typography, Paper, Grid, Box } from "@mui/material";
import { useCallback, useRef, useState } from "react";
import { toast, Toaster } from "sonner";
import { useFileUpload } from "@/hooks";
import { BaseButton, FileUploadZone, FileUploadList } from "@/components";
import { FileList } from "@/components/FileManager/FileList";
import { FileManagerService } from "@/services";
import { FileUploadStatus } from "@/types/file";

export default function Home() {
  const { files, addFiles, removeFile, updateFileProgress } = useFileUpload();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCancellations, setUploadCancellations] = useState<{
    [fileId: string]: (() => void) | null;
  }>({});

  const handleFileSelect = (selectedFiles: File[]) => {
    console.log("Selected files:", selectedFiles[0]);
    const csvFiles = selectedFiles.filter(
      (file) => file.type === "text/csv" || file.name.endsWith(".csv")
    );
    console.log("CSV files:", csvFiles[0]);

    if (csvFiles.length > 0) {
      addFiles(csvFiles);
      toast.success(`Added ${csvFiles.length} CSV file(s)`, {
        description: csvFiles.map((file) => file.name).join(", "),
        id: "file-upload-toast",
      });
    } else {
      console.log("Invalid file type\n\n\n");
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
  }, [files, updateFileProgress, removeFile]);

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

          <Box mt={3}>
            <Typography variant="h2" gutterBottom>
              All Files
            </Typography>
            <FileList />
          </Box>
        </Container>
      </Paper>
    </Box>
  );
}
