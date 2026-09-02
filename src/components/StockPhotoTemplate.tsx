import React from 'react';
import { format } from 'date-fns';

export interface StockPhotoRow {
  sizeName: string;
  total: number;
  available: number;
  onRent: number;
  borrowed: number;
  lost: number;
  damaged: number;
}

interface StockPhotoTemplateProps {
  elementId: string;
  title: string;
  categoryLabel: string;
  rows: StockPhotoRow[];
  generatedAt: Date;
  labels: {
    size: string;
    total: string;
    available: string;
    onRent: string;
    borrowed: string;
    lost: string;
    damaged: string;
    totalRow: string;
    dateTime: string;
  };
}

const sumBy = (rows: StockPhotoRow[], key: keyof StockPhotoRow) =>
  rows.reduce((sum, row) => sum + (Number(row[key]) || 0), 0);

/**
 * Print-friendly snapshot of the stock table. Rendered off-screen and captured
 * as a PNG, so every style is inline — html-to-image copies computed styles but
 * a plain table keeps the capture predictable across browsers.
 */
const StockPhotoTemplate: React.FC<StockPhotoTemplateProps> = ({
  elementId,
  title,
  categoryLabel,
  rows,
  generatedAt,
  labels,
}) => {
  const cellBase: React.CSSProperties = {
    padding: '8px 10px',
    fontSize: '15px',
    textAlign: 'center',
    borderRight: '1px solid #e5e7eb',
    borderBottom: '1px solid #e5e7eb',
  };

  const headCell: React.CSSProperties = {
    ...cellBase,
    fontWeight: 700,
    color: '#374151',
    background: '#f3f4f6',
    borderBottom: '2px solid #d1d5db',
  };

  const totalCell: React.CSSProperties = {
    ...cellBase,
    fontWeight: 700,
    background: '#f9fafb',
    borderTop: '2px solid #d1d5db',
  };

  return (
    <div
      id={elementId}
      style={{
        width: '900px',
        padding: '24px',
        background: '#ffffff',
        fontFamily: "'Noto Sans Gujarati', 'Inter', system-ui, sans-serif",
        color: '#111827',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          paddingBottom: '12px',
          borderBottom: '3px solid #111827',
        }}
      >
        <div>
          <div style={{ fontSize: '26px', fontWeight: 800, lineHeight: 1.2 }}>{title}</div>
          <div style={{ marginTop: '4px', fontSize: '16px', fontWeight: 600, color: '#4b5563' }}>
            {categoryLabel}
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '14px', color: '#4b5563' }}>
          <div style={{ fontWeight: 700, color: '#111827' }}>{labels.dateTime}</div>
          <div style={{ marginTop: '2px' }}>{format(generatedAt, 'dd/MM/yyyy')}</div>
          <div>{format(generatedAt, 'hh:mm a')}</div>
        </div>
      </div>

      <table
        style={{
          width: '100%',
          marginTop: '18px',
          borderCollapse: 'collapse',
          border: '1px solid #e5e7eb',
        }}
      >
        <thead>
          <tr>
            <th style={{ ...headCell, textAlign: 'left', minWidth: '150px' }}>{labels.size}</th>
            <th style={headCell}>{labels.total}</th>
            <th style={{ ...headCell, color: '#15803d' }}>{labels.available}</th>
            <th style={{ ...headCell, color: '#ea580c' }}>{labels.onRent}</th>
            <th style={{ ...headCell, color: '#9333ea' }}>{labels.borrowed}</th>
            <th style={{ ...headCell, color: '#d97706' }}>{labels.lost}</th>
            <th style={{ ...headCell, borderRight: 'none', color: '#e11d48' }}>{labels.damaged}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.sizeName} style={{ background: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
              <td style={{ ...cellBase, textAlign: 'left', fontWeight: 700 }}>{row.sizeName}</td>
              <td style={{ ...cellBase, fontWeight: 600 }}>{row.total}</td>
              <td style={{ ...cellBase, fontWeight: 700, color: '#15803d' }}>{row.available}</td>
              <td style={{ ...cellBase, fontWeight: 700, color: '#ea580c' }}>{row.onRent}</td>
              <td style={{ ...cellBase, fontWeight: 700, color: '#9333ea' }}>{row.borrowed}</td>
              <td style={{ ...cellBase, fontWeight: 700, color: '#d97706' }}>{row.lost}</td>
              <td style={{ ...cellBase, borderRight: 'none', fontWeight: 700, color: '#e11d48' }}>
                {row.damaged}
              </td>
            </tr>
          ))}
          <tr>
            <td style={{ ...totalCell, textAlign: 'left' }}>{labels.totalRow}</td>
            <td style={totalCell}>{sumBy(rows, 'total')}</td>
            <td style={{ ...totalCell, color: '#15803d' }}>{sumBy(rows, 'available')}</td>
            <td style={{ ...totalCell, color: '#ea580c' }}>{sumBy(rows, 'onRent')}</td>
            <td style={{ ...totalCell, color: '#9333ea' }}>{sumBy(rows, 'borrowed')}</td>
            <td style={{ ...totalCell, color: '#d97706' }}>{sumBy(rows, 'lost')}</td>
            <td style={{ ...totalCell, borderRight: 'none', color: '#e11d48' }}>
              {sumBy(rows, 'damaged')}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default StockPhotoTemplate;
