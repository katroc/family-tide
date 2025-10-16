import React, { ReactNode, useEffect } from 'react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  dismissible?: boolean;
}

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  dismissible = true
}) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dismissible, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!dismissible) {
      return;
    }

    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${SIZE_CLASSES[size]} rounded-2xl bg-white shadow-2xl`}
        onMouseDown={event => event.stopPropagation()}
      >
        {(title || dismissible) && (
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            {title ? <h2 className="text-lg font-semibold text-slate-800">{title}</h2> : <span />}
            {dismissible && (
              <button
                onClick={onClose}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close modal"
              >
                ×
              </button>
            )}
          </div>
        )}

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {children}
        </div>

        {footer && (
          <div className="border-t border-slate-200 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
