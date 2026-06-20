"use client";

import React, { useState, useRef, useMemo } from "react";
import {
  ChevronRight,
  Download,
  TriangleAlert,
  Pencil,
  Users,
  Upload,
  FileText,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import "./PlanningPage.css";
import * as Dialog from "@radix-ui/react-dialog";
import ReportPaper from "@/components/report-paper/report-paper";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

// ── Types ──────────────────────────────────────────────────
interface TaskRow {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  team: string;
  teamVariant: "blue" | "violet" | "green" | "amber";
  start: string;
  end: string;
  duration: string;
}

interface TaskSection {
  id: string;
  title: string;
  taskCount: string;
  statusLabel: string;
  statusVariant: "progress" | "waiting" | "planned";
  defaultOpen: boolean;
  rows: TaskRow[];
}

// ── Static data ────────────────────────────────────────────
const INITIAL_TASK_SECTIONS: TaskSection[] = [
  {
    id: "gros-oeuvre",
    title: "GROS ŒUVRE",
    taskCount: "3 Tâches",
    statusLabel: "Progression: 45%",
    statusVariant: "progress",
    defaultOpen: true,
    rows: [
      {
        id: "terrassement",
        name: "Terrassement et fouilles",
        unit: "m³",
        quantity: 450,
        team: "Équipe Alpha",
        teamVariant: "blue",
        start: "2024-05-12",
        end: "2024-05-18",
        duration: "6j",
      },
      {
        id: "fondations",
        name: "Fondations spéciales",
        unit: "ml",
        quantity: 120,
        team: "Équipe Gamma",
        teamVariant: "violet",
        start: "2024-05-19",
        end: "2024-05-25",
        duration: "6j",
      },
      {
        id: "dalle",
        name: "Dalle de compression",
        unit: "m²",
        quantity: 210,
        team: "Équipe Alpha",
        teamVariant: "blue",
        start: "2024-05-26",
        end: "2024-05-28",
        duration: "2j",
      },
    ],
  },
  {
    id: "second-oeuvre",
    title: "SECOND ŒUVRE",
    taskCount: "2 Tâches",
    statusLabel: "En attente",
    statusVariant: "waiting",
    defaultOpen: false,
    rows: [
      {
        id: "menuiseries",
        name: "Pose menuiseries extérieures",
        unit: "u",
        quantity: 14,
        team: "Équipe Delta",
        teamVariant: "amber",
        start: "2024-06-10",
        end: "2024-06-14",
        duration: "4j",
      },
      {
        id: "cloisonnement",
        name: "Cloisonnement plaques de plâtre",
        unit: "m²",
        quantity: 580,
        team: "Équipe Bêta",
        teamVariant: "violet",
        start: "2024-06-15",
        end: "2024-06-28",
        duration: "13j",
      },
    ],
  },
];

const TEAM_VARIANTS: Record<string, TaskRow["teamVariant"]> = {
  "Équipe Alpha": "blue",
  "Équipe Bêta": "violet",
  "Équipe Gamma": "green",
  "Équipe Delta": "amber",
};

const MOCK_REPORT_SECTIONS = [
  {
    id: "1",
    title: "Résumé de l'activité",
    body: "Les travaux de gros œuvre progressent conformément au planning. Le terrassement est achevé à 100% sur la zone nord.",
  },
  {
    id: "2",
    title: "Ressources engagées",
    body: "Équipe Alpha : 5 ouvriers, 1 chef de chantier.\nMatériel : 2 pelleteuses, 1 camion benne.",
  },
  {
    id: "3",
    title: "Points de vigilance",
    body: "Prévoir une intervention supplémentaire pour le ferraillage des fondations suite au léger retard de livraison.",
  },
];

export default function PlanningPage() {
  const [sections, setSections] = useState<TaskSection[]>(
    INITIAL_TASK_SECTIONS,
  );
  const [openSectionIds, setOpenSectionIds] = useState<Set<string>>(
    () =>
      new Set(
        INITIAL_TASK_SECTIONS.filter((s) => s.defaultOpen).map((s) => s.id),
      ),
  );
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Handlers ──────────────────────────────────────────────

  const toggleSection = (id: string) => {
    setOpenSectionIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const updateTask = (
    sectionId: string,
    taskId: string,
    field: keyof TaskRow,
    value: any,
  ) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          rows: s.rows.map((r) => {
            if (r.id !== taskId) return r;
            const updatedRow: TaskRow = { ...r, [field]: value };
            if (field === "team") {
              updatedRow.teamVariant = TEAM_VARIANTS[value] || "blue";
            }
            return updatedRow;
          }),
        };
      }),
    );
  };

  const addTask = (sectionId: string) => {
    const newId = `task-${Date.now()}`;
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const newTask: TaskRow = {
          id: newId,
          name: "Nouvelle tâche",
          unit: "u",
          quantity: 0,
          team: "Équipe Alpha",
          teamVariant: "blue",
          start: new Date().toISOString().split("T")[0],
          end: new Date().toISOString().split("T")[0],
          duration: "1j",
        };
        const nextRows = [...s.rows, newTask];
        return {
          ...s,
          rows: nextRows,
          taskCount: `${nextRows.length} Tâches`,
        };
      }),
    );
  };

  const deleteTask = (sectionId: string, taskId: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const nextRows = s.rows.filter((r) => r.id !== taskId);
        return {
          ...s,
          rows: nextRows,
          taskCount: `${nextRows.length} Tâches`,
        };
      }),
    );
  };

  // ── Excel Import ──
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length > 0) {
          const importedTasks = data.map((item: any, idx) => ({
            id: `imported-${idx}-${Date.now()}`,
            name: item.Tâche || item.Name || item.Task || "Tâche importée",
            unit: item.Unité || item.Unit || "u",
            quantity: Number(item.Quantité || item.Quantity) || 0,
            team: item.Équipe || item.Team || "Équipe Alpha",
            teamVariant: TEAM_VARIANTS[item.Équipe || item.Team] || "blue",
            start: item.Début || item.Start || "",
            end: item.Fin || item.End || "",
            duration: item.Durée || item.Duration || "0j",
          }));

          const sectionId = `import-${Date.now()}`;
          setSections((prev) => [
            ...prev,
            {
              id: sectionId,
              title: "IMPORT EXCEL",
              taskCount: `${importedTasks.length} Tâches`,
              statusLabel: "Planifié",
              statusVariant: "planned",
              defaultOpen: true,
              rows: importedTasks,
            },
          ]);
          setOpenSectionIds((prev) => new Set([...prev, sectionId]));
        }
      } catch (err) {
        console.error("Excel import failed", err);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ""; // Reset
  };

  // ── PDF Export (Planning Grid) ──
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(30, 79, 208);
    doc.text("RAPPORT DE PLANNING - VILLA HORIZON", 105, 20, {
      align: "center",
    });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Généré le ${new Date().toLocaleString()}`, 105, 28, {
      align: "center",
    });

    let y = 40;
    sections.forEach((section) => {
      doc.setFillColor(240, 245, 255);
      doc.rect(15, y - 5, 180, 8, "F");
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 79, 208);
      doc.text(section.title.toUpperCase(), 20, y);
      y += 10;

      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.text("Tâche", 20, y);
      doc.text("Qté", 90, y);
      doc.text("Équipe", 110, y);
      doc.text("Début", 150, y);
      doc.text("Fin", 175, y);
      y += 4;
      doc.setDrawColor(220);
      doc.line(15, y, 195, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(40);
      section.rows.forEach((row) => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        doc.text(row.name.substring(0, 40), 20, y);
        doc.text(`${row.quantity} ${row.unit}`, 90, y);
        doc.text(row.team, 110, y);
        doc.text(row.start, 150, y);
        doc.text(row.end, 175, y);
        y += 7;
      });
      y += 10;
    });

    doc.save("planning-villa-horizon.pdf");
  };

  // ── PDF Export (Report) ──
  const handleExportReportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(24);
    doc.setFont("times", "bold");
    doc.text("RAPPORT DE CHANTIER", 105, 30, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("times", "normal");
    doc.text(`Projet : VH-2024 | Lieu : Villa Horizon - Nice`, 20, 45);
    doc.text(`Date : ${new Date().toLocaleDateString("fr-FR")}`, 20, 52);
    doc.text(`Inspecteur : Chef de Projet`, 20, 59);

    doc.setLineWidth(0.5);
    doc.line(20, 65, 190, 65);

    let y = 80;
    MOCK_REPORT_SECTIONS.forEach((section, index) => {
      doc.setFont("times", "bold");
      doc.setFontSize(16);
      doc.text(`${index + 1}. ${section.title}`, 20, y);
      y += 10;

      doc.setFont("times", "normal");
      doc.setFontSize(12);
      const splitBody = doc.splitTextToSize(section.body, 170);
      doc.text(splitBody, 20, y);
      y += splitBody.length * 6 + 10;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save("rapport-chantier-villa-horizon.pdf");
  };

  const totalQuantity = useMemo(
    () =>
      sections.reduce(
        (sum, s) =>
          sum + s.rows.reduce((a, r) => a + Number(r.quantity || 0), 0),
        0,
      ),
    [sections],
  );

  return (
    <div className="planning-page-main pt-4 pb-8">
      <div className="planning-page-content">
        {/* ── Page header ── */}
        <div className="planning-header">
          <div>
            <h2 className="planning-page-title">Smart Grid Planning</h2>
            <p className="planning-page-sub">
              Suivi et ordonnancement dynamique des phases de chantier
            </p>
          </div>
          <div className="planning-header-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={15} />
              Importer Excel
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept=".xlsx, .xls"
              onChange={handleImportExcel}
            />

            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleExportPDF}
            >
              <Download size={15} />
              Export PDF
            </button>

            <Dialog.Root
              open={isReportModalOpen}
              onOpenChange={setIsReportModalOpen}
            >
              <Dialog.Trigger asChild>
                <button type="button" className="btn btn-primary">
                  <FileText size={15} />
                  Générer Rapport
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="report-modal-overlay" />
                <Dialog.Content className="report-modal-content">
                  <div className="report-modal-header">
                    <Dialog.Title className="report-modal-title">
                      Aperçu du Rapport
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <button
                        className="report-modal-close-btn"
                        aria-label="Close"
                      >
                        <X size={18} />
                      </button>
                    </Dialog.Close>
                  </div>
                  <div className="report-modal-body">
                    <ReportPaper
                      documentName="RAPPORT DE CHANTIER"
                      projectCode="VH-2024"
                      location="Villa Horizon - Nice"
                      reportDate={new Date().toLocaleDateString("fr-FR")}
                      inspector="Chef de Projet"
                      onInspectorChange={() => {}}
                      sections={MOCK_REPORT_SECTIONS}
                      onSectionTitleChange={() => {}}
                      onSectionBodyChange={() => {}}
                      onDownload={handleExportReportPDF}
                    />
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>

        {/* ── Smart Grid table ── */}
        <div className="smart-grid-container">
          <div className="planning-table-wrap">
            <table className="planning-table">
              <thead>
                <tr className="planning-thead-row">
                  <th className="planning-th planning-th--left">Désignation</th>
                  <th className="planning-th">Unité</th>
                  <th className="planning-th">Quantité</th>
                  <th className="planning-th">Équipe</th>
                  <th className="planning-th">Début</th>
                  <th className="planning-th">Fin</th>
                  <th className="planning-th">Durée</th>
                  <th className="planning-th w-12"></th>
                </tr>
              </thead>

              {sections.map((section) => {
                const isOpen = openSectionIds.has(section.id);
                return (
                  <tbody key={section.id}>
                    <tr
                      className="planning-section-row"
                      onClick={() => toggleSection(section.id)}
                    >
                      <td colSpan={8}>
                        <div className="planning-section-header">
                          <div className="planning-section-left">
                            <ChevronRight
                              size={16}
                              className={`planning-chevron ${isOpen ? "planning-chevron--open" : ""}`}
                            />
                            <span className="planning-section-title">
                              {section.title}
                            </span>
                            <span className="planning-task-count">
                              {section.taskCount}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span
                              className={`planning-status-badge planning-status-badge--${section.statusVariant}`}
                            >
                              {section.statusLabel}
                            </span>
                            <button
                              className="add-task-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                addTask(section.id);
                              }}
                              title="Ajouter une tâche"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {isOpen &&
                      section.rows.map((row) => (
                        <tr key={row.id} className="planning-task-row">
                          <td className="planning-td">
                            <input
                              className="editable-cell-input"
                              value={row.name}
                              onChange={(e) =>
                                updateTask(
                                  section.id,
                                  row.id,
                                  "name",
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                          <td className="planning-td planning-td--center">
                            <input
                              className="editable-cell-input text-center"
                              value={row.unit}
                              onChange={(e) =>
                                updateTask(
                                  section.id,
                                  row.id,
                                  "unit",
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                          <td className="planning-td planning-td--center">
                            <input
                              className="planning-qty-input"
                              type="number"
                              value={row.quantity}
                              onChange={(e) =>
                                updateTask(
                                  section.id,
                                  row.id,
                                  "quantity",
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                          <td className="planning-td planning-td--center">
                            <select
                              className="editable-cell-select"
                              value={row.team}
                              onChange={(e) =>
                                updateTask(
                                  section.id,
                                  row.id,
                                  "team",
                                  e.target.value,
                                )
                              }
                            >
                              {Object.keys(TEAM_VARIANTS).map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="planning-td planning-td--center">
                            <input
                              type="date"
                              className="editable-cell-input"
                              value={row.start}
                              onChange={(e) =>
                                updateTask(
                                  section.id,
                                  row.id,
                                  "start",
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                          <td className="planning-td planning-td--center">
                            <input
                              type="date"
                              className="editable-cell-input"
                              value={row.end}
                              onChange={(e) =>
                                updateTask(
                                  section.id,
                                  row.id,
                                  "end",
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                          <td className="planning-td planning-td--center">
                            <input
                              className="editable-cell-input text-center"
                              value={row.duration}
                              onChange={(e) =>
                                updateTask(
                                  section.id,
                                  row.id,
                                  "duration",
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                          <td className="planning-td planning-td--center">
                            <button
                              className="delete-task-btn"
                              onClick={() => deleteTask(section.id, row.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                );
              })}

              <tfoot>
                <tr className="planning-tfoot-row">
                  <td className="planning-tfoot-td planning-tfoot-td--label">
                    TOTAL PROJET
                  </td>
                  <td className="planning-tfoot-td planning-tfoot-td--center">
                    —
                  </td>
                  <td className="planning-tfoot-td planning-tfoot-td--center planning-tfoot-td--accent">
                    {totalQuantity.toLocaleString("fr-FR")} u.
                  </td>
                  <td
                    className="planning-tfoot-td planning-tfoot-td--center"
                    colSpan={5}
                  >
                    Synthèse globale du planning
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
