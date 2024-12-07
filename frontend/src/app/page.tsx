"use client";

import { Container, Typography, Paper, Grid, Box } from "@mui/material";
import { useCallback, useState, useRef } from "react";
import { useFileUpload } from "@/hooks";
import { BaseButton, FileUploadZone, FileUploadList } from "@/components";
import { FileList } from "@/components/FileManager/FileList";
import { FileManagerService } from "@/services";
import axios from "axios";
import { FileUploadStatus } from "@/types/file";

export default function Home() {
  const {
    files,
    addFiles,
    removeFile,
    updateFileProgress,
    pauseFile,
    resumeFile,
  } = useFileUpload();
  const [isUploading, setIsUploading] = useState(false);
  const uploadCancelTokens = useRef<any>({});

  const handleFileSelect = (selectedFiles: File[]) => {
    addFiles(selectedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      // Create upload promises with individual progress tracking
      const uploadPromises = files
        .filter((f) => f.status !== FileUploadStatus.PAUSED)
        .map((fileUpload) => {
          // Create a cancel token for this file
          const cancelTokenSource = axios.CancelToken.source();
          uploadCancelTokens.current[fileUpload.id] = cancelTokenSource;

          return FileManagerService.uploadFile(
            fileUpload.file,
            (progress) => {
              // Update individual file progress
              updateFileProgress(fileUpload.id, progress);
            },
            (fileUrl) => {
              // Handle upload completion
              console.log("File uploaded:", fileUrl);
            },
            cancelTokenSource.token
          );
        });

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  }, [files, updateFileProgress]);

  const handlePauseFile = (fileId: string) => {
    // Cancel the upload for this file
    const cancelToken = uploadCancelTokens.current[fileId];
    if (cancelToken) {
      cancelToken.cancel("Upload paused");
    }
    pauseFile(fileId);
  };

  const handleResumeFile = (fileId: string) => {
    resumeFile(fileId);
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
                <FileUploadList
                  files={files}
                  onRemoveFile={removeFile}
                  onPauseFile={handlePauseFile}
                  onResumeFile={handleResumeFile}
                />
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
        <FileList />
      </Container>
    </Box>
  );
}
