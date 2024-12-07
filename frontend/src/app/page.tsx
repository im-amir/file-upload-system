"use client";

import { Container, Typography, Paper, Grid, Box } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useFileUpload } from "@/hooks";
import { BaseButton, FileUploadZone, FileUploadList } from "@/components";
import { FileList } from "@/components/FileManager/FileList";
import { FileManagerService } from "@/services";
import axios from "axios";
import { FileUploadStatus } from "@/types/file";

export default function Home() {
  const { files, addFiles, removeFile, updateFileProgress } = useFileUpload();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCancellations, setUploadCancellations] = useState<{
    [fileId: string]: (() => void) | null;
  }>({});
  const handleFileSelect = (selectedFiles: File[]) => {
    addFiles(selectedFiles);
  };
  console.log("cancl", uploadCancellations);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;

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
                console.log("cancel here:", cancel);
                newCancellations[fileUpload.id] = cancel;
                setUploadCancellations(newCancellations);
                updateFileProgress(fileUpload.id, progress);
              },
              (fileUrl) => console.log("File uploaded:", fileUrl)
            );

            return fileUrl;
          } catch (error) {
            if (axios.isCancel(error)) {
              await FileManagerService.cancelUpload(fileUpload.uploadId);
              removeFile(fileUpload.id);
            }
            throw error;
          }
        });

      await Promise.all(uploadPromises);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  }, [files, updateFileProgress, removeFile]);

  const handleCancelFile = async (fileId: string) => {
    const cancelMethod = uploadCancellations[fileId];
    console.log(cancelMethod);
    if (cancelMethod) {
      try {
        await cancelMethod();
        // removeFile(fileId);
      } catch (error) {
        console.error(`Error cancelling file ${fileId}:`, error);
      }
    } else {
      // removeFile(fileId);
    }
  };

  return (
    <Box p={4}>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
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
                onClick={handleUpload}
                disabled={files.length === 0 || isUploading}
                color="primary"
              >
                {isUploading ? "Uploading..." : "Upload Files"}
              </BaseButton>
            </Grid>
          </Grid>
        </Paper>

        <Box mt={3}>
          <FileList />
        </Box>
      </Container>
    </Box>
  );
}
