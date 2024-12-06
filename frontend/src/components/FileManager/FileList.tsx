import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Visibility as PreviewIcon,
} from "@mui/icons-material";
import { UploadedFile } from "../../types/file";
import { useFileManager } from "../../hooks/useFileManager";

const FileList: React.FC = () => {
  const { files, downloadFile, previewFile } = useFileManager();
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  const handleDownload = (file: UploadedFile) => {
    downloadFile(file);
  };

  const handlePreview = async (file: UploadedFile) => {
    const content = await previewFile(file);
    setPreviewContent(content);
  };

  const handleClosePreview = () => {
    setPreviewContent(null);
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>File Name</TableCell>
              <TableCell>Size (KB)</TableCell>
              <TableCell>Upload Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell>{file.name}</TableCell>
                <TableCell>{(file.size / 1024).toFixed(2)}</TableCell>
                <TableCell>{file.uploadDate.toLocaleString()}</TableCell>
                <TableCell>
                  <Tooltip title="Download">
                    <IconButton onClick={() => handleDownload(file)}>
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Preview">
                    <IconButton onClick={() => handlePreview(file)}>
                      <PreviewIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!previewContent} onClose={handleClosePreview}>
        <DialogTitle>File Preview</DialogTitle>
        <DialogContent>
          <Typography variant="body2" component="pre">
            {previewContent}
          </Typography>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FileList;
