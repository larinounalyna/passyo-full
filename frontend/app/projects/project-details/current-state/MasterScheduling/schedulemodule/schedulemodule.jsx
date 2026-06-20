import React, { useMemo, useState } from "react";
import "./schedulemodule.css";

const DAY_MS = 24 * 60 * 60 * 1000;

// Timeline: Oct 01 2024 → Mar 31 2025 (6 months, ~182 days)
const TIMELINE_START = new Date("2024-10-01T00:00:00");
const TOTAL_DAYS = 182;

// Generate weeks dynamically for 6 months
function generateWeeks(startDate, totalDays) {
  const weeks = [];
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  let currentDay = 0;

  while (currentDay < totalDays) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + currentDay);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const startMonth = months[weekStart.getMonth()];
    const endMonth = months[weekEnd.getMonth()];
    const startDay = weekStart.getDate();
    const endDay = weekEnd.getDate();

    const label =
      startMonth === endMonth
        ? `${startMonth} ${String(startDay).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`
        : `${startMonth} ${String(startDay).padStart(2, "0")} - ${endMonth} ${String(endDay).padStart(2, "0")}`;

    const daysInWeek = Math.min(7, totalDays - currentDay);
    weeks.push({
      label,
      startDay: currentDay,
      days: daysInWeek,
      current: currentDay <= 15 && currentDay + daysInWeek > 15, // Week containing Oct 16
    });

    currentDay += 7;
  }

  return weeks;
}

const weeks = generateWeeks(TIMELINE_START, TOTAL_DAYS);

// Construction tasks following logical sequence across 6 months
// Current date: Oct 16 (day 15 from Oct 1)
const initialTasks = [
  {
    id: "1.0",
    name: "Site Mobilization & Permits",
    dur: "5d",
    pct: 100,
    start: "2024-10-01",
    end: "2024-10-06",
    color: "green",
    critical: true,
    statusTag: "COMPLETE",
  },
  {
    id: "1.1",
    name: "Site Excavation & Grading",
    dur: "10d",
    pct: 100,
    start: "2024-10-06",
    end: "2024-10-16",
    color: "green",
    critical: true,
    statusTag: "COMPLETE",
    arrowTo: "2.1",
  },
  {
    id: "2.1",
    name: "Foundation Work",
    dur: "20d",
    pct: 45,
    start: "2024-10-16",
    end: "2024-11-05",
    color: "salmon",
    critical: true,
    label: "IN PROGRESS",
    arrowTo: "3.1",
  },
  {
    id: "2.2",
    name: "Underground MEP Rough-In",
    dur: "15d",
    pct: 30,
    start: "2024-10-20",
    end: "2024-11-04",
    color: "blue",
    critical: false,
  },
  {
    id: "3.1",
    name: "Structural Steel Erection",
    dur: "30d",
    pct: 0,
    start: "2024-11-05",
    end: "2024-12-05",
    color: "red",
    critical: true,
    label: "UPCOMING",
    arrowTo: "3.2",
  },
  {
    id: "3.2",
    name: "Metal Deck & Fireproofing",
    dur: "20d",
    pct: 0,
    start: "2024-12-05",
    end: "2024-12-25",
    color: "blue",
    critical: false,
  },
  {
    id: "4.1",
    name: "Exterior Enclosure",
    dur: "45d",
    pct: 0,
    start: "2024-12-10",
    end: "2025-01-24",
    color: "red",
    critical: true,
    arrowTo: "5.1",
  },
  {
    id: "4.2",
    name: "Roofing Installation",
    dur: "25d",
    pct: 0,
    start: "2024-12-20",
    end: "2025-01-14",
    color: "blue",
    critical: false,
  },
  {
    id: "5.1",
    name: "Interior Framing & Drywall",
    dur: "40d",
    pct: 0,
    start: "2025-01-24",
    end: "2025-03-05",
    color: "red",
    critical: true,
    arrowTo: "6.1",
  },
  {
    id: "5.2",
    name: "MEP Rough-In (Interior)",
    dur: "35d",
    pct: 0,
    start: "2025-01-30",
    end: "2025-03-06",
    color: "blue",
    critical: false,
  },
  {
    id: "6.1",
    name: "Interior Finishes",
    dur: "30d",
    pct: 0,
    start: "2025-03-05",
    end: "2025-04-04",
    color: "red",
    critical: true,
    label: "PLANNED",
  },
  {
    id: "6.2",
    name: "Final MEP Trim & Testing",
    dur: "20d",
    pct: 0,
    start: "2025-03-15",
    end: "2025-04-04",
    color: "blue",
    critical: false,
  },
];

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function daysBetween(a, b) {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.round((db - da) / DAY_MS);
}

