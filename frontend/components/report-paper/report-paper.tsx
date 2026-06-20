import "./report-paper.css";
import { useMemo, useState } from "react";

type ReportSection = {
  id: string;
  title: string;
  body: string;
};

type ReportPaperProps = {
  documentName: string;
  projectCode: string;
  location: string;
  reportDate: string;
  inspector: string;
  onInspectorChange: (nextValue: string) => void;
  sections: ReportSection[];
  onSectionTitleChange: (sectionId: string, nextTitle: string) => void;
  onSectionBodyChange: (sectionId: string, nextBody: string) => void;
  onDownload: () => void;
};

type RichSection = {
  id: string;
  title: string;
  html: string;
};

function textToHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

function htmlToPlainText(html: string) {
  return html
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trimEnd();
}

function ReportPaper({
  documentName,
  projectCode,
  location,
  reportDate,
  inspector,
  onInspectorChange,
  sections,
  onSectionTitleChange,
  onSectionBodyChange,
  onDownload,
}: ReportPaperProps) {
  const [mode, setMode] = useState<"editor" | "preview">("editor");
  const [richSections, setRichSections] = useState<RichSection[]>(() =>
    sections.map((section) => ({
      id: section.id,
      title: section.title,
      html: textToHtml(section.body),
    })),
  );

  const applyFormatting = (command: "bold" | "underline") => {
    document.execCommand(command);
  };

  const handleEditorInput = (sectionId: string, nextHtml: string) => {
    const plainText = htmlToPlainText(nextHtml);

    setRichSections((previous) =>
      previous.map((section) =>
        section.id === sectionId ? { ...section, html: nextHtml } : section,
      ),
    );
    onSectionBodyChange(sectionId, plainText);
  };

  const previewSections = useMemo(
    () =>
      sections.map((section) => {
        const rich = richSections.find((item) => item.id === section.id);
        const richMatchesSection =
          rich && htmlToPlainText(rich.html) === section.body.trimEnd();

        return {
          id: section.id,
          title: section.title,
          html: richMatchesSection ? rich.html : textToHtml(section.body),
        };
      }),
    [sections, richSections],
  );

  return (
    <div className="report-right-side">
      <div className="report-right-info" aria-label="Report toolbar">
        <div className="report-meta-pill">
          {mode === "editor" ? "Editor" : "Preview"}
        </div>
        <div className="report-meta-light">
          {mode === "editor"
            ? "Edit predefined report text"
            : "PDF-like report preview"}
        </div>
        <div className="report-toolbar-spacer"></div>
        <button
          type="button"
          className="report-preview-btn"
          onClick={() =>
            setMode((previous) =>
              previous === "editor" ? "preview" : "editor",
            )
          }
        >
          {mode === "editor" ? "Preview" : "Back to Editor"}
        </button>
        <button
          type="button"
          className="report-download-btn"
          onClick={onDownload}
        >
          Download
        </button>
      </div>

      <div
        className={
          mode === "editor" ? "report-paper" : "report-paper preview-mode"
        }
      >
        <header className="paper-header">
          <h2>{documentName}</h2>
          <p>
            Project: {projectCode} | Location: {location}
          </p>
        </header>

        <section className="paper-meta-grid" aria-label="Report metadata">
          <div>
            <span>Date</span>
            <strong>{reportDate}</strong>
          </div>
          <label className="paper-inspector-field">
            <span>Inspector</span>
            <input
              type="text"
              value={inspector}
              onChange={(event) => onInspectorChange(event.target.value)}
            />
          </label>
        </section>

        {mode === "editor" ? (
          <div className="paper-sections">
            {previewSections.map((section, index) => (
              <article key={section.id} className="paper-section-card">
                <label className="section-title-editor">
                  <span>{index + 1}. Title</span>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(event) =>
                      onSectionTitleChange(section.id, event.target.value)
                    }
                  />
                </label>
                <div className="section-editor-toolbar">
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      applyFormatting("bold");
                    }}
                  >
                    Bold
                  </button>
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      applyFormatting("underline");
                    }}
                  >
                    Underline
                  </button>
                </div>
                <div
                  className="paper-editor-surface"
                  contentEditable
                  suppressContentEditableWarning
                  dangerouslySetInnerHTML={{ __html: section.html }}
                  onInput={(event) =>
                    handleEditorInput(section.id, event.currentTarget.innerHTML)
                  }
                />
              </article>
            ))}
          </div>
        ) : (
          <article className="pdf-preview-page" aria-label="PDF preview">
            <h2>{documentName}</h2>
            <p>
              Project: {projectCode} | Location: {location}
            </p>
            <p>Date: {reportDate}</p>
            <p>Inspector: {inspector}</p>

            <div className="preview-sections">
              {previewSections.map((section, index) => (
                <section key={section.id} className="preview-section">
                  <h3>
                    {index + 1}. {section.title}
                  </h3>
                  <div dangerouslySetInnerHTML={{ __html: section.html }} />
                </section>
              ))}
            </div>
          </article>
        )}
      </div>
    </div>
  );
}

export default ReportPaper;
