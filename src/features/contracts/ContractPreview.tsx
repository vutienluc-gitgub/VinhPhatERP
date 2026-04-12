import { useRef, useEffect } from 'react';

interface ContractPreviewProps {
  content: string;
  contractNumber?: string;
}

export function ContractPreview({
  content,
  contractNumber,
}: ContractPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Inject A4 base styles into the HTML content
  const wrappedContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13pt;
      line-height: 1.6;
      color: #1a1a1a;
      background: #f0f0f0;
      padding: 24px 16px;
    }
    .a4-page {
      background: #ffffff;
      width: 794px;
      min-height: 1123px;
      margin: 0 auto;
      padding: 60px 72px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.12);
    }
    table { width: 100%; border-collapse: collapse; }
    td, th { padding: 4px 8px; }
    p { margin-bottom: 8px; }
    h1, h2, h3 { margin-bottom: 12px; }
  </style>
</head>
<body>
  <div class="a4-page">
    ${content}
  </div>
</body>
</html>`;

  // Resize iframe to fit content height after load
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      try {
        const doc = iframe.contentDocument;
        if (doc) {
          const height = doc.documentElement.scrollHeight;
          iframe.style.height = `${height}px`;
        }
      } catch {
        // cross-origin guard — srcdoc is same-origin so this should not trigger
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, [content]);

  return (
    <div className="flex flex-col gap-2 w-full">
      {contractNumber && (
        <p className="text-xs text-gray-500 font-mono">
          Số hợp đồng: {contractNumber}
        </p>
      )}
      <div className="w-full overflow-x-auto rounded-lg border border-gray-200 bg-gray-100">
        <iframe
          ref={iframeRef}
          srcDoc={wrappedContent}
          title={
            contractNumber ? `Hợp đồng ${contractNumber}` : 'Xem trước hợp đồng'
          }
          sandbox="allow-same-origin"
          className="w-full border-0"
          style={{ minHeight: '600px' }}
        />
      </div>
    </div>
  );
}
