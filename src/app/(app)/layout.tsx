"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import ChatPanel from "@/components/chat/ChatPanel";
import ComposeDialog from "@/components/email/ComposeDialog";
import QuickSearch from "@/components/search/QuickSearch";
import {
  Home,
  Users,
  Building2,
  HandCoins,
  Mail,
  Zap,
  CheckSquare,
  BarChart3,
  Settings,
  Search,
  Menu,
  X,
  Sparkles,
  Send,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "#ask-endall", label: "Ask Endall", icon: Sparkles, isChat: true },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/deals", label: "Deals", icon: HandCoins },
  { href: "/sequences", label: "Sequences", icon: Mail },
  { href: "/workflows", label: "Workflows", icon: Zap },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/outreach", label: "Outreach", icon: Send },
];

function SidebarContent({ pathname, onOpenChat }: { pathname: string; onOpenChat?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-4">
        <Link
          href="/"
          className="text-[15px] font-medium tracking-[-0.01em] text-white"
        >
          endall
        </Link>
      </div>
      <nav className="flex-1 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isChat = "isChat" in item && item.isChat;
          const isActive = !isChat && pathname === item.href;

          if (isChat) {
            return (
              <button
                key={item.href}
                onClick={onOpenChat}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors w-full text-left text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors ${
                isActive
                  ? "bg-white/[0.06] text-white"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"
              }`}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-2 pb-4">
        <Link
          href="/settings"
          className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors ${
            pathname === "/settings"
              ? "bg-white/[0.06] text-white"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"
          }`}
        >
          <Settings className="size-4 shrink-0" />
          Settings
        </Link>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [toast, setToast] = useState<{ filename: string; downloadUrl: string } | null>(null);

  // Listen for file-ready events from ChatPanel
  useEffect(() => {
    function handleFileReady(e: Event) {
      const detail = (e as CustomEvent).detail;
      setToast({ filename: detail.filename, downloadUrl: detail.downloadUrl });
      const timer = setTimeout(() => setToast(null), 15000);
      return () => clearTimeout(timer);
    }
    window.addEventListener("endall-file-ready", handleFileReady);
    return () => window.removeEventListener("endall-file-ready", handleFileReady);
  }, []);

  // Auto-open Ask Endall on first app load
  useEffect(() => {
    const seen = sessionStorage.getItem("endall-chat-shown");
    if (!seen) {
      setChatOpen(true);
      sessionStorage.setItem("endall-chat-shown", "1");
    }
  }, []);

  const openChat = useCallback(() => setChatOpen(true), []);

  // Cmd+K to open chat
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setChatOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen bg-[#0A0A0B] text-zinc-300">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-white/[0.04]">
        <SidebarContent pathname={pathname} onOpenChat={openChat} />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-12 shrink-0 border-b border-white/[0.04] flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <button className="md:hidden text-zinc-500 hover:text-zinc-300">
                  <Menu className="size-5" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-56 p-0 bg-[#0A0A0B] border-white/[0.04]"
              >
                <SidebarContent pathname={pathname} onOpenChat={openChat} />
              </SheetContent>
            </Sheet>

            {/* Logo — mobile only, links to landing page */}
            <Link href="/" className="md:hidden text-[15px] font-semibold text-white tracking-[-0.02em] px-3 py-2 min-h-[36px] flex items-center">
              endall
            </Link>

            {/* AI Chat trigger — pill on mobile, full bar on desktop */}
            <button
              onClick={() => setChatOpen(true)}
              className="flex items-center gap-1.5 text-[13px] transition-colors min-h-[36px] px-3 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]"
            >
              <Sparkles className="size-3.5 shrink-0" />
              <span className="sm:hidden text-[12px]">AI</span>
              <span className="hidden sm:inline">ask endall...</span>
              <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] text-zinc-700 bg-white/[0.03] border border-white/[0.06] rounded ml-1">
                <span className="text-xs">&#8984;</span>K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2">
          {/* Compose email button */}
          <button
            onClick={() => setComposeOpen(true)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1.5"
            title="Compose email"
          >
            <Mail className="size-4" />
          </button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="outline-none">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-white/[0.06] text-[11px] text-zinc-400">
                    JK
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-[#111113] border-white/[0.06]"
            >
              <DropdownMenuItem className="text-[13px] text-zinc-400">
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[13px] text-zinc-400">
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/[0.04]" />
              <DropdownMenuItem className="text-[13px] text-zinc-400">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <React.Suspense fallback={<div className="p-6"><p className="text-[13px] text-zinc-500">Loading...</p></div>}>
            {children}
          </React.Suspense>
        </main>
      </div>

      {/* AI Chat Panel */}
      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Email Compose Dialog */}
      <ComposeDialog open={composeOpen} onOpenChange={setComposeOpen} />

      {/* Quick Search */}
      <QuickSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* File ready toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1000,
            background: "#1a1a1b",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            animation: "toast-in 0.3s ease",
            maxWidth: 360,
          }}
        >
          <div style={{ fontSize: 20 }}>📄</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {toast.filename}
            </div>
            <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>Ready to download</div>
          </div>
          <a
            href={toast.downloadUrl}
            download={toast.filename}
            onClick={() => setToast(null)}
            style={{
              padding: "6px 14px",
              background: "#3b82f6",
              color: "#fff",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            Download
          </a>
          <button
            onClick={() => setToast(null)}
            style={{
              background: "none",
              border: "none",
              color: "#555",
              cursor: "pointer",
              padding: 2,
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            &times;
          </button>
          <style>{`
            @keyframes toast-in {
              from { transform: translateY(20px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
