import "./report_card.css";
import { Users, FileText } from "lucide-react";

function ReportmeetingCard() {
  return (
    <div className="report-meeting-wrapper">
      <div className="report-meeting-card">
        <div className="report-icon-wrapper blue">
          <Users size={20} />
        </div>
        <div className="report-meeting-content">
          <h3>Site Inspection Sync</h3>
          <p>Weekly walk-through with structural engineers to review Phase II concrete pouring progress and safety compliance.</p>
        </div>
        <button className="btn-view-notes">View Notes</button>
      </div>

      <div className="report-meeting-card">
        <div className="report-icon-wrapper orange">
          <FileText size={20} />
        </div>
        <div className="report-meeting-content">
          <h3>Safety & Compliance Briefing</h3>
          <p>Morning briefing covering new heavy machinery protocols and updated PPE requirements for the West Wing.</p>
        </div>
        <button className="btn-view-notes">View Notes</button>
      </div>
    </div>
  );
}

export default ReportmeetingCard;
