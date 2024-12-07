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
} from "@mui/material";

export const FilePreviewDialog = ({
  previewData,
  handleClosePreview,
  onLoadMore,
  isLoadingMore,
}: {
  previewData: {
    headers: string[];
    rows: any[];
    total_rows?: number;
  } | null;
  handleClosePreview: () => void;
  onLoadMore?: () => void; // Make it optional
  isLoadingMore?: boolean;
}) => {
  console.log("Preview Data:", previewData);
  if (!previewData) {
    return (
      <Dialog open={false} onClose={handleClosePreview}>
        <DialogTitle>File Preview</DialogTitle>
        <DialogContent>
          <Typography>No preview available</Typography>
        </DialogContent>
      </Dialog>
    );
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
              {previewData.rows.map((row) => (
                <TableRow key={row.id}>
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
        {onLoadMore &&
          previewData &&
          previewData.rows.length < (previewData.total_rows || 0) && (
            <Button
              onClick={onLoadMore}
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? "Loading..." : "Load More"}
            </Button>
          )}
      </DialogContent>
    </Dialog>
  );
};
