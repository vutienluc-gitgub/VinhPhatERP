import { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: ReactNode;
}

export function Portal({ children }: PortalProps) {
  const mount = document.getElementById('modal-root');
  if (!mount) return null;
  return createPortal(children, mount);
}
