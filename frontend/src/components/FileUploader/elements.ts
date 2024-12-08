import { Box, List, ListItem } from "@mui/material";
import { styled } from "@mui/material/styles";

export const FileUploadContainer = styled(Box)(({}) => ({
  width: "100%",
  display: "flex",
  alignItems: "center",
}));

export const FileDetailsContainer = styled(Box)(({}) => ({
  width: "100%",
  marginRight: 8,
}));

export const ProgressContainer = styled(Box)(({}) => ({
  display: "flex",
  alignItems: "center",
}));

export const ProgressWrapper = styled(Box)(({}) => ({
  width: "100%",
  marginRight: 8,
}));

export const ProgressPercentage = styled(Box)(({}) => ({
  minWidth: 35,
}));

export const FileUploadListContainer = styled(List)(({}) => ({
  width: "100%",
}));

export const FileUploadListItem = styled(ListItem)(({}) => ({
  width: "100%",
}));

export const SecondaryActionContainer = styled(Box)(({}) => ({
  display: "flex",
  alignItems: "center",
}));

export const DropzoneContainer = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.primary.main}`,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(4),
  textAlign: "center",
  cursor: "pointer",
  transition: "background-color 0.3s ease",
  position: "relative", // Add relative positioning
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));
