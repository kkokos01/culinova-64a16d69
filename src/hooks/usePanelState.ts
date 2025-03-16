
import { useState } from "react";

interface PanelState {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

export function usePanelState(initialState: boolean = false): PanelState {
  const [isOpen, setIsOpen] = useState(initialState);
  
  const toggle = () => setIsOpen(prev => !prev);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  
  return { isOpen, toggle, open, close };
}
