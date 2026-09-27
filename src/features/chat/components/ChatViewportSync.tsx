import { useVisualViewport } from '@/shared/hooks/useVisualViewport';

/**
 * Đồng bộ `--vv-height` / `--vv-offset-top` để `.chat-drawer` luôn khớp vùng đang
 * hiển thị (iOS Safari không co `100dvh` khi bàn phím mở).
 * Tách thành component rỗng để chỉ nó re-render theo viewport, không kéo theo
 * cả ChatDrawer và danh sách tin nhắn.
 */
export function ChatViewportSync() {
  useVisualViewport();
  return null;
}
