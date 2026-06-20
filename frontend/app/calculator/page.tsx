"use client";

import { useState, useRef } from "react";
import "./page.css";
import Sidebar from "@/components/sidebar/sidebar";
import PageTitle from "@/components/page_title/page_title";
import { toast } from "sonner";
import {
  UploadCloud,
  FileText,
  CheckCircle,
  Settings,
  BarChart2,
  Plus,
  Trash2,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8002";

const STEPS = [
  { id: 1, name: "Upload", icon: <UploadCloud size={18} /> },
  { id: 2, name: "Validation", icon: <CheckCircle size={18} /> },
  { id: 3, name: "Site Config", icon: <Settings size={18} /> },
  { id: 4, name: "Results", icon: <BarChart2 size={18} /> },
];

export default function CalculatorPage() {
  const [activeStep, setActiveStep] = useState(1);
  const [uploadType, setUploadType] = useState<"bim" | "pdf">("bim");
  const [isLoading, setIsLoading] = useState(false);

  // Data State
  const [fileData, setFileData] = useState<any>(null);
  const [components, setComponents] = useState<any[]>([]);
  const [results, setResults] = useState<any>(null);

  // Config State
  const [config, setConfig] = useState({
    equipment_ownership: "rented",
    concrete_method: "ready_mix",
    site_access: "urban",
    soil_type: "mixed",
    utility_access: "full",
    site_distance_km: 10,
    site_narrowness: 0.5,
    worker_accommodation_available: false,
    total_project_days: 120,
    daily_worker_count: 20,
  });

  const fileInputBimRef = useRef<HTMLInputElement>(null);
  const fileInputPdfRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File, type: "bim" | "pdf") => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const endpoint =
        type === "pdf" ? "/api/v2/upload/pdf-file" : "/api/v2/upload/bim-file";
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok)
        throw new Error("Upload failed. Make sure backend is running.");

      const data = await res.json();
      setFileData(data);
      setComponents(data.components || []);
      toast.success(
        `Successfully extracted ${data.components?.length || 0} components.`,
      );
      setActiveStep(2);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateEstimate = async () => {
    setIsLoading(true);
    try {
      const payload = {
        project_name: fileData?.filename || "Smart Estimator Project",
        components: components.map((c, i) => ({
          id: c.id || `comp_${i}`,
          ifc_type: c.ifc_type || "Unknown",
          description: c.description || "Component",
          quantity: parseFloat(c.quantity) || 1,
          unit: c.unit || "m3",
          material_code: c.material_code || "STANDARD",
          base_material_price: parseFloat(c.base_material_price) || 0,
          labor_hours_base: parseFloat(c.labor_hours_base) || 1,
          labor_rate_per_hour: parseFloat(c.labor_rate_per_hour) || 25,
        })),
        contextual_wizard: config,
        profit_margin_percent: 15.0,
      };

      const res = await fetch(`${API_BASE}/api/v2/estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Estimation failed");

      const data = await res.json();
      setResults(data);
      toast.success("Estimate generated successfully!");
      setActiveStep(4);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("fr-DZ", {
      style: "currency",
      currency: "DZD",
    }).format(val);
  };

  return (
    <div className="calc-right-side app-shell">
      <Sidebar />
      <main className="calc-content app-content">
        <div className="calc-header page-header-block">
          <PageTitle title="Smart Estimator" />
        </div>

        <section className="calc-surface">
          {/* Stepper */}
          <div className="calc-steps">
            {STEPS.map((step) => (
              <button
                key={step.id}
                className={`step-item ${activeStep === step.id ? "active" : ""} ${activeStep > step.id ? "completed" : ""}`}
                onClick={() => {
                  if (step.id <= Math.max(1, activeStep))
                    setActiveStep(step.id);
                }}
              >
                <span className="step-icon">{step.icon}</span>
                <small>{step.name}</small>
              </button>
            ))}
          </div>

          <div className="step-content-container">
            {/* STEP 1: UPLOAD */}
            {activeStep === 1 && (
              <div className="step-card">
                <h2>Import Project File</h2>
                <p>
                  Upload a BIM model or a PDF floor plan to extract building
                  components automatically.
                </p>

                <div className="upload-type-toggles">
                  <button
                    className={uploadType === "bim" ? "active" : ""}
                    onClick={() => setUploadType("bim")}
                  >
                    BIM File (.ifc, .xlsx)
                  </button>
                  <button
                    className={uploadType === "pdf" ? "active" : ""}
                    onClick={() => setUploadType("pdf")}
                  >
                    PDF Floor Plan
                  </button>
                </div>

                <div
                  className="upload-dropzone"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0])
                      handleFileUpload(e.dataTransfer.files[0], uploadType);
                  }}
                >
                  <UploadCloud size={48} className="dropzone-icon" />
                  <h3>
                    Drag & Drop your{" "}
                    {uploadType === "bim" ? "BIM File" : "PDF File"}
                  </h3>
                  <p>or click to browse</p>
                  <button
                    className="btn-primary"
                    onClick={() =>
                      uploadType === "bim"
                        ? fileInputBimRef.current?.click()
                        : fileInputPdfRef.current?.click()
                    }
                    disabled={isLoading}
                  >
                    {isLoading ? "Processing..." : "Select File"}
                  </button>
                  <input
                    ref={fileInputBimRef}
                    type="file"
                    hidden
                    accept=".ifc,.xlsx,.xls"
                    onChange={(e) =>
                      e.target.files?.[0] &&
                      handleFileUpload(e.target.files[0], "bim")
                    }
                  />
                  <input
                    ref={fileInputPdfRef}
                    type="file"
                    hidden
                    accept=".pdf"
                    onChange={(e) =>
                      e.target.files?.[0] &&
                      handleFileUpload(e.target.files[0], "pdf")
                    }
                  />
                </div>
              </div>
            )}

            {/* STEP 2: VALIDATION */}
            {activeStep === 2 && (
              <div className="step-card">
                <h2>Review Extracted Components</h2>
                <p>
                  Verify quantities, materials, and units before proceeding to
                  estimation.
                </p>

                <div className="table-responsive">
                  <table className="components-table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Type</th>
                        <th>Qty</th>
                        <th>Unit</th>
                        <th>Material Code</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {components.map((comp, idx) => (
                        <tr key={idx}>
                          <td>
                            <input
                              value={comp.description}
                              onChange={(e) => {
                                const newC = [...components];
                                newC[idx].description = e.target.value;
                                setComponents(newC);
                              }}
                            />
                          </td>
                          <td>{comp.ifc_type}</td>
                          <td>
                            <input
                              type="number"
                              value={comp.quantity}
                              onChange={(e) => {
                                const newC = [...components];
                                newC[idx].quantity = e.target.value;
                                setComponents(newC);
                              }}
                            />
                          </td>
                          <td>{comp.unit}</td>
                          <td>{comp.material_code}</td>
                          <td>
                            <button
                              className="btn-icon text-red"
                              onClick={() =>
                                setComponents(
                                  components.filter((_, i) => i !== idx),
                                )
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="step-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => setActiveStep(1)}
                  >
                    Back
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => setActiveStep(3)}
                  >
                    Next: Site Config
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SITE CONFIG */}
            {activeStep === 3 && (
              <div className="step-card">
                <h2>Site & Context Configuration</h2>
                <p>
                  These parameters will adjust labor rates, transport costs, and
                  difficulty multipliers.
                </p>

                <div className="config-grid">
                  <div className="form-group">
                    <label>Equipment Strategy</label>
                    <select
                      value={config.equipment_ownership}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          equipment_ownership: e.target.value,
                        })
                      }
                    >
                      <option value="rented">Rented</option>
                      <option value="owned">Owned</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Concrete Method</label>
                    <select
                      value={config.concrete_method}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          concrete_method: e.target.value,
                        })
                      }
                    >
                      <option value="ready_mix">Ready Mix</option>
                      <option value="on_site_mixing">On-Site Mixing</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Site Accessibility</label>
                    <select
                      value={config.site_access}
                      onChange={(e) =>
                        setConfig({ ...config, site_access: e.target.value })
                      }
                    >
                      <option value="urban">Urban (Easy)</option>
                      <option value="remote">Remote (Moderate)</option>
                      <option value="extremely_remote">
                        Extremely Remote (Hard)
                      </option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Soil Type</label>
                    <select
                      value={config.soil_type}
                      onChange={(e) =>
                        setConfig({ ...config, soil_type: e.target.value })
                      }
                    >
                      <option value="sandy">Sandy (Easy)</option>
                      <option value="clay">Clay (Moderate)</option>
                      <option value="mixed">Mixed</option>
                      <option value="rocky">Rocky (Hard)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Utility Access</label>
                    <select
                      value={config.utility_access}
                      onChange={(e) =>
                        setConfig({ ...config, utility_access: e.target.value })
                      }
                    >
                      <option value="full">Full (Water + Elec)</option>
                      <option value="partial">Partial</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Distance to Suppliers (km)</label>
                    <input
                      type="number"
                      value={config.site_distance_km}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          site_distance_km: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="step-actions mt-6">
                  <button
                    className="btn-secondary"
                    onClick={() => setActiveStep(2)}
                  >
                    Back
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleGenerateEstimate}
                    disabled={isLoading}
                  >
                    {isLoading ? "Calculating..." : "Generate Estimate"}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: RESULTS */}
            {activeStep === 4 && results && (
              <div className="step-card results-view">
                <div className="results-header">
                  <h2>Estimation Results</h2>
                  <p>
                    Project: <strong>{results.project_name}</strong> |
                    Reference: {results.bid_id}
                  </p>
                </div>

                <div className="metrics-row">
                  <div className="metric-card">
                    <small>Material Cost</small>
                    <h3>
                      {formatCurrency(
                        parseFloat(results.summary?.total_material_cost || 0),
                      )}
                    </h3>
                  </div>
                  <div className="metric-card">
                    <small>Labor Cost</small>
                    <h3>
                      {formatCurrency(
                        parseFloat(results.summary?.total_labor_cost || 0),
                      )}
                    </h3>
                  </div>
                  <div className="metric-card">
                    <small>Net Cost</small>
                    <h3>
                      {formatCurrency(
                        parseFloat(results.summary?.base_cost || 0),
                      )}
                    </h3>
                  </div>
                  <div className="metric-card highlight">
                    <small>Final Price (incl. Margin)</small>
                    <h3>
                      {formatCurrency(
                        parseFloat(results.summary?.final_bid_price || 0),
                      )}
                    </h3>
                  </div>
                </div>

                <h3 className="mt-8 mb-4">Detailed Bill of Quantities (BoQ)</h3>
                <div className="table-responsive">
                  <table className="boq-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Type</th>
                        <th>Qty</th>
                        <th>Materials</th>
                        <th>Labor</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.summary?.details?.items?.map(
                        (item: any, idx: number) => (
                          <tr key={idx}>
                            <td>{item.description}</td>
                            <td>{item.ifc_type}</td>
                            <td>
                              {Number(item.quantity).toFixed(2)} {item.unit}
                            </td>
                            <td>
                              {formatCurrency(parseFloat(item.material_cost))}
                            </td>
                            <td>
                              {formatCurrency(parseFloat(item.labor_cost))}
                            </td>
                            <td>
                              <strong>
                                {formatCurrency(parseFloat(item.total_cost))}
                              </strong>
                            </td>
                          </tr>
                        ),
                      ) || (
                        <tr>
                          <td colSpan={6}>
                            Detailed breakdown not returned in summary directly
                            in this basic view.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="step-actions mt-8">
                  <button
                    className="btn-secondary"
                    onClick={() => setActiveStep(3)}
                  >
                    Back to Config
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setFileData(null);
                      setComponents([]);
                      setResults(null);
                      setActiveStep(1);
                    }}
                  >
                    Start New Estimate
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
