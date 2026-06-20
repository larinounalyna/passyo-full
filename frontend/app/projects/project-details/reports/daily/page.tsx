import "./page.css";
import DailyReport from "./daily-report";
import Sidebar from "@/components/sidebar/sidebar";

export default function ReportsPage() {
  return (
    <div className="daily-report-page app-shell">
      <Sidebar />
      <div className="daily-report-content app-content">
        <DailyReport />
      </div>
    </div>
  );
}
