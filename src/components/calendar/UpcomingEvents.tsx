"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Users, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type CalendarEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  location: string;
  attendees: string[];
};

export default function UpcomingEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [synced, setSynced] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/calendar?days=7");
      const data = await resp.json();
      if (data.events && !data.events[0]?.error) {
        setEvents(data.events);
        setSynced(true);
      }
    } catch {
      // API unavailable
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (iso: string) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="border border-[var(--border)] bg-[var(--overlay-weak)] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-[var(--text-muted)]" />
          <h3 className="text-[13px] font-medium text-[var(--text-primary)]">Upcoming Events</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[12px] text-[var(--text-tertiary)] border-[var(--border)] bg-[var(--overlay-weak)]"
          onClick={fetchEvents}
          disabled={loading}
        >
          {loading ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
          <span className="ml-1">{synced ? "Refresh" : "Sync Calendar"}</span>
        </Button>
      </div>

      <div className="max-h-[350px] overflow-y-auto">
        {!synced ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[12px] text-[var(--text-muted)]">Click Sync Calendar to load your upcoming events</p>
          </div>
        ) : events.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[12px] text-[var(--text-muted)]">No upcoming events this week</p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--overlay-weak)] transition-colors"
            >
              <p className="text-[13px] text-[var(--text-primary)] font-medium mb-1">{event.summary}</p>
              <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
                <div className="flex items-center gap-1">
                  <Clock className="size-3" />
                  <span>{formatTime(event.start)}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="size-3" />
                    <span className="truncate max-w-[150px]">{event.location}</span>
                  </div>
                )}
                {event.attendees?.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="size-3" />
                    <span>{event.attendees.length}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
