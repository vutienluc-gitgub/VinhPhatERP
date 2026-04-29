import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ChatImagePreviewProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

/**
 * Lightbox-style full image preview.
 * Opens when user taps a chat image bubble.
 * Supports click-outside and Escape to close.
 */
export function ChatImagePreview({ src, alt, onClose }: ChatImagePreviewProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const mount = document.getElementById('modal-root');
  if (!mount) return null;

  return createPortal(
    <div
      className="chat-lightbox-overlay"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div className="chat-lightbox-container">
        {/* Close button */}
        <button
          type="button"
          className="chat-lightbox-close"
          onClick={onClose}
          aria-label="Dong"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Loading spinner */}
        {!loaded && (
          <div className="chat-lightbox-loading">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="chat-lightbox-spinner"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        )}

        {/* Image */}
        <img
          src={src}
          alt={alt ?? 'Xem hinh anh'}
          className={`chat-lightbox-image ${loaded ? 'chat-lightbox-image--loaded' : ''}`}
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>,
    mount,
  );
}
