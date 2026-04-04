import { Toaster } from 'sonner';

export function Toast() {
  return (
    <Toaster
      theme="dark"
      position="top-right"
      richColors
      closeButton
      expand={false}
      visibleToasts={3}
    />
  );
}
