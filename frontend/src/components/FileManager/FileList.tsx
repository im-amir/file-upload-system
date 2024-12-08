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
  CircularProgress,
  Box,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Visibility as PreviewIcon,
} from "@mui/icons-material";
import { UploadedFile } from "../../types/file";
import { useFileManager } from "../../hooks/useFileManager";
import { FilePreviewDialog } from "./FilePreviewDialog";
import { toast } from "sonner";

export const FileList: React.FC = () => {
  const { files, downloadFile, previewFile, isLoading } = useFileManager();
  const [previewData, setPreviewData] = useState<{
    headers: string[];
    rows: any[];
    total_rows?: number;
  } | null>(null);
  const [previewSkip, setPreviewSkip] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [selectedFile, setSelectedFile] = useState<Partial<UploadedFile>>({});
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const handleDownload = (file: UploadedFile) => {
    downloadFile(file);
  };

  const handlePreview = async (file: UploadedFile) => {
    setSelectedFile(file);
    setIsLoadingPreview(true);
    setPreviewSkip(0);
    setHasMoreData(true);
    toast.info("Loading preview...");
    const content = await previewFile(file);
    if (content) {
      setPreviewData(content);
      setHasMoreData(content.rows.length === 100);
    }
    setIsLoadingPreview(false);
  };

  const handleLoadMore = async () => {
    if (previewData && hasMoreData) {
      setIsLoadingMore(true);

      try {
        const nextSkip = previewSkip + 100;
        const moreContent = await previewFile(selectedFile, nextSkip, 100);

        if (moreContent && moreContent.rows.length > 0) {
          setPreviewData({
            headers: previewData.headers,
            rows: [...previewData.rows, ...moreContent.rows],
            total_rows: moreContent.total_rows,
          });

          setPreviewSkip(nextSkip);
          setHasMoreData(moreContent.rows.length === 100);
        } else {
          // No file URL available
          setHasMoreData(false);
        }
      } catch (error) {
        console.error("Error loading more data:", error);
        setHasMoreData(false);
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  const handleClosePreview = () => {
    setPreviewData(null);
    setPreviewSkip(0);
    setHasMoreData(true);
  };

  return (
    <Box data-testid="file-list">
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>File Name</TableCell>
              <TableCell>Size (MB)</TableCell>
              <TableCell>Upload Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : files.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No files uploaded
                </TableCell>
              </TableRow>
            ) : (
              files.map((file: any) => (
                <TableRow key={file.id}>
                  <TableCell>{file.name}</TableCell>
                  <TableCell>
                    {(file.size / (1024 * 1024)).toFixed(2)}
                  </TableCell>
                  <TableCell data-testid="upload-date">
                    {file.uploadDate.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Download">
                      <IconButton
                        data-testid="download-button"
                        onClick={() => handleDownload(file)}
                        disabled={isLoadingPreview}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Preview">
                      <IconButton
                        data-testid="preview-button"
                        onClick={() => handlePreview(file)}
                        disabled={isLoadingPreview}
                      >
                        <PreviewIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <FilePreviewDialog
        previewData={previewData}
        handleClosePreview={handleClosePreview}
        onLoadMore={handleLoadMore}
        isLoadingMore={isLoadingMore}
        hasMoreData={hasMoreData}
      />
    </Box>
  );
};
