import "./current-state.css";
import DailyPlanning from "./kaban/DailyPlanning";
import PageSection from "@/components/page_section/page_section";

function CurrentState() {
  return (
    <div className="current-state">
      <DailyPlanning />
    </div>
  );
}

export default CurrentState;
