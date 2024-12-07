"use client";

import { Container, Typography, Paper, Grid, Box } from "@mui/material";
import { useCallback, useState } from "react";
import { useFileUpload } from "@/hooks";
import { BaseButton, FileUploadZone, FileUploadList } from "@/components";
import { FileList } from "@/components/FileManager/FileList";
import { FileManagerService } from "@/services";
import axios from "axios";

export default function Home() {
  const { files, addFiles, removeFile, updateFileProgress } = useFileUpload();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (selectedFiles: File[]) => {
    addFiles(selectedFiles);
  };

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    const cancelTokenSource = axios.CancelToken.source();

    try {
      // Create upload promises with individual progress tracking
      const uploadPromises = files.map((fileUpload) =>
        FileManagerService.uploadFile(
          fileUpload.file,
          (progress) => {
            // Update individual file progress
            updateFileProgress(fileUpload.id, progress);
          },
          cancelTokenSource.token
        )
      );

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  }, [files, updateFileProgress]);

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
                <FileUploadList files={files} onRemoveFile={removeFile} />
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
