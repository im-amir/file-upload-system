import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
} from "@mui/material";

interface FilePreviewDialogProps {
  previewData: {
    headers: string[];
    rows: any[];
    total_rows?: number;
  } | null;
  handleClosePreview: () => void;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  hasMoreData?: boolean;
}

export const FilePreviewDialog: React.FC<FilePreviewDialogProps> = ({
  previewData,
  handleClosePreview,
  onLoadMore,
  isLoadingMore,
  hasMoreData,
}) => {
  if (!previewData) {
    return null;
  }

  return (
    <Dialog
      open={!!previewData}
      onClose={handleClosePreview}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>File Preview</DialogTitle>
      <DialogContent>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {previewData.headers.map((header) => (
                  <TableCell key={header}>{header}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {previewData.rows.map((row, index) => (
                <TableRow key={`${row.id}-${index}`}>
                  {previewData.headers.map((header) => (
                    <TableCell key={`${row.id}-${header}`}>
                      {row[header] || "N/A"}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {onLoadMore && hasMoreData && (
          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Button
              onClick={onLoadMore}
              variant="contained"
              disabled={isLoadingMore}
              sx={{ minWidth: 200 }}
            >
              {isLoadingMore ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  Loading...
                </Box>
              ) : (
                "Load More"
              )}
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
