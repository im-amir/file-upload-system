import React from "react";
import { Button, ButtonProps } from "@mui/material";

interface BaseButtonProps extends ButtonProps {
  variant?: "contained" | "outlined" | "text";
  color?: "primary" | "secondary" | "error" | "success";
}

const BaseButton: React.FC<BaseButtonProps> = ({
  children,
  variant = "contained",
  color = "primary",
  ...props
}) => {
  return (
    <Button
      data-testid="upload-button"
      variant={variant}
      color={color}
      {...props}
    >
      {children}
    </Button>
  );
};

export default BaseButton;
