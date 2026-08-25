import type {
  BarcodeBlock,
  DocumentType,
  PrintLayout,
  PrintTemplateEntity,
  QRBlock,
  SignatureBlock,
  TableBlock,
  TemplateBlock,
  TextBlock,
} from '@/domain/print';

import { PageInspector } from './PageInspector';
import { TextBlockInspector } from './TextBlockInspector';
import { TableBlockInspector } from './TableBlockInspector';
import { QRBarcodeInspector } from './QRBarcodeInspector';
import { SignatureInspector } from './SignatureInspector';

interface PropertyInspectorProps {
  template: PrintTemplateEntity;
  layout: PrintLayout;
  selectedBlockId: string | null;
  documentType: DocumentType;
  onUpdateLayout: (newLayout: PrintLayout) => void;
  onUpdateTemplate: (updates: Partial<PrintTemplateEntity>) => void;
}

export function PropertyInspector({
  template,
  layout,
  selectedBlockId,
  documentType,
  onUpdateLayout,
  onUpdateTemplate,
}: PropertyInspectorProps) {
  const selectedBlock = layout.blocks.find((b) => b.id === selectedBlockId);

  const handleUpdateBlock = (updatedBlock: TemplateBlock) => {
    const nextBlocks = layout.blocks.map((b) =>
      b.id === updatedBlock.id ? updatedBlock : b,
    );
    onUpdateLayout({
      ...layout,
      blocks: nextBlocks,
    });
  };

  return (
    <div className="flex flex-col h-full bg-surface border-l border-default overflow-y-auto select-none">
      {!selectedBlock ? (
        <PageInspector
          template={template}
          layout={layout}
          onUpdateLayout={onUpdateLayout}
          onUpdateTemplate={onUpdateTemplate}
        />
      ) : selectedBlock.type === 'text' ? (
        <TextBlockInspector
          block={selectedBlock as TextBlock}
          documentType={documentType}
          onUpdateBlock={handleUpdateBlock}
        />
      ) : selectedBlock.type === 'table' ? (
        <TableBlockInspector
          block={selectedBlock as TableBlock}
          onUpdateBlock={handleUpdateBlock}
        />
      ) : selectedBlock.type === 'qr' || selectedBlock.type === 'barcode' ? (
        <QRBarcodeInspector
          block={selectedBlock as QRBlock | BarcodeBlock}
          onUpdateBlock={handleUpdateBlock}
        />
      ) : selectedBlock.type === 'signature' ? (
        <SignatureInspector
          block={selectedBlock as SignatureBlock}
          onUpdateBlock={handleUpdateBlock}
        />
      ) : (
        <div className="p-4 text-xs text-muted">
          Chọn khối khác hoặc nhấp ra ngoài để chỉnh trang.
        </div>
      )}
    </div>
  );
}
