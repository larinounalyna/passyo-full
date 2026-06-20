"use client";

import { jsPDF } from "jspdf";
import { useEffect, useMemo, useState } from "react";
import "./daily-report.css";
import ReportPaper from "@/components/report-paper/report-paper";
import ReportDetails from "@/components/report-details/report-details";
import {
  REPORT_TEMPLATES,
  type ReportSectionTemplate,
} from "./report-template-db";

type EditableSection = {
  id: string;
  title: string;
  body: string;
};

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

function DailyReport() {
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    REPORT_TEMPLATES[0]?.id ?? "",
  );

  const selectedTemplate = useMemo(
    () =>
      REPORT_TEMPLATES.find((template) => template.id === selectedTemplateId) ??
      REPORT_TEMPLATES[0],
    [selectedTemplateId],
  );

  const [documentName, setDocumentName] = useState(
    selectedTemplate?.name ?? "Construction Report",
  );
  const [targetFolder, setTargetFolder] = useState(
    selectedTemplate?.targetFolder ?? "/Reports",
  );
  const [reportDate, setReportDate] = useState(todayISODate());
  const [inspector, setInspector] = useState(selectedTemplate?.inspector ?? "");
  const [sections, setSections] = useState<EditableSection[]>(
    selectedTemplate?.sections ?? [],
  );

  const applyTemplate = (templateId: string) => {
    const nextTemplate =
      REPORT_TEMPLATES.find((template) => template.id === templateId) ??
      REPORT_TEMPLATES[0];

    if (!nextTemplate) {
      return;
    }

    setSelectedTemplateId(nextTemplate.id);
    setDocumentName(nextTemplate.name);
    setTargetFolder(nextTemplate.targetFolder);
    setInspector(nextTemplate.inspector);
    setSections(nextTemplate.sections);
  };

  const updateSectionBody = (sectionId: string, nextBody: string) => {
    setSections((previous) =>
      previous.map((section) =>
        section.id === sectionId ? { ...section, body: nextBody } : section,
      ),
    );
  };

  const updateSectionTitle = (sectionId: string, nextTitle: string) => {
    setSections((previous) =>
      previous.map((section) =>
        section.id === sectionId ? { ...section, title: nextTitle } : section,
      ),
    );
  };

  const handleSync = async () => {
    try {
      // Simulate sync operation (in production, this would sync to backend)
      await new Promise((resolve) => setTimeout(resolve, 300));
      console.log(`Synced report at ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.error("Sync failed:", error);
    }
  };

  // Auto-sync every 30 minutes
  useEffect(() => {
    const syncInterval = setInterval(
      () => {
        handleSync();
      },
      30 * 60 * 1000,
    ); // 30 minutes in milliseconds

    return () => clearInterval(syncInterval);
  }, []);

  const handleDownload = () => {
    if (!selectedTemplate) {
      return;
    }

    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 48;
    const maxTextWidth = pageWidth - margin * 2;
    let cursorY = margin;

    const ensureRoom = (requiredHeight: number) => {
      if (cursorY + requiredHeight > pageHeight - margin) {
        pdf.addPage();
        cursorY = margin;
      }
    };

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    ensureRoom(30);
    pdf.text(documentName, margin, cursorY);
    cursorY += 28;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    const metaLines = [
      `Project: ${selectedTemplate.projectCode}`,
      `Location: ${selectedTemplate.location}`,
      `Date: ${reportDate}`,
      `Inspector: ${inspector}`,
    ];

    metaLines.forEach((line) => {
      ensureRoom(18);
      pdf.text(line, margin, cursorY);
      cursorY += 16;
    });

    cursorY += 6;

    sections.forEach((section, index) => {
      ensureRoom(24);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text(`${index + 1}. ${section.title}`, margin, cursorY);
      cursorY += 18;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      const wrappedBody = pdf.splitTextToSize(section.body, maxTextWidth);

      wrappedBody.forEach((line: string) => {
        ensureRoom(16);
        pdf.text(line, margin, cursorY);
        cursorY += 15;
      });

      cursorY += 8;
    });

    pdf.save(`${documentName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  };

  return (
    <div className="daily-report">
      <ReportDetails
        templateOptions={REPORT_TEMPLATES}
        selectedTemplateId={selectedTemplateId}
        onTemplateChange={applyTemplate}
        documentName={documentName}
        onDocumentNameChange={setDocumentName}
        targetFolder={targetFolder}
        onTargetFolderChange={setTargetFolder}
        reportDate={reportDate}
        onReportDateChange={setReportDate}
        onSync={handleSync}
        integrationId={selectedTemplate?.integrationId ?? "-"}
        projectCode={selectedTemplate?.projectCode ?? "-"}
        createdBy={selectedTemplate?.createdBy ?? "-"}
      />
      <ReportPaper
        documentName={documentName}
        projectCode={selectedTemplate?.projectCode ?? "-"}
        location={selectedTemplate?.location ?? "-"}
        reportDate={reportDate}
        inspector={inspector}
        onInspectorChange={setInspector}
        sections={sections as ReportSectionTemplate[]}
        onSectionTitleChange={updateSectionTitle}
        onSectionBodyChange={updateSectionBody}
        onDownload={handleDownload}
      />
    </div>
  );
}

export default DailyReport;
