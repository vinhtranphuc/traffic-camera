"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  size: number;
  total: number;
  onPageChange: (page: number) => void;
  onSizeChange?: (size: number) => void;
  sizeOptions?: number[];
}

export default function Pagination({
  page, size, total, onPageChange, onSizeChange,
  sizeOptions = [10, 25, 50, 100],
}: Props) {
  if (total === 0) return null;

  const totalPages = Math.max(1, Math.ceil(total / size));
  const from = page * size + 1;
  const to = Math.min((page + 1) * size, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
      <span className="text-muted-foreground">
        Hiển thị <strong className="text-foreground">{from}</strong>–<strong className="text-foreground">{to}</strong> / <strong className="text-foreground">{total.toLocaleString()}</strong>
      </span>
      <div className="flex items-center gap-2">
        {onSizeChange && (
          <select
            value={size}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            className="rounded border border-border bg-card px-2 py-1 text-xs"
            aria-label="Số dòng mỗi trang"
          >
            {sizeOptions.map((n) => <option key={n} value={n}>{n}/trang</option>)}
          </select>
        )}
        <button
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          className="flex items-center gap-1 rounded border border-border px-2 py-1 disabled:opacity-50"
          aria-label="Trang trước"
        >
          <ChevronLeft className="h-3 w-3" aria-hidden="true" />
        </button>
        <span className="text-xs whitespace-nowrap">
          Trang {page + 1} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          className="flex items-center gap-1 rounded border border-border px-2 py-1 disabled:opacity-50"
          aria-label="Trang sau"
        >
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
