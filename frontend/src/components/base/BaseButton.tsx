import React from "react";
import { Button, ButtonProps } from "@mui/material";

interface BaseButtonProps extends ButtonProps {
  variant?: "contained" | "outlined" | "text";
  color?: "primary" | "secondary" | "error" | "success";
  testId?: string;
}

export const BaseButton: React.FC<BaseButtonProps> = ({
  children,
  variant = "contained",
  color = "primary",
  testId,
  ...props
}) => {
  return (
    <Button data-testid={testId} variant={variant} color={color} {...props}>
      {children}
    </Button>
  );
};
