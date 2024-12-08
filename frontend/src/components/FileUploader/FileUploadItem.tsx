import React from "react";
import {
  ListItem,
  ListItemText,
  LinearProgress,
  Typography,
  IconButton,
} from "@mui/material";
import {
  Cancel as CancelIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { FileUpload, FileUploadStatus } from "../../types/file";
import {
  FileDetailsContainer,
  FileUploadContainer,
  ProgressContainer,
  ProgressPercentage,
  ProgressWrapper,
} from "./elements";

interface FileUploadItemProps {
  file: FileUpload;
  onRemoveFile: (fileId: string) => void;
}

export const FileUploadItem: React.FC<FileUploadItemProps> = ({
  file,
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
    <ListItem
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
      <FileUploadContainer>
        <FileDetailsContainer>
          <ListItemText
            primary={file.name}
            secondary={`${(file.size / 1024).toFixed(2)} KB`}
          />
          <ProgressContainer>
            <ProgressWrapper>
              <LinearProgress
                variant="determinate"
                value={file.progress}
                color={
                  file.status === FileUploadStatus.FAILED ? "error" : "primary"
                }
              />
            </ProgressWrapper>
            <ProgressPercentage>
              <Typography variant="body2" color="text.secondary">
                {`${file.progress}%`}
              </Typography>
            </ProgressPercentage>
            {getStatusIcon(file.status)}
          </ProgressContainer>
        </FileDetailsContainer>
      </FileUploadContainer>
    </ListItem>
  );
};