function toDayIndex(dateStr) {
  return daysBetween(TIMELINE_START, new Date(dateStr));
}

function barMetrics(task) {
  const startIdx = toDayIndex(task.start);
  const endIdx = toDayIndex(task.end);
  const left = clamp(startIdx, 0, TOTAL_DAYS);
  const right = clamp(endIdx, 0, TOTAL_DAYS);
  const widthDays = Math.max(0, right - left);
  return { left, widthDays, startIdx, endIdx };
}

export default function ConstructionGantt() {
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // 0.5 = zoomed out, 1 = normal, 2 = zoomed in
  const [showTaskList, setShowTaskList] = useState(false);

  const dayWidth = useMemo(() => {
    const baseWidth = 48;
    return baseWidth * zoomLevel;
  }, [zoomLevel]);

  const tasks = useMemo(() => {
    return criticalOnly ? initialTasks.filter((t) => t.critical) : initialTasks;
  }, [criticalOnly]);

  // "Current" marker around Oct 16 (inside Oct 15-21)
  const currentDayIndex = 15; // 0-based from Oct 01

  // Build lookup for arrows
  const taskById = useMemo(() => {
    const map = new Map();
    initialTasks.forEach((t) => map.set(t.id, t));
    return map;
  }, []);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 0.5));
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
  };

  // Generate day labels
  const dayLabels = useMemo(() => {
    const labels = [];
    for (let i = 0; i < TOTAL_DAYS; i++) {
      const date = new Date(TIMELINE_START);
      date.setDate(date.getDate() + i);
      labels.push({
        date,
        day: date.getDate(),
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }
    return labels;
  }, []);

  return (
    <div className="gantt-wrap">
      {/* Header */}
      <div className="gantt-header">
        <div className="gantt-header-top">
          <div>
            <div className="gantt-title">Master Schedule</div>
            <div className="gantt-subtitle">
              {tasks.length} tasks • {tasks.filter((t) => t.pct === 100).length}{" "}
              complete • {tasks.filter((t) => t.critical).length} critical path
            </div>
          </div>
        </div>
      </div>

      {/* Top bar */}
      <div className="gantt-top">
        <button
          className="hamburger-btn"
          type="button"
          onClick={() => setShowTaskList((v) => !v)}
          title="Toggle Task List"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        <button className="btn primary" type="button">
          Auto-Schedule
        </button>

        <button
          className={criticalOnly ? "btn pill pillOn" : "btn pill"}
          type="button"
          onClick={() => setCriticalOnly((v) => !v)}
          title="Toggle Critical Path Only"
        >
          <span className="dot"></span>Critical Path Only
        </button>

        <div className="top-spacer" />

        <button
          className="iconBtn"
          type="button"
          title="Zoom Out"
          onClick={handleZoomOut}
          disabled={zoomLevel <= 0.5}
        >
          🔍-
        </button>
        <button
          className="iconBtn"
          type="button"
          title="Zoom In"
          onClick={handleZoomIn}
          disabled={zoomLevel >= 3}
        >
          🔍+
        </button>
        <div className="zoom-info">
          <span className="zoom-label">Zoom:</span>
          <span className="zoom-value">{Math.round(zoomLevel * 100)}%</span>
        </div>
      </div>

      {/* Main: left table + right gantt */}
      <div className={`gantt ${showTaskList ? "gantt-with-sidebar" : ""}`}>
        {/* Left table - hidden by default, shown on hamburger click */}
        <div className={`left ${showTaskList ? "left-visible" : ""}`}>
          {/* Spacer for week/day header alignment */}
          <div className="left-week-spacer">
            <div className="spacer-label">TASK LIST</div>
          </div>

          {/* Main column headers */}
          <div className="left-head">
            <div className="hcell">ID</div>
            <div className="hcell">TASK DESCRIPTION</div>
            <div className="hcell">DUR</div>
            <div className="hcell">%</div>
          </div>

          <div className="left-body">
            {tasks.map((t) => {
              let pctClass = "pctBadge";
              if (t.pct === 100) pctClass = "pctBadge done";
              else if (t.pct > 0) pctClass = "pctBadge mid";

              return (
                <div className="left-row" key={t.id}>
                  <div className="cell">{t.id}</div>
                  <div className="cell task">{t.name}</div>
                  <div className="cell">{t.dur}</div>
                  <div className="cell">
                    <span className={pctClass}>{t.pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right gantt */}
        <div className="right" style={{ "--dayW": `${dayWidth}px` }}>
          {/* Week header */}
          <div
            className="week-head"
            style={{
              gridTemplateColumns: `repeat(${TOTAL_DAYS}, ${dayWidth}px)`,
            }}
          >
            {weeks.map((w) => (
              <div
                key={w.label}
                className={`weekBand ${w.current ? "weekBand-current" : ""}`}
                style={{
                  gridColumn: `${w.startDay + 1} / span ${w.days}`,
                }}
              >
                {w.label}
              </div>
            ))}
          </div>

          {/* Day header with dates */}
          <div
            className="day-head"
            style={{
              gridTemplateColumns: `repeat(${TOTAL_DAYS}, ${dayWidth}px)`,
            }}
          >
            {dayLabels.map((d, i) => (
              <div
                key={i}
                className={`dayCell ${d.isWeekend ? "weekend" : ""} ${i === currentDayIndex ? "today" : ""}`}
                style={{ gridColumn: i + 1 }}
                title={d.date.toLocaleDateString()}
              >
                <div className="dayName">{d.dayName}</div>
                <div className="dayNum">{d.day}</div>
              </div>
            ))}
          </div>

          {/* Grid + rows */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${TOTAL_DAYS}, ${dayWidth}px)`,
            }}
          >
            {/* Vertical day lines */}
            {Array.from({ length: TOTAL_DAYS }).map((_, i) => {
              const isWeekStart = i % 7 === 0 && i > 0;
              const isWeekend = dayLabels[i].isWeekend;
              return (
                <div
                  key={`vline-${i}`}
                  className={`vline ${isWeekStart ? "weekStart" : ""} ${isWeekend ? "weekend" : ""}`}
                  style={{
                    gridColumn: i + 1,
                    gridRow: `1 / span ${tasks.length}`,
                  }}
                />
              );
            })}

            {/* Task rows - one per task with its bar */}
            {tasks.map((t, rowIndex) => {
              const { left, widthDays } = barMetrics(t);

              // Optional arrow dependency (simple horizontal arrow)
              let arrow = null;
              if (t.arrowTo && taskById.has(t.arrowTo)) {
                const target = taskById.get(t.arrowTo);
                const from = barMetrics(t);
                const to = barMetrics(target);

                const x1 = (from.left + from.widthDays) * 1;
                const x2 = to.left * 1;

                // Only draw if target starts after source ends within timeline
                if (x2 > x1) {
                  arrow = (
                    <div
                      className="depArrow"
                      style={{
                        left: `${x1 * dayWidth}px`,
                        width: `${(x2 - x1) * dayWidth}px`,
                      }}
                    >
                      <span className="arrowHead">▶</span>
                    </div>
                  );
                }
              }

              return (
                <div
                  className="row"
                  key={t.id}
                  style={{
                    gridColumn: `1 / -1`,
                    gridRow: rowIndex + 1,
                  }}
                >
                  {/* Bar */}
                  <div
                    className={`bar ${t.color} ${t.critical ? "bar-critical" : ""}`}
                    style={{
                      gridColumn: `${left + 1} / span ${Math.max(1, widthDays)}`,
                      gridRow: 1,
                    }}
                    data-progress={t.pct}
                    title={`${t.name} - ${t.pct}% complete`}
                  >
                    {/* Progress fill */}
                    {t.pct > 0 && (
                      <div
                        className="barProgress"
                        style={{ width: `${t.pct}%` }}
                      />
                    )}

                    {/* Labels */}
                    <span className="barContent">
                      <span className="barName">{t.name}</span>
                      {t.statusTag && (
                        <span className="barTag">{t.statusTag}</span>
                      )}
                      {t.label && <span className="barLabel">{t.label}</span>}
                      {!t.statusTag && !t.label && t.pct > 0 && t.pct < 100 && (
                        <span className="barPct">{t.pct}%</span>
                      )}
                    </span>
                  </div>

                  {/* Dependency arrow */}
                  {arrow}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="gantt-legend">
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color green"></div>
            <span>Complete</span>
          </div>
          <div className="legend-item">
            <div className="legend-color salmon"></div>
            <span>In Progress</span>
          </div>
          <div className="legend-item">
            <div className="legend-color red"></div>
            <span>Critical Path</span>
          </div>
          <div className="legend-item">
            <div className="legend-color blue"></div>
            <span>Supporting Work</span>
          </div>
        </div>
      </div>
    </div>
  );
}
