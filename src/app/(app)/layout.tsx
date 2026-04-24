"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import ChatPanel from "@/components/chat/ChatPanel";
import ComposeDialog from "@/components/email/ComposeDialog";
import QuickSearch from "@/components/search/QuickSearch";
import { createClient } from "@/lib/supabase/client";
import { posthog } from "@/lib/posthog";
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
  ChevronDown,
  Activity,
  Calendar,
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
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const primaryNav = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/command-center", label: "Command Center", icon: Activity },
  { href: "/invoice-review", label: "Invoice review", icon: Calendar },
  { href: "/dispatch", label: "Dispatch", icon: Calendar, disabled: true, tooltip: "Coming with D2" },
  { href: "/dashboard/ask-endall", label: "Ask Endall", icon: Sparkles },
];

const secondaryNav = [
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/deals", label: "Deals", icon: HandCoins },
  { href: "/sequences", label: "Sequences", icon: Mail },
  { href: "/workflows", label: "Workflows", icon: Zap },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/outreach", label: "Outreach", icon: Send },
];

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  disabled?: boolean;
  tooltip?: string;
};

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.href
    || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));

  if (item.disabled) {
    return (
      <span
        title={item.tooltip}
        aria-disabled="true"
        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] cursor-not-allowed opacity-60"
        style={{ color: "var(--text-muted)" }}
      >
        <item.icon className="size-4 shrink-0" />
        {item.label}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={() =>
        posthog.capture("nav_clicked", {
          href: item.href,
          label: item.label,
        })
      }
      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors"
      style={{
        background: isActive ? "var(--overlay-soft)" : "transparent",
        color: isActive ? "var(--text-primary)" : "var(--text-muted)",
      }}
    >
      <item.icon className="size-4 shrink-0" />
      {item.label}
    </Link>
  );
}

function SidebarContent({ pathname, onOpenChat }: { pathname: string; onOpenChat?: () => void }) {
  // Auto-expand if user is on a CRM page
  const isOnCrmPage = secondaryNav.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );
  const [moreOpen, setMoreOpen] = useState(isOnCrmPage);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-4">
        <Link
          href="/"
          className="text-[15px] font-medium tracking-[-0.01em]" style={{ color: "var(--text-primary)" }}
        >
          endall
        </Link>
      </div>
      <nav className="flex-1 px-2 space-y-0.5">
        {primaryNav.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        {/* Collapsible CRM section */}
        <div className="pt-3 mt-3" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            onClick={() => setMoreOpen((prev) => !prev)}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors w-full"
            style={{ color: "var(--text-muted)" }}
          >
            <ChevronDown
              className="size-3.5 shrink-0 transition-transform"
              style={{ transform: moreOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
            />
            CRM
          </button>
          <div
            style={{
              maxHeight: moreOpen ? 400 : 0,
              overflow: "hidden",
              transition: "max-height 0.2s ease",
            }}
          >
            <div className="space-y-0.5 mt-0.5">
              {secondaryNav.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </div>
        </div>
      </nav>
      <div className="px-2 pb-4">
        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors"
          style={{
            background: pathname === "/settings" ? "var(--overlay-soft)" : "transparent",
            color: pathname === "/settings" ? "var(--text-primary)" : "var(--text-muted)",
          }}
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
  const router = useRouter();
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

  const openChat = useCallback(() => setChatOpen(true), []);

  // Cmd+K to open chat
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setChatOpen((prev) => !prev);
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
    <div className="flex h-screen" style={{ background: "var(--bg)", color: "var(--text-secondary)" }}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col" style={{ borderRight: "1px solid var(--border)" }}>
        <SidebarContent pathname={pathname} onOpenChat={openChat} />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-12 shrink-0 flex items-center justify-between px-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <button className="md:hidden" style={{ color: "var(--text-muted)" }}>
                  <Menu className="size-5" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-56 p-0" style={{ background: "var(--bg)", borderColor: "var(--border)" }}
              >
                <SidebarContent pathname={pathname} onOpenChat={openChat} />
              </SheetContent>
            </Sheet>

            {/* Logo — mobile only, links to landing page */}
            <Link href="/" className="md:hidden text-[15px] font-semibold tracking-[-0.02em] px-3 py-2 min-h-[36px] flex items-center" style={{ color: "var(--text-primary)" }}>
              endall
            </Link>

            {/* AI Chat trigger — hidden on Ask Endall page (redundant there) */}
            {!pathname.startsWith("/dashboard/ask-endall") && (
              <button
                onClick={() => setChatOpen(true)}
                className="flex items-center gap-1.5 text-[13px] transition-colors min-h-[36px] px-3 rounded-full"
                style={{ background: "var(--overlay-soft)", border: "1px solid var(--overlay-medium)", color: "var(--text-muted)" }}
              >
                <Sparkles className="size-3.5 shrink-0" />
                <span className="sm:hidden text-[12px]">AI</span>
                <span className="hidden sm:inline">ask endall...</span>
                <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] rounded ml-1" style={{ color: "var(--text-faint)", background: "var(--overlay-weak)", border: "1px solid var(--overlay-medium)" }}>
                  <span className="text-xs">&#8984;</span>/
                </kbd>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
          <ThemeToggle />
          {/* Compose email button */}
          <button
            onClick={() => setComposeOpen(true)}
            className="transition-colors p-1.5" style={{ color: "var(--text-muted)" }}
            title="Compose email"
          >
            <Mail className="size-4" />
          </button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="outline-none">
                <Avatar className="size-7">
                  <AvatarFallback className="text-[11px]" style={{ background: "var(--overlay-soft)", color: "var(--text-muted)" }}>
                    JK
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48" style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <DropdownMenuItem className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ background: "var(--border)" }} />
              <DropdownMenuItem
                className="text-[13px]"
                style={{ color: "var(--text-tertiary)" }}
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  window.location.href = "/login";
                }}
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <React.Suspense fallback={<div className="p-6"><p className="text-[13px] text-[var(--text-muted)]">Loading...</p></div>}>
            {children}
          </React.Suspense>
        </main>
      </div>

      {/* AI Chat Panel */}
      <ChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onExpandFullPage={() => router.push("/dashboard/ask-endall")}
      />

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
            background: "var(--surface-hover)",
            border: "1px solid var(--overlay-medium)",
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
            <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {toast.filename}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Ready to download</div>
          </div>
          <a
            href={toast.downloadUrl}
            download={toast.filename}
            onClick={() => setToast(null)}
            style={{
              padding: "6px 14px",
              background: "#3b82f6",
              color: "var(--text-primary)",
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
              color: "var(--text-tertiary)",
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
