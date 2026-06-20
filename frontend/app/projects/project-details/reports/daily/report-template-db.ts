export type ReportSectionTemplate = {
  id: string;
  title: string;
  body: string;
};

export type ReportTemplate = {
  id: string;
  name: string;
  projectCode: string;
  location: string;
  inspector: string;
  integrationId: string;
  targetFolder: string;
  createdBy: string;
  sections: ReportSectionTemplate[];
};

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "site-observation",
    name: "PV Construction Site B Report",
    projectCode: "CON-BUILD-B-2024",
    location: "Site Sector 4",
    inspector: "Michael K. (Chief Engineer)",
    integrationId: "G-DOC-7822-X",
    targetFolder: "/Project-Reports-2024",
    createdBy: "System Automator",
    sections: [
      {
        id: "summary",
        title: "Summary of Progress",
        body: "Foundation work for Block B is now 85% complete. Retaining walls on the north facade have been inspected and meet all safety specifications. Structural steel delivery is expected for next Tuesday.",
      },
      {
        id: "visual",
        title: "Visual Documentation",
        body: "Attached visuals show completed trenching, slab reinforcement checks, and concrete curing quality in the west zone.",
      },
      {
        id: "next-actions",
        title: "Next Actions",
        body: "Proceed with formwork installation for Level 2 and schedule inspection for electrical conduit alignment before concrete pour.",
      },
    ],
  },
  {
    id: "daily-operations",
    name: "Daily Operations Report",
    projectCode: "OPS-TRACK-19",
    location: "North Expansion Plot",
    inspector: "Sara M. (Site Lead)",
    integrationId: "G-DOC-5510-K",
    targetFolder: "/Daily-Operations",
    createdBy: "Operations Bot",
    sections: [
      {
        id: "summary",
        title: "Daily Summary",
        body: "Earthworks were finalized in Zone C and drainage installation reached planned target for this shift.",
      },
      {
        id: "safety",
        title: "Safety Notes",
        body: "No incidents reported. PPE and scaffold checks were completed during morning briefing.",
      },
      {
        id: "materials",
        title: "Materials and Logistics",
        body: "Rebar shipment arrived at 10:30 AM. Concrete mix truck delayed by 25 minutes due to traffic restrictions.",
      },
    ],
  },
];
