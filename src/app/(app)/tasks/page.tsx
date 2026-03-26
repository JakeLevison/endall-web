import { CheckSquare } from "lucide-react";

export default function TasksPage() {
  return (
    <div className="p-6">
      <h1 className="text-[15px] font-medium text-white mb-6">Tasks</h1>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="size-10 rounded-lg bg-white/[0.03] border border-white/[0.04] flex items-center justify-center mb-4">
          <CheckSquare className="size-5 text-zinc-600" />
        </div>
        <p className="text-[13px] text-zinc-500 mb-1">No tasks yet</p>
        <p className="text-[11px] text-zinc-600">Track issues, projects, and sprints. Prioritize and assign without the meetings.</p>
      </div>
    </div>
  );
}
