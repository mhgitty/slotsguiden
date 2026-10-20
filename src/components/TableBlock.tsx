interface TableBlockValue {
  title?: string
  headers?: string[]
  rows?: Array<{ cells?: string[] }>
}

// Content table (Portable Text block). Card-style frame, quiet uppercase header,
// hover rows; scrolls sideways inside its frame on narrow screens.
export function TableBlock({ value }: { value: TableBlockValue }) {
  const { title, headers, rows } = value
  const hasHeaders = (headers?.length ?? 0) > 0
  const cols = Math.max(headers?.length ?? 0, ...(rows ?? []).map((r) => r.cells?.length ?? 0))

  return (
    <figure className="sg-table">
      {title && <figcaption className="sg-table-title">{title}</figcaption>}
      <div className="sg-table-frame">
        <div className="sg-table-scroll">
          <table className={cols > 3 ? 'is-wide' : undefined}>
            {hasHeaders && (
              <thead>
                <tr>
                  {(headers ?? []).map((h, i) => <th key={i} scope="col">{h}</th>)}
                </tr>
              </thead>
            )}
            <tbody>
              {(rows ?? []).map((row, ri) => (
                <tr key={ri}>
                  {(row.cells ?? []).map((cell, ci) => (
                    <td key={ci} className={ci === 0 ? 'is-first' : undefined}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </figure>
  )
}
