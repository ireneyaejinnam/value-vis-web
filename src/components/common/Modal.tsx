import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizeClass} bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-border animate-slide-up max-h-[90vh] flex flex-col`}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
            <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors">
              <X size={15} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
