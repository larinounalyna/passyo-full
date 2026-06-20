"use client";

import { useState, useEffect, useCallback } from "react";
import "./DailyReportsPage.css";
import ReportDailyCard from "@/components/report_card/report_daily_card";
import ReportmeetingCard from "@/components/report_card/report_meeting_card";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useProject } from "@/lib/context/ProjectContext";
import { apiRequest } from "@/lib/api/client";
import { toast } from "sonner";
import { FilePlus, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import ReportPaper from "@/components/report-paper/report-paper";
import { jsPDF } from "jspdf";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface Report {
  id: number;
  title: string;
  report_date: string;
  created_at: string;
}

const MOCK_PAST_REPORTS: Record<
  string,
  { inspector: string; sections: { id: string; title: string; body: string }[] }
> = {
  "2026-06-19": {
    inspector: "Jean Dupont",
    sections: [
      {
        id: "1",
        title: "État d'avancement",
        body: "Coulage de la dalle terminé sur la zone 1. Début du coffrage zone 2.",
      },
      {
        id: "2",
        title: "Ressources",
        body: "Équipe Alpha (4), Équipe Gamma (2). Bétonnière opérationnelle.",
      },
    ],
  },
  "2026-06-18": {
    inspector: "Marie Laurent",
    sections: [
      {
        id: "1",
        title: "Terrassement",
        body: "Fouilles terminées à 100%. Évacuation des déblais en cours.",
      },
      {
        id: "2",
        title: "Météo",
        body: "Ciel dégagé, conditions optimales pour le terrassement.",
      },
    ],
  },
};

function DailyReportsPage() {
  const { project } = useProject();
  const [selectedDate, setSelectedDate] = useState<Value>(new Date());
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const MOCK_REPORT_SECTIONS = [
    {
      id: "1",
      title: "Résumé de l'activité",
      body: "Les travaux progressent conformément au planning. La livraison des matériaux a été effectuée sans encombre.",
    },
    {
      id: "2",
      title: "Points de vigilance",
      body: "Attention à la météo prévue pour demain, risque de fortes pluies retardant le coulage du béton.",
    },
    {
      id: "3",
      title: "Main d'œuvre",
      body: "Toutes les équipes sont présentes. Un technicien supplémentaire a été assigné pour le second œuvre.",
    },
  ];

  const fetchReports = useCallback(async () => {
    if (!project) return;
    try {
      setIsLoadingReports(true);
      const data = await apiRequest<Report[]>(`/reports/project/${project.id}`);
      setReports(data);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setIsLoadingReports(false);
    }
  }, [project]);

  useEffect(() => {
    void Promise.resolve().then(fetchReports);
  }, [fetchReports]);

  const handleGenerateReport = async () => {
    setIsReportModalOpen(true);
  };

  const handleExportReportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(24);
    doc.setFont("times", "bold");
    doc.text("RAPPORT DE CHANTIER", 105, 30, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("times", "normal");
    doc.text(
      `Projet : ${project?.name || "VH-2024"} | Lieu : Nice, France`,
      20,
      45,
    );
    doc.text(`Date : ${new Date().toLocaleDateString("fr-FR")}`, 20, 52);
    doc.text(`Inspecteur : Responsable Chantier`, 20, 59);

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

    doc.save(`rapport-${project?.name || "chantier"}.pdf`);
  };

  const selectedDateStr =
    selectedDate instanceof Date
      ? selectedDate.toISOString().split("T")[0]
      : "";
  const reportsForDate = reports.filter(
    (r) => r.report_date === selectedDateStr,
  );
  const pastReport = MOCK_PAST_REPORTS[selectedDateStr];

  const isToday =
    selectedDate &&
    new Date(selectedDate as Date).toDateString() === new Date().toDateString();

  return (
    <div className="daily-reports-page">
      <div className="reports-header-container flex justify-between items-center mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-1">
            <h2 className="text-3xl font-bold text-slate-700 tracking-tight">
              Project Reports
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-slate-200 via-slate-100 to-transparent"></div>
          </div>
          <p className="reports-subtitle">
            Select a date from the calendar to view available reports for that
            day.
          </p>
        </div>

        <Dialog.Root
          open={isReportModalOpen}
          onOpenChange={setIsReportModalOpen}
        >
          <Dialog.Trigger asChild>
            <button className="generate-report-btn ml-8">
              <FilePlus size={20} />
              <span>Generate Progress Report</span>
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
                  <button className="report-modal-close-btn" aria-label="Close">
                    <X size={18} />
                  </button>
                </Dialog.Close>
              </div>
              <div className="report-modal-body">
                <ReportPaper
                  documentName="RAPPORT DE CHANTIER"
                  projectCode={project?.name || "VH-2024"}
                  location="Site Chantier - Nice"
                  reportDate={new Date().toLocaleDateString("fr-FR")}
                  inspector="Responsable Chantier"
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

      <div className="reports-grid">
        <div className="reports-calendar-container">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            className="reports-calendar"
          />
        </div>

        <div className="reports-daily-container">
          {isLoadingReports ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : pastReport ? (
            <div className="embedded-report-preview">
              <ReportPaper
                documentName="RAPPORT DE CHANTIER"
                projectCode={project?.name || "VH-2024"}
                location="Site Chantier - Nice"
                reportDate={selectedDateStr}
                inspector={pastReport.inspector}
                onInspectorChange={() => {}}
                sections={pastReport.sections}
                onSectionTitleChange={() => {}}
                onSectionBodyChange={() => {}}
                onDownload={handleExportReportPDF}
              />
            </div>
          ) : reportsForDate.length > 0 ? (
            <div className="flex flex-col gap-4">
              {reportsForDate.map((report) => (
                <ReportDailyCard
                  key={report.id}
                  date={new Date(report.report_date)}
                />
              ))}
            </div>
          ) : (
            <div className="no-reports-placeholder">
              No reports found for this date.
            </div>
          )}
        </div>
      </div>

      {isToday && (
        <div className="mt-8">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-slate-700 tracking-tight">
              Today's Meetings
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-slate-200 via-slate-100 to-transparent"></div>
          </div>
          <div className="meetings-section">
            <h3>Meeting Reports</h3>
            <ReportmeetingCard />
          </div>
        </div>
      )}
    </div>
  );
}

export default DailyReportsPage;
