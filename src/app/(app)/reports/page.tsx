import { BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="p-6">
      <h1 className="text-[15px] font-medium text-white mb-6">Reports</h1>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="size-10 rounded-lg bg-white/[0.03] border border-white/[0.04] flex items-center justify-center mb-4">
          <BarChart3 className="size-5 text-zinc-600" />
        </div>
        <p className="text-[13px] text-zinc-500 mb-1">No reports yet</p>
        <p className="text-[11px] text-zinc-600">Pipeline analytics, revenue metrics, and activity tracking. Real-time, always current.</p>
      </div>
    </div>
  );
}
