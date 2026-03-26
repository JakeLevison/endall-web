"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Deal = {
  id: string;
  name: string;
  company: string;
  amount: string;
  closeDate: string;
  owner: string;
  stage: string;
};

const stages = [
  "Qualified",
  "Meeting Scheduled",
  "Proposal Sent",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
];

const mockDeals: Deal[] = [
  { id: "1", name: "Enterprise Platform License", company: "Acme Corp", amount: "$48,000", closeDate: "2026-04-15", owner: "Jake", stage: "Proposal Sent" },
  { id: "2", name: "Consulting Engagement", company: "TechLabs", amount: "$12,000", closeDate: "2026-04-30", owner: "Jake", stage: "Qualified" },
  { id: "3", name: "Annual Subscription", company: "BrightPath", amount: "$24,000", closeDate: "2026-05-01", owner: "Jake", stage: "Negotiation" },
  { id: "4", name: "Implementation Services", company: "NovaSoft", amount: "$36,000", closeDate: "2026-04-20", owner: "Jake", stage: "Meeting Scheduled" },
  { id: "5", name: "Starter Plan", company: "GreenLeaf", amount: "$6,000", closeDate: "2026-03-30", owner: "Jake", stage: "Closed Won" },
  { id: "6", name: "Custom Integration", company: "Skyline Dev", amount: "$18,000", closeDate: "2026-04-10", owner: "Jake", stage: "Proposal Sent" },
  { id: "7", name: "Pro Subscription", company: "CloudNine", amount: "$9,600", closeDate: "2026-05-15", owner: "Jake", stage: "Qualified" },
  { id: "8", name: "Data Migration", company: "DataFlow", amount: "$15,000", closeDate: "2026-03-28", owner: "Jake", stage: "Closed Lost" },
];

const stageColor = (stage: string) => {
  switch (stage) {
    case "Closed Won": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "Closed Lost": return "bg-red-500/10 text-red-400 border-red-500/20";
    case "Negotiation": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "Proposal Sent": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "Meeting Scheduled": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  }
};

function KanbanBoard({ deals }: { deals: Deal[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageDeals = deals.filter((d) => d.stage === stage);
        return (
          <div key={stage} className="min-w-[220px] w-[220px] shrink-0">
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-[11px] uppercase tracking-wide text-zinc-600">{stage}</h3>
              <span className="text-[11px] text-zinc-700">{stageDeals.length}</span>
            </div>
            <div className="space-y-2">
              {stageDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="p-3 rounded-lg border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] transition-colors cursor-pointer"
                >
                  <p className="text-[13px] text-white mb-1">{deal.name}</p>
                  <p className="text-[11px] text-zinc-500 mb-2">{deal.company}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-zinc-300">{deal.amount}</span>
                    <Avatar className="size-5">
                      <AvatarFallback className="bg-white/[0.06] text-[9px] text-zinc-500">
                        {deal.owner.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-1">Close: {deal.closeDate}</p>
                </div>
              ))}
              {stageDeals.length === 0 && (
                <div className="p-3 rounded-lg border border-dashed border-white/[0.04] text-center">
                  <p className="text-[11px] text-zinc-700">No deals</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TableView({ deals }: { deals: Deal[] }) {
  return (
    <div className="border border-white/[0.04] rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-white/[0.04] hover:bg-transparent">
            <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600">Name</TableHead>
            <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600">Company</TableHead>
            <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600">Amount</TableHead>
            <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600">Stage</TableHead>
            <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600 hidden md:table-cell">Close Date</TableHead>
            <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600 hidden md:table-cell">Owner</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((deal) => (
            <TableRow key={deal.id} className="border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors">
              <TableCell className="text-[13px] text-white font-medium py-2.5">{deal.name}</TableCell>
              <TableCell className="text-[13px] text-zinc-400 py-2.5">{deal.company}</TableCell>
              <TableCell className="text-[13px] text-zinc-300 py-2.5">{deal.amount}</TableCell>
              <TableCell className="py-2.5">
                <Badge variant="outline" className={`text-[11px] font-normal ${stageColor(deal.stage)}`}>
                  {deal.stage}
                </Badge>
              </TableCell>
              <TableCell className="text-[13px] text-zinc-500 py-2.5 hidden md:table-cell">{deal.closeDate}</TableCell>
              <TableCell className="text-[13px] text-zinc-500 py-2.5 hidden md:table-cell">{deal.owner}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function DealsPage() {
  const [view, setView] = useState("board");

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[15px] font-medium text-white">Deals</h1>
        <Button className="bg-white text-zinc-900 hover:bg-zinc-100 text-[13px] h-8 px-3">
          <Plus className="size-4 mr-1" />
          Add deal
        </Button>
      </div>

      {/* View toggle */}
      <Tabs value={view} onValueChange={setView} className="mb-4">
        <TabsList className="bg-white/[0.03] border border-white/[0.04] h-8">
          <TabsTrigger
            value="board"
            className="text-[13px] text-zinc-500 data-[state=active]:text-white data-[state=active]:bg-white/[0.06] h-6 px-3"
          >
            Board
          </TabsTrigger>
          <TabsTrigger
            value="table"
            className="text-[13px] text-zinc-500 data-[state=active]:text-white data-[state=active]:bg-white/[0.06] h-6 px-3"
          >
            Table
          </TabsTrigger>
        </TabsList>
        <TabsContent value="board" className="mt-4">
          <KanbanBoard deals={mockDeals} />
        </TabsContent>
        <TabsContent value="table" className="mt-4">
          <TableView deals={mockDeals} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
