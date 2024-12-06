import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Box, Typography } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { styled } from "@mui/material/styles";

interface FileUploadZoneProps {
  onFileSelect: (files: File[]) => void;
}

const DropzoneContainer = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.primary.main}`,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(4),
  textAlign: "center",
  cursor: "pointer",
  transition: "background-color 0.3s ease",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const FileUploadZone: React.FC<FileUploadZoneProps> = ({ onFileSelect }) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const csvFiles = acceptedFiles.filter(
        (file) => file.type === "text/csv" || file.name.endsWith(".csv")
      );

      if (csvFiles.length > 0) {
        onFileSelect(csvFiles);
      } else {
        alert("Please upload only CSV files");
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    multiple: true,
  });

  return (
    <DropzoneContainer
      data-testid="file-upload-zone"
      {...getRootProps()}
      sx={{
        borderColor: isDragActive ? "primary.main" : "grey.400",
        backgroundColor: isDragActive ? "action.hover" : "transparent",
      }}
    >
      <input {...getInputProps()} />
      <CloudUploadIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
      <Typography variant="h6" color="textSecondary">
        {isDragActive
          ? "Drop files here"
          : "Drag and drop CSV files here, or click to select"}
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
        Only CSV files are allowed
      </Typography>
    </DropzoneContainer>
  );
};

export default FileUploadZone;
