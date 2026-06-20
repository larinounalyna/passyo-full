"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { addDays } from "date-fns";
import { EventCalendar } from "../../../calendar/event-calendar/components/event-calendar/event-calendar";
import type { CalendarEvent, EventColor } from "../../../calendar/event-calendar/components/event-calendar/types";
import "./schedule.css";
import "../../../calendar/page.css";
import { useProject } from "@/lib/context/ProjectContext";
import { apiRequest } from "@/lib/api/client";
import { toast } from "sonner";

type ScheduleEvent = CalendarEvent & {
  assignees?: string[];
};

export default function ScheduleModule() {
  const { project } = useProject();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!project) return;
    try {
      setIsLoading(true);
      const data = await apiRequest<any[]>(`/tasks/project/${project.id}`);
      const mappedEvents = data.map((t) => ({
        id: t.id.toString(),
        title: t.title,
        description: t.description || "",
        start: t.start_date ? new Date(t.start_date) : new Date(),
        end: t.end_date ? new Date(t.end_date) : addDays(new Date(), 1),
        color: (t.status_id === 4 ? "emerald" : t.status_id === 2 ? "sky" : "amber") as EventColor,
        location: "Site",
        assignees: t.assignee_name ? [t.assignee_name] : [],
      }));
      setEvents(mappedEvents);
    } catch (err) {
      console.error("Failed to fetch calendar tasks:", err);
    } finally {
      setIsLoading(false);
    }
  }, [project]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleEventAdd = async (event: CalendarEvent) => {
    if (!project) return;
    
    try {
      await apiRequest("/tasks", {
        method: "POST",
        body: {
          title: event.title,
          description: "Calendar event",
          start_date: event.start.toISOString().split('T')[0],
          end_date: event.end.toISOString().split('T')[0],
          project_id: project.id,
          status_id: 1 // New
        }
      });
      fetchTasks();
    } catch (e) {
      console.error("Failed to add task from calendar:", e);
      toast.error("Failed to save task");
    }
  };

  const handleEventUpdate = async (updatedEvent: CalendarEvent) => {
    try {
      await apiRequest(`/tasks/${updatedEvent.id}`, {
        method: "PATCH",
        body: {
          title: updatedEvent.title,
          start_date: updatedEvent.start.toISOString(),
          end_date: updatedEvent.end.toISOString(),
        }
      });
      fetchTasks();
    } catch (e) {
      console.error("Failed to update task:", e);
    }
  };

  const handleEventDelete = async (eventId: string) => {
    try {
      await apiRequest(`/tasks/${eventId}`, { method: "DELETE" });
      fetchTasks();
    } catch (e) {
      console.error("Failed to delete task:", e);
    }
  };

  return (
    <section className="calendar-surface flex-1 min-h-0 mt-4" aria-label="Task calendar">
      <div className="calendar-grid-shell relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
             <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <div className="flex flex-col p-2 sm:p-3 md:p-4 h-full flex-1 min-h-0">
          <EventCalendar
            events={events}
            onEventAdd={handleEventAdd}
            onEventUpdate={handleEventUpdate}
            onEventDelete={handleEventDelete}
          />
        </div>
      </div>
    </section>
  );
}
