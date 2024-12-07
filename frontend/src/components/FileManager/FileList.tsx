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
} from "@mui/material";
import {
  Download as DownloadIcon,
  Visibility as PreviewIcon,
} from "@mui/icons-material";
import { UploadedFile } from "../../types/file";
import { useFileManager } from "../../hooks/useFileManager";
import { FilePreviewDialog } from "@/components/FileManager/FilePreviewDialog";

export const FileList: React.FC = () => {
  const { files, downloadFile, previewFile, isLoading } = useFileManager();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [previewSkip, setPreviewSkip] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [previewData, setPreviewData] = useState<{
    headers: string[];
    rows: any[];
    total_rows?: number;
  } | null>(null);
  const handleDownload = (file: UploadedFile) => {
    downloadFile(file);
  };

  const handlePreview = async (file: UploadedFile) => {
    setPreviewSkip(0);
    setHasMoreData(true);
    const content = await previewFile(file);
    if (content) {
      setPreviewData(content);
      // Check if we've reached the end of data
      setHasMoreData(content.rows.length === 100);
    }
  };

  const handleLoadMore = async () => {
    if (previewData && hasMoreData) {
      setIsLoadingMore(true);
      const file = files.find((f) => f.url === previewData.rows[0].url);

      if (file) {
        const nextSkip = previewSkip + 100;
        const moreContent = await previewFile(file, nextSkip, 100);

        if (moreContent && moreContent.rows.length > 0) {
          setPreviewData({
            headers: previewData.headers,
            rows: [...previewData.rows, ...moreContent.rows],
            total_rows: moreContent.total_rows,
          });
          setPreviewSkip(nextSkip);

          // Check if we've reached the end of data
          setHasMoreData(moreContent.rows.length === 100);
        } else {
          setHasMoreData(false);
        }
      }
      setIsLoadingMore(false);
    }
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
              files.map((file) => (
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
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <FilePreviewDialog
        previewData={previewData}
        handleClosePreview={() => setPreviewData(null)}
        onLoadMore={handleLoadMore}
        isLoadingMore={isLoadingMore}
      />
    </>
  );
};
