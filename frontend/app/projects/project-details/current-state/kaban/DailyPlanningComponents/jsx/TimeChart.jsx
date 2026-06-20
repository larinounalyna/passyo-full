import React, { useState, useEffect, useCallback, useMemo } from "react";
import "../css/TimeChart.css";
import { useProject } from "@/lib/context/ProjectContext";
import { apiRequest } from "@/lib/api/client";

export default function TimeChart() {
  const { project } = useProject();
  const [timeWindow, setTimeWindow] = useState("48h");
  const [dbTasks, setDbTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!project?.id) return;
    try {
      setIsLoading(true);
      const data = await apiRequest(`/tasks/project/${project.id}`);
      setDbTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks for timechart:", err);
    } finally {
      setIsLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const getTimeSlots = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const format = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
    
    switch (timeWindow) {
      case "24h":
        return [{ label: `TODAY (${format(today)})`, hours: 24, start: today.getTime() }];
      case "48h":
        return [
          { label: `TODAY (${format(today)})`, hours: 24, start: today.getTime() },
          { label: `TOMORROW (${format(new Date(today.getTime() + 86400000))})`, hours: 24, start: today.getTime() + 86400000 },
        ];
      case "week":
        return Array.from({ length: 7 }).map((_, i) => {
          const d = new Date(today.getTime() + i * 86400000);
          const dayName = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
          return { label: `${dayName} (${format(d)})`, hours: 24, start: d.getTime() };
        });
      default:
        return [];
    }
  }, [timeWindow]);

  const timelineStart = getTimeSlots[0]?.start || Date.now();
  const timelineDuration = getTimeSlots.length * 24 * 60 * 60 * 1000;

  const mappedRows = useMemo(() => {
    if (!dbTasks.length) return [];

    // Group tasks by category
    const rows = {};

    dbTasks.forEach(task => {
      const start = new Date(task.start_date || task.created_at).getTime();
      const end = new Date(task.end_date || start + 3600000 * 4).getTime(); // Default 4h if no end
      
      // Calculate relative position (0-100%)
      const left = ((start - timelineStart) / timelineDuration) * 100;
      const width = ((end - start) / timelineDuration) * 100;

      // Only show if it overlaps with our timeline
      if (left + width < 0 || left > 100) return;

      const rowName = task.category || "General";
      if (!rows[rowName]) rows[rowName] = [];
      
      rows[rowName].push({
        title: task.title,
        category: rowName,
        color: task.status_id === 4 ? "#58b998" : task.status_id === 2 ? "#5d8be0" : "#eeaf53",
        start: Math.max(0, left),
        width: Math.min(100 - left, width),
      });
    });

    return Object.entries(rows)
      .sort() // Sort categories alphabetically
      .map(([name, tasks]) => ({ row: name, tasks }));
  }, [dbTasks, timelineStart, timelineDuration]);

  const slotWidth = timeWindow === "week" ? 160 : timeWindow === "48h" ? 260 : 320;

  return (
    <div className="time-chart-container">
      <div className="time-chart-header">
        <div className="chart-controls">
          <div className="time-window-selector">
            <button
              className={`time-btn ${timeWindow === "48h" ? "active" : ""}`}
              onClick={() => setTimeWindow("48h")}
            >
              48h
            </button>
            <button
              className={`time-btn ${timeWindow === "week" ? "active" : ""}`}
              onClick={() => setTimeWindow("week")}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      <div className="gantt-chart">
        <div className="gantt-sidebar">
          <div className="sidebar-header">CATEGORY</div>
          {isLoading ? (
            <div className="sidebar-row">Loading...</div>
          ) : mappedRows.length === 0 ? (
             <div className="sidebar-row">No tasks</div>
          ) : (
            mappedRows.map((item, idx) => (
              <div key={idx} className="sidebar-row">
                {item.row}
              </div>
            ))
          )}
        </div>

        <div className="gantt-timeline-wrapper">
          <div
            className="gantt-timeline"
            style={{
              minWidth: `${getTimeSlots.length * slotWidth}px`,
              ["--slot-width"]: `${slotWidth}px`,
            }}
          >
            <div className="timeline-header">
              {getTimeSlots.map((slot, idx) => (
                <div key={idx} className="timeline-day">
                  {slot.label}
                </div>
              ))}
            </div>

            <div className="gantt-rows">
              {isLoading ? (
                <div className="gantt-row">
                  <div className="gantt-track">Fetching live task data...</div>
                </div>
              ) : mappedRows.length === 0 ? (
                <div className="gantt-row">
                  <div className="gantt-track text-slate-500 italic">No scheduled tasks in this period</div>
                </div>
              ) : (
                mappedRows.map((item, idx) => (
                  <div key={idx} className="gantt-row">
                    <div className="gantt-track">
                      {item.tasks.map((task, taskIdx) => (
                        <div
                          key={taskIdx}
                          className="gantt-task"
                          style={{
                            left: `${task.start}%`,
                            width: `${task.width}%`,
                            backgroundColor: task.color,
                          }}
                        >
                          <span className="task-label">
                            <span className="font-bold opacity-75 mr-1">{task.category}:</span>
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
