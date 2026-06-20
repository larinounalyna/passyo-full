import React from "react";
import { FileText, Paperclip, FileSignature, ReceiptText } from "lucide-react";
import "./ReportsHubToggle.css";

export default function ReportsHubToggle({ activeToggle, setActiveToggle }) {
  return (
    <ul className="reports-hub-toggle">
      <li
        onClick={() => setActiveToggle(0)}
        className={activeToggle === 0 ? "active" : ""}
      >
        <FileText size={18} />
        Reports
      </li>

      <li
        onClick={() => setActiveToggle(1)}
        className={activeToggle === 1 ? "active" : ""}
      >
        <Paperclip size={18} />
        Attachments
      </li>

      <li
        onClick={() => setActiveToggle(2)}
        className={activeToggle === 2 ? "active" : ""}
      >
        <FileSignature size={18} />
        Avenants
      </li>

      <li
        onClick={() => setActiveToggle(3)}
        className={activeToggle === 3 ? "active" : ""}
      >
        <ReceiptText size={18} />
        Situations
      </li>
    </ul>
  );
}
