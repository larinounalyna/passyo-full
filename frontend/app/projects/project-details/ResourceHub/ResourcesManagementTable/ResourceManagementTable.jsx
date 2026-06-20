import React, { useState, useEffect, useCallback } from "react";
import "./ResourceManagementTable.css";
import { apiRequest } from "@/lib/api/client";

export default function ResourceManagementTable() {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetchEquipment = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest("/resources/");
      const equipment = data.filter(r => r.type === "equipment" || r.type === "machinery");
      
      const mapped = equipment.map(e => ({
        item: e.name,
        po: `EQ-${e.id}`,
        supplier: { name: e.supplier || "Fleet Dept", initials: (e.supplier || "FD").slice(0, 2).toUpperCase() },
        qty: `${e.quantity} ${e.unit || "Unit"}`,
        status: e.status === "available" ? "ON SITE" : e.status === "maintenance" ? "MAINTENANCE" : "IN TRANSIT",
        statusType: e.status === "available" ? "success" : e.status === "maintenance" ? "neutral" : "info",
        pipeline: { 
          maint: e.status === "maintenance" ? 45 : 100, 
          insp: 100, 
          deploy: e.status === "available" ? 100 : 0 
        },
        eta: { headline: e.status === "available" ? "Active" : "Pending", sub: e.last_restock ? `Checked: ${new Date(e.last_restock).toLocaleDateString()}` : "Ready for dispatch" },
        action: "VIEW LOGS",
      }));
      setRows(mapped);
    } catch (err) {
      console.error("Failed to fetch equipment:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const pipelines = (row) => [
    { label: "Maint", val: row.pipeline.maint },
    { label: "Insp", val: row.pipeline.insp },
    { label: "Deploy", val: row.pipeline.deploy },
  ];

  return (
    <div className="res-table-box">
      <div className="res-table-header">
        <div>
          <div className="res-table-title">Equipment & Resources Tracking</div>
          <div className="res-table-sub">Status & deployment overview</div>
        </div>
        <button
          className="btn btn-primary"
          style={{ height: 32, fontSize: 12 }}
          onClick={() => setShowAdd(true)}
        >
          + Add resource
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <table className="res-table">
            <thead>
              <tr>
                <th>Equipment / ID</th>
                <th>Supplier</th>
                <th>Qty</th>
                <th>Status</th>
                <th>Pipeline</th>
                <th>Availability / ETA</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td>
                    <div className="res-item-name">{row.item}</div>
                    <div className="res-item-po">{row.po}</div>
                  </td>
                  <td>
                    <div className="res-supplier">
                      <div className="supplier-avatar">
                        {row.supplier.initials}
                      </div>
                      <span className="supplier-name">{row.supplier.name}</span>
                    </div>
                  </td>
                  <td>{row.qty}</td>
                  <td>
                    <span className={`res-status-pill ${row.statusType}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <div className="pipeline-wrap">
                      {pipelines(row).map(({ label, val }) => (
                        <div key={label} className="pipeline-row">
                          <span className="pipeline-label">{label}</span>
                          <div className="pipeline-track">
                            <div
                              className={`pipeline-fill ${val === 100 ? "complete" : val === 0 ? "zero" : ""}`}
                              style={{ width: `${val}%` }}
                            />
                          </div>
                          <span className="pipeline-pct">{val}%</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="eta-headline">{row.eta.headline}</div>
                    <div className="eta-sub">{row.eta.sub}</div>
                  </td>
                  <td>
                    <button className="res-action-btn">{row.action}</button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-500">
                    No equipment found in catalog.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
