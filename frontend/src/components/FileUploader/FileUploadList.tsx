import React from "react";
import {
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
  FileUploadListContainer,
  FileUploadListItem,
  FileUploadContainer,
  FileDetailsContainer,
  ProgressContainer,
  ProgressWrapper,
  ProgressPercentage,
  SecondaryActionContainer,
} from "./elements";

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
    <FileUploadListContainer data-testid="upload-list">
      {files.map((file) => (
        <FileUploadListItem
          key={file.id}
          data-testid="file-upload-item"
          divider
          secondaryAction={
            <SecondaryActionContainer>
              <IconButton
                edge="end"
                onClick={() => onRemoveFile(file.id)}
                color="error"
              >
                <CancelIcon />
              </IconButton>
            </SecondaryActionContainer>
          }
        >
          <FileUploadContainer>
            <FileDetailsContainer>
              <ListItemText
                primary={file.name}
                secondary={`${(file.size / (1024 * 1024)).toFixed(2)} MB`}
              />
              <ProgressContainer>
                <ProgressWrapper>
                  <LinearProgress
                    data-testid="progress-bar"
                    variant="determinate"
                    value={file.progress}
                    color={
                      file.status === FileUploadStatus.FAILED
                        ? "error"
                        : "primary"
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
        </FileUploadListItem>
      ))}
    </FileUploadListContainer>
  );
};
