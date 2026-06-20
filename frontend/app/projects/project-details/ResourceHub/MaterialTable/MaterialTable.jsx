import React, { useState, useEffect, useCallback } from "react";
import "./MaterialTable.css";
import { apiRequest } from "@/lib/api/client";

export default function MaterialTable() {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMaterials = useCallback(async () => {
    try {
      setIsLoading(true);
      // Assuming resources endpoint handles type filtering or we filter client-side
      const data = await apiRequest("/resources/");
      const materials = data.filter(r => r.type === "material" || r.type === "raw_material");
      
      const mapped = materials.map(m => ({
        item: m.name,
        po: `RES-${m.id}`,
        supplier: { name: m.supplier || "Internal Store", initials: (m.supplier || "IS").slice(0, 2).toUpperCase() },
        qty: `${m.quantity} ${m.unit || "units"}`,
        status: m.status === "available" ? "ON SITE" : m.status === "ordered" ? "IN TRANSIT" : "DELAYED",
        statusType: m.status === "available" ? "success" : m.status === "ordered" ? "info" : "danger",
        pipeline: { 
          fab: m.status === "available" ? 100 : 60, 
          ship: m.status === "available" ? 100 : 20, 
          site: m.status === "available" ? 100 : 0 
        },
        eta: { headline: m.status === "available" ? "Delivered" : "Pending", sub: m.last_restock ? `Restocked: ${new Date(m.last_restock).toLocaleDateString()}` : "Awaiting update" },
        action: "VIEW DETAILS",
      }));
      setRows(mapped);
    } catch (err) {
      console.error("Failed to fetch materials:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  return (
    <div className="material-table-container">
      <div className="table-header">
        <div className="table-title">Materials Tracking</div>
        <div className="table-subtitle">Live inventory & supply status</div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <table className="material-table">
          <thead>
            <tr>
              <th>ITEM NAME / ID</th>
              <th>SUPPLIER</th>
              <th>QTY</th>
              <th>STATUS & PIPELINE</th>
              <th>TRACKING / ETA</th>
              <th>ACTIONS</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>
                  <div className="item-info">
                    <div className="item-name">{row.item}</div>
                    <div className="item-id">{row.po}</div>
                  </div>
                </td>

                <td>
                  <div className="supplier-info">
                    <div className="supplier-avatar">{row.supplier.initials}</div>
                    <div className="supplier-name">{row.supplier.name}</div>
                  </div>
                </td>

                <td>
                  <div className="qty">{row.qty}</div>
                </td>

                <td>
                  <span className={`status ${row.statusType}`}>{row.status}</span>
                  <div className="pipeline">
                    <div className="pipeline-item">
                      <span className="pipeline-label">FAB</span>
                      <div className="pipeline-bar">
                        <div
                          className="pipeline-fill warn"
                          style={{ width: `${row.pipeline.fab}%` }}
                        />
                      </div>
                      <span className="pipeline-value">{row.pipeline.fab}%</span>
                    </div>
                    <div className="pipeline-item">
                      <span className="pipeline-label">SHIP</span>
                      <div className="pipeline-bar">
                        <div
                          className="pipeline-fill info"
                          style={{ width: `${row.pipeline.ship}%` }}
                        />
                      </div>
                      <span className="pipeline-value">{row.pipeline.ship}%</span>
                    </div>
                    <div className="pipeline-item">
                      <span className="pipeline-label">SITE</span>
                      <div className="pipeline-bar">
                        <div
                          className="pipeline-fill success"
                          style={{ width: `${row.pipeline.site}%` }}
                        />
                      </div>
                      <span className="pipeline-value">{row.pipeline.site}%</span>
                    </div>
                  </div>
                </td>

                <td>
                  <div className="eta-info">
                    <div className="eta-main">{row.eta.headline}</div>
                    <div className="eta-sub">{row.eta.sub}</div>
                  </div>
                </td>

                <td>
                  <button className="action-btn">{row.action}</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-12 text-gray-500">
                  No materials found in catalog.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
