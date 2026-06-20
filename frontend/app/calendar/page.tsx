"use client";

import "./page.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Sidebar from "@/components/sidebar/sidebar";
import PageTitle from "@/components/page_title/page_title";
import Home from "./event-calendar/app/page";

function CalendarPage() {
  return (
    <div className="calendar-right-side app-shell">
      <Sidebar />

      <main className="calendar-content app-content">
        <div className="calendar-header-block page-header-block">
          <PageTitle title="Calendar" />
        </div>

        <section className="calendar-surface" aria-label="Task calendar">
          <div className="calendar-grid-shell">
            <Home />
          </div>
        </section>
      </main>
    </div>
  );
}

export default CalendarPage;
