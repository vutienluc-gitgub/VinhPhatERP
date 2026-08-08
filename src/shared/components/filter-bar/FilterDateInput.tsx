interface FilterDateInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string | undefined) => void;
}

/**
 * FilterDateInput — Input date tái sử dụng cho cả date field và date_range.
 * Giải quyết duplicate JSX giữa keyFrom và keyTo trong date_range.
 */
export function FilterDateInput({
  id,
  label,
  value,
  onChange,
}: FilterDateInputProps) {
  return (
    <div className="flex flex-col gap-1 flex-1 min-w-0">
      <label
        htmlFor={id}
        className="text-[0.7rem] font-semibold text-muted-foreground uppercase tracking-wide"
      >
        {label}
      </label>
      <input
        id={id}
        className="field-input"
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value || undefined)}
      />
    </div>
  );
}
