import { Box } from "@chakra-ui/layout";
import React, { FC } from "react";

interface WrapperBox {
  variant?: "small" | "regular";
}

export const Wrapper: FC<WrapperBox> = ({ children, variant = "regular" }) => {
  return (
    <Box
      maxW={variant === "regular" ? "800px" : "400px"}
      width="100%"
      mt="8px"
      m="auto"
    >
      {children}
    </Box>
  );
};
