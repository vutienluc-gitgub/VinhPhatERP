import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

import { Icon } from '@/shared/components/Icon';

export function GlobalErrorElement() {
  const error = useRouteError();

  // Tự động tải lại trang 1 lần nếu gặp lỗi tải Chunk (ví dụ: vừa deploy bản mới)
  if (
    error instanceof TypeError &&
    (error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Importing a module script failed'))
  ) {
    if (!sessionStorage.getItem('chunk_load_error_reloaded')) {
      sessionStorage.setItem('chunk_load_error_reloaded', 'true');
      window.location.reload();
      return null;
    }
  }

  // Xóa cờ nếu lỗi khác hoặc đã tải lại thành công
  sessionStorage.removeItem('chunk_load_error_reloaded');

  let errorMessage = 'Đã có lỗi không mong muốn xảy ra.';
  if (isRouteErrorResponse(error)) {
    errorMessage = `${error.status} ${error.statusText}: ${error.data}`;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-surface p-8 text-center shadow-xl border border-default">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-danger-soft">
          <Icon name="TriangleAlert" className="h-8 w-8 text-danger" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Oops! Có lỗi xảy ra
        </h1>
        <p className="mb-6 text-muted-foreground">
          Ứng dụng gặp sự cố. Vui lòng thử lại hoặc quay về trang chủ.
        </p>

        <div className="mb-8 rounded-lg bg-red-50 p-4 text-left text-sm text-danger break-words font-mono overflow-auto max-h-32">
          {errorMessage}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-info-soft px-5 py-2.5 text-sm font-medium text-inverse-foreground transition-colors hover:bg-info-soft"
          >
            <Icon name="RefreshCw" className="h-4 w-4" />
            Tải lại trang
          </button>

          <button
            onClick={() => {
              window.location.href = '/';
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-muted bg-surface px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-gray-50"
          >
            <Icon name="Home" className="h-4 w-4" />
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
