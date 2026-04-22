import { useRef, useState, useCallback, useEffect } from 'react';

import { Button } from '@/shared/components';

interface ParsedRoll {
  roll_number: string;
  weight_kg: number;
  length_m?: number;
}

interface PasteExcelParserProps {
  onImport: (rolls: ParsedRoll[]) => void;
  autoPrefix?: string;
}

/**
 * Cho phép người dùng paste dữ liệu từ Excel (2 hoặc 3 cột: Mã cuộn, KG, [Dài m])
 * hoặc sinh tự động mã cuộn liên tiếp.
 */
export function PasteExcelParser({
  onImport,
  autoPrefix = 'VP-',
}: PasteExcelParserProps) {
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [showAutoGen, setShowAutoGen] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  // ── Auto-gen state ──
  const [prefix, setPrefix] = useState(autoPrefix);

  useEffect(() => {
    setPrefix(autoPrefix);
  }, [autoPrefix]);
  const [startNum, setStartNum] = useState(1);
  const [count, setCount] = useState(10);

  const handleParse = useCallback(() => {
    const clipboardText = textRef.current?.value ?? '';
    if (!clipboardText.trim()) return;

    const clipboardLines = clipboardText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const importedRolls: ParsedRoll[] = [];
    for (const currentLine of clipboardLines) {
      // Excel clipboard tab-separated, or comma-separated
      const cellValues = currentLine
        .split(/[\t,;]+/)
        .map((cell) => cell.trim());
      if (cellValues.length < 2) continue;

      const [pRollNumber, pWeightKg, pLengthM] = cellValues;

      const parsedRollNumber = pRollNumber;
      const parsedWeightKg = parseFloat(pWeightKg ?? '');
      if (!parsedRollNumber || isNaN(parsedWeightKg) || parsedWeightKg <= 0)
        continue;

      const parsedLengthM =
        cellValues.length >= 3 ? parseFloat(pLengthM ?? '') : undefined;

      importedRolls.push({
        roll_number: parsedRollNumber,
        weight_kg: parsedWeightKg,
        length_m:
          parsedLengthM !== undefined &&
          !isNaN(parsedLengthM) &&
          parsedLengthM > 0
            ? parsedLengthM
            : undefined,
      });
    }

    if (importedRolls.length > 0) {
      onImport(importedRolls);
      setShowPasteArea(false);
      if (textRef.current) textRef.current.value = '';
    }
  }, [onImport]);

  const handleAutoGenerate = useCallback(() => {
    if (count <= 0 || count > 200) return;
    const rolls: ParsedRoll[] = [];
    for (let i = 0; i < count; i++) {
      const num = String(startNum + i).padStart(3, '0');
      rolls.push({
        roll_number: `${prefix}${num}`,
        weight_kg: 0,
      });
    }
    onImport(rolls);
    setShowAutoGen(false);
  }, [prefix, startNum, count, onImport]);

  return (
    <div className="flex flex-col gap-3">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          type="button"
          onClick={() => {
            setShowPasteArea((v) => !v);
            setShowAutoGen(false);
          }}
        >
          Paste từ Excel
        </Button>
        <Button
          variant="secondary"
          type="button"
          onClick={() => {
            setShowAutoGen((v) => !v);
            setShowPasteArea(false);
          }}
        >
          Tự động sinh mã
        </Button>
      </div>

      {/* Paste area */}
      {showPasteArea && (
        <div className="rounded-xl border border-dashed border-indigo-300 bg-indigo-50/30 p-4">
          <p className="text-sm text-[var(--text-secondary)] mb-2">
            Dán dữ liệu từ Excel (2-3 cột: Mã cuộn, KG, Dài m). Mỗi dòng 1 cuộn.
          </p>
          <textarea
            ref={textRef}
            className="field-textarea w-full font-mono text-sm"
            rows={6}
            placeholder={`VP-001\t15.5\t50\nVP-002\t18.2\t48\nVP-003\t12.8`}
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <Button type="button" onClick={handleParse}>
              Nhập {'>'}
              {'>'}
              {'>'}
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setShowPasteArea(false)}
            >
              Hủy
            </Button>
          </div>
        </div>
      )}

      {/* Auto-generate */}
      {showAutoGen && (
        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/30 p-4">
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            Tự động sinh mã cuộn liên tiếp. Bạn chỉ cần điền số KG sau.
          </p>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="form-field" style={{ minWidth: 120 }}>
              <label className="text-xs font-semibold">Tiền tố</label>
              <input
                className="field-input"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="VP-"
              />
            </div>
            <div className="form-field" style={{ minWidth: 90 }}>
              <label className="text-xs font-semibold">Bắt đầu từ</label>
              <input
                className="field-input"
                type="number"
                min={1}
                value={startNum}
                onChange={(e) => setStartNum(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="form-field" style={{ minWidth: 90 }}>
              <label className="text-xs font-semibold">Số cuộn</label>
              <input
                className="field-input"
                type="number"
                min={1}
                max={200}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 10)}
              />
            </div>
            <Button type="button" onClick={handleAutoGenerate}>
              Sinh {count} cuộn
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setShowAutoGen(false)}
            >
              Hủy
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
