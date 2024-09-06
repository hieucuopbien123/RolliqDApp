import React from "react";
import { Container } from "theme-ui";

export const Modal = ({ children }) => (
  <Container variant="modalOverlay" style={{zIndex: 2}}>
    <Container variant="modal">{children}</Container>
  </Container>
);
