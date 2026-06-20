import { FileText, ChevronRight } from "lucide-react";
import Link from "next/link";
import "./report_card.css";

function ReportDailyCard({ date }: { date?: Date }) {
  const formattedDate = date 
    ? date.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })
    : "Select a date";

  return (
    <Link
      href="/projects/project-details/reports/daily"
      className="report-card-link"
    >
      <div className="report-daily-card">
        <div className="report-card-icon-container">
          <FileText size={24} />
        </div>
        <div className="report-daily-content">
          <div className="flex justify-between items-start">
            <div>
              <h3>Daily Progress Report</h3>
              <p className="report-date-label">{formattedDate}</p>
            </div>
            <ChevronRight size={18} className="report-card-arrow" />
          </div>
          <p className="report-card-description">Comprehensive breakdown of all tasks, milestones, and workforce activity for this period.</p>
        </div>
      </div>
    </Link>
  );
}

export default ReportDailyCard;
