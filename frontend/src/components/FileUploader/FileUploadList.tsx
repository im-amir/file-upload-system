import React from "react";
import {
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Typography,
  Box,
  IconButton,
} from "@mui/material";
import {
  Cancel as CancelIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { FileUpload, FileUploadStatus } from "../../types/file";

interface FileUploadListProps {
  files: FileUpload[];
  onRemoveFile: (fileId: string) => void;
}

export const FileUploadList: React.FC<FileUploadListProps> = ({
  files,
  onRemoveFile,
}) => {
  const getStatusIcon = (status: FileUploadStatus) => {
    switch (status) {
      case FileUploadStatus.COMPLETED:
        return <SuccessIcon color="success" />;
      case FileUploadStatus.FAILED:
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  return (
    <List>
      {files.map((file) => (
        <ListItem
          key={file.id}
          data-testid="file-upload-item"
          divider
          secondaryAction={
            <IconButton
              edge="end"
              onClick={() => onRemoveFile(file.id)}
              color="error"
            >
              <CancelIcon />
            </IconButton>
          }
        >
          <Box sx={{ width: "100%", display: "flex", alignItems: "center" }}>
            <Box sx={{ width: "100%", mr: 1 }}>
              <ListItemText
                primary={file.name}
                secondary={`${(file.size / 1024).toFixed(2)} KB`}
              />
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box sx={{ width: "100%", mr: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={file.progress}
                    color={
                      file.status === FileUploadStatus.FAILED
                        ? "error"
                        : "primary"
                    }
                  />
                </Box>
                <Box sx={{ minWidth: 35 }}>
                  <Typography variant="body2" color="text.secondary">
                    {`${file.progress}%`}
                  </Typography>
                </Box>
                {getStatusIcon(file.status)}
              </Box>
            </Box>
          </Box>
        </ListItem>
      ))}
    </List>
  );
};
