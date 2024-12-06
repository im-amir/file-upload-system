import styles from "./page.module.css";
import { Container, Typography, Paper, Grid } from "@mui/material";
import FileUploadZone from "../../components/FileUploader/FileUploadZone";
import FileUploadList from "../../components/FileUploader/FileUploadList";
import BaseButton from "../../components/base/BaseButton";
import { useState } from "react";
import { useFileUpload } from "../../hooks/useFileUpload";
import { FileUploadService } from "../../services/fileUploadService";

export default function Home() {
  const { files, addFiles, removeFile, updateFileProgress } = useFileUpload();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (selectedFiles: File[]) => {
    addFiles(selectedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      await FileUploadService.uploadFiles(files, updateFileProgress);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };
  return (
    <div className={styles.page}>
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
      </Container>
    </div>
  );
}
