import { useState, useEffect, useCallback, useRef } from 'react';

type ViewportInfo = {
  height: number;
  width: number;
  offsetTop: number;
  isKeyboardOpen: boolean;
};

/**
 * Hook đa nền tảng để xử lý kích thước Viewport và nhận diện bàn phím ảo (Virtual Keyboard).
 * Khắc phục sự khác biệt giữa iOS Safari (visualViewport thay đổi, innerHeight giữ nguyên)
 * và Android Chrome (cả 2 đều thay đổi).
 */
export function useVisualViewport(): ViewportInfo {
  // Lưu trữ chiều cao tối đa từng ghi nhận để đối chiếu (giúp phát hiện bàn phím trên Android)
  const maxVhRef = useRef(
    typeof window !== 'undefined' ? window.innerHeight : 0,
  );

  const [info, setInfo] = useState<ViewportInfo>({
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    offsetTop: 0,
    isKeyboardOpen: false,
  });

  const updateViewport = useCallback(() => {
    if (typeof window === 'undefined') return;

    const currentInnerHeight = window.innerHeight;
    // Cập nhật maxVhRef khi xoay màn hình hoặc thanh URL bar ẩn đi (làm viewport cao hơn)
    // Nếu bàn phím đang mở (innerHeight nhỏ đi), ta KHÔNG cập nhật maxVhRef
    if (currentInnerHeight > maxVhRef.current) {
      maxVhRef.current = currentInnerHeight;
    }

    let vh: number;
    let vw: number;
    let offsetTop = 0;

    if (window.visualViewport) {
      vh = window.visualViewport.height;
      vw = window.visualViewport.width;
      offsetTop = window.visualViewport.offsetTop;
    } else {
      vh = currentInnerHeight;
      vw = window.innerWidth;
    }

    // Nhận diện bàn phím mở:
    // Nếu chiều cao hiện tại (vh) nhỏ hơn đáng kể (> 150px) so với chiều cao lớn nhất từng biết
    // (Bàn phím thường cao từ 250px - 350px. URL bar thường < 100px)
    const isKeyboardOpen = maxVhRef.current - vh > 150;

    // Gán CSS Variable để sử dụng toàn cục trong stylesheet
    document.documentElement.style.setProperty('--vv-height', `${vh}px`);
    document.documentElement.style.setProperty(
      '--keyboard-height',
      `${Math.max(0, maxVhRef.current - vh)}px`,
    );

    setInfo({
      height: vh,
      width: vw,
      offsetTop,
      isKeyboardOpen,
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    updateViewport();

    if (window.visualViewport) {
      // VisualViewport API (Modern Mobile Browsers)
      window.visualViewport.addEventListener('resize', updateViewport);
      window.visualViewport.addEventListener('scroll', updateViewport);
    } else {
      // Fallback
      window.addEventListener('resize', updateViewport);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewport);
        window.visualViewport.removeEventListener('scroll', updateViewport);
      } else {
        window.removeEventListener('resize', updateViewport);
      }
    };
  }, [updateViewport]);

  return info;
}
