export function TableSkeleton({ rows = 5, columns = 4, showHeader = true }: { rows?: number; columns?: number; showHeader?: boolean }) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        {showHeader && (
          <thead>
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i}>
                  <div className="skeleton-block" style={{ height: '1rem', width: '60%', minWidth: '40px' }} />
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
                  <div className="skeleton-block" style={{ height: '1.5rem', width: c === 0 ? '80%' : '100%', minWidth: '60px' }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
