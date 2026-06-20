import React from "react";
import LeanLookAheadHeader from "./LeanLookAheadComponents/LeanLookAheadHeading/LeanLookAheadHeader";
import TaskLightCard from "./LeanLookAheadComponents/upcomingtask";
import ActiveStructureCard from "./LeanLookAheadComponents/InProgressLookAhead";
import ClearedTaskCard from "./LeanLookAheadComponents/ClearedLookAhead";
import FinishedTaskCard from "./LeanLookAheadComponents/DoneLeanLookCard/FinishedTaskCard";
import Button from "../../General/Button/button";
import Search from "../../General/search/search";
import "./LeanLookAhead.css";

export default function LeanLookAhead() {
  return (
    <div className="lean-lookahead-page">
      <div className="lean-header-section">
        <LeanLookAheadHeader />
        <div className="lean-header-actions">
          <div className="action-buttons"></div>
          <Button label="+ New Task" onClick={() => {}} />
        </div>
      </div>

      <div className="constraint-board">
        <div className="board-column">
          <div className="column-header">
            <div className="column-title">
              <h3>UPCOMING CONSTRAINTS</h3>
              <span className="column-count">3</span>
            </div>
          </div>
          <div className="column-content">
            <TaskLightCard
              tag="#TSK-882 • FOUNDATION"
              title="Elevator Pit Pour & Rebar\nreinforcement"
              dueDate="Oct 24"
              activeTab="conc"
            />
          </div>
        </div>

        <div className="board-column">
          <div className="column-header">
            <div className="column-title">
              <h3>IN PROGRESS</h3>
              <span className="column-count">2</span>
            </div>
          </div>
          <div className="column-content">
            <ActiveStructureCard
              tag="ACTIVE • STRUCTURE"
              title="Column Rebar Set [Units 12–24]"
              activeTab="conc"
            />
          </div>
        </div>

        <div className="board-column">
          <div className="column-header">
            <div className="column-title">
              <h3>READY FOR FIELD</h3>
              <span className="column-count">3</span>
            </div>
          </div>
          <div className="column-content">
            <ClearedTaskCard
              tag="CLEARED"
              title="MEP Rough-in [Plumbing/Electrical]"
              buttonLabel="GO"
              activeTab="conc"
            />
          </div>
        </div>

        <div className="board-column">
          <div className="column-header">
            <div className="column-title">
              <h3>COMPLETED</h3>
              <span className="column-count">32</span>
            </div>
          </div>
          <div className="column-content">
            <FinishedTaskCard
              title="Site Clearing & Initial Leveling"
              finishedDate="FINISHED OCT 18"
            />
            <FinishedTaskCard
              title="Staircase A Formwork & Decking"
              finishedDate="FINISHED OCT 16"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
