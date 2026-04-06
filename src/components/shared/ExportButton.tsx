"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  data: Record<string, unknown>[];
  columns: string[];
  filename: string;
}

export default function ExportButton({ data, columns, filename }: ExportButtonProps) {
  const handleExport = () => {
    if (data.length === 0) return;

    const header = columns.join(",");
    const rows = data.map((row) =>
      columns
        .map((col) => {
          const val = row[col];
          if (val == null) return "";
          const str = String(val);
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(",")
    );

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 text-[12px] text-[var(--text-tertiary)] border-[var(--border)] bg-[var(--overlay-weak)]"
      onClick={handleExport}
      disabled={data.length === 0}
    >
      <Download className="size-3.5 mr-1.5" />
      Export
    </Button>
  );
}
