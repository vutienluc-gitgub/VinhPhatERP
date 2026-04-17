export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
}: {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        {showHeader && (
          <thead>
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i}>
                  <div className="skeleton-block h-4 w-[60%] min-w-[40px]" />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c}>
                  <div
                    className={`skeleton-block h-6 min-w-[60px] ${c === 0 ? 'w-[80%]' : 'w-full'}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
