import "./report-details.css";

type TemplateOption = {
  id: string;
  name: string;
};

type ReportDetailsProps = {
  templateOptions: TemplateOption[];
  selectedTemplateId: string;
  onTemplateChange: (templateId: string) => void;
  documentName: string;
  onDocumentNameChange: (nextValue: string) => void;
  targetFolder: string;
  onTargetFolderChange: (nextValue: string) => void;
  reportDate: string;
  onReportDateChange: (nextValue: string) => void;
  onSync: () => void;
  integrationId: string;
  projectCode: string;
  createdBy: string;
};

function ReportDetails({
  templateOptions,
  selectedTemplateId,
  onTemplateChange,
  documentName,
  onDocumentNameChange,
  targetFolder,
  onTargetFolderChange,
  reportDate,
  onReportDateChange,
  onSync,
  integrationId,
  projectCode,
  createdBy,
}: ReportDetailsProps) {
  return (
    <div className="report-details">
      <div className="report-settings-header">
        <h2>Workspace Settings</h2>
        <p>Configure report source and sync behavior.</p>
      </div>

      <div className="report-settings-grid">
        <label className="settings-field">
          <span>Template</span>
          <select
            value={selectedTemplateId}
            onChange={(event) => onTemplateChange(event.target.value)}
          >
            {templateOptions.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>

        <label className="settings-field">
          <span>Document Name</span>
          <input
            type="text"
            value={documentName}
            onChange={(event) => onDocumentNameChange(event.target.value)}
          />
        </label>

        <label className="settings-field">
          <span>Target Folder</span>
          <input
            type="text"
            value={targetFolder}
            onChange={(event) => onTargetFolderChange(event.target.value)}
          />
        </label>

        <label className="settings-field">
          <span>Report Date</span>
          <input
            type="date"
            value={reportDate}
            onChange={(event) => onReportDateChange(event.target.value)}
          />
        </label>
      </div>

      <div className="sync-button-panel">
        <button type="button" className="sync-now-button" onClick={onSync}>
          Synch
        </button>
        <p className="sync-info">every 30 min</p>
      </div>

      <div className="integration-panel">
        <h3>Integration Details</h3>
        <dl>
          <div>
            <dt>Template ID</dt>
            <dd>{integrationId}</dd>
          </div>
          <div>
            <dt>Project Code</dt>
            <dd>{projectCode}</dd>
          </div>
          <div>
            <dt>Created By</dt>
            <dd>{createdBy}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export default ReportDetails;
