import type { ReactNode } from 'react';

export interface DataTableColumn {
  key: string;
  label: ReactNode;
  numeric?: boolean;
}

export interface DataTableProps {
  columns: DataTableColumn[];
  rows: Array<Record<string, ReactNode>>;
  caption?: ReactNode;
  className?: string;
}

export function DataTable({
  columns,
  rows,
  caption,
  className,
}: DataTableProps): JSX.Element {
  return (
    <table
      className={['w-full border-collapse text-sm', className]
        .filter(Boolean)
        .join(' ')}
    >
      {caption !== undefined ? (
        <caption className="text-left font-mono text-xs uppercase tracking-wider text-marine">
          {caption}
        </caption>
      ) : null}
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              className={[
                'border-b border-hair py-2 font-mono text-xs uppercase tracking-wider text-marine',
                column.numeric ? 'text-right' : 'text-left',
              ].join(' ')}
              key={column.key}
              scope="col"
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr className="border-b border-hair" key={rowIndex}>
            {columns.map((column) => (
              <td
                className={[
                  'py-2',
                  column.numeric
                    ? 'text-right font-mono tabular-nums'
                    : 'text-left text-ink',
                ].join(' ')}
                key={column.key}
              >
                {row[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
