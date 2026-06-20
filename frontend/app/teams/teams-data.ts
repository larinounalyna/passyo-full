export type TeamStatus = "Active" | "On Hold" | "Planning";

export type Team = {
  id: number;
  name: string;
  focus: string;
  projectCount: number;
  memberCount: number;
  status: TeamStatus;
  lastUpdate: string;
  members: string[];
  lead: string;
  department: string;
  location: string;
  activeProjects: string[];
};

export const TEAMS: Team[] = [
  {
    id: 1,
    name: "Architecture Team",
    focus: "Leads master scheduling, structural phasing, and design approvals.",
    projectCount: 4,
    memberCount: 7,
    status: "Active",
    lastUpdate: "2h ago",
    members: ["AL", "MR", "SN", "+4"],
    lead: "Amine L.",
    department: "Design & Planning",
    location: "HQ - Floor 4",
    activeProjects: [
      "Skyline Plaza Phase II",
      "Riverside Mall Expansion",
      "North Tower Retrofit",
      "Green District Hub",
    ],
  },
  {
    id: 2,
    name: "Site Operations",
    focus:
      "Coordinates on-site execution, safety checks, and daily work packages.",
    projectCount: 6,
    memberCount: 11,
    status: "Active",
    lastUpdate: "30m ago",
    members: ["RT", "EA", "KM", "+8"],
    lead: "Riad T.",
    department: "Operations",
    location: "West Site Office",
    activeProjects: [
      "Skyline Plaza Phase II",
      "South Bridge Rehabilitation",
      "Metro Station Upgrade",
      "Lakeside Residential Blocks",
    ],
  },
  {
    id: 3,
    name: "Procurement & Logistics",
    focus:
      "Tracks vendor deliveries, equipment allocation, and material readiness.",
    projectCount: 3,
    memberCount: 5,
    status: "Planning",
    lastUpdate: "Yesterday",
    members: ["YN", "BD", "LU", "+2"],
    lead: "Yasmine N.",
    department: "Supply Chain",
    location: "Logistics Hub",
    activeProjects: [
      "Skyline Plaza Phase II",
      "Airport Access Corridor",
      "City Hospital Annex",
    ],
  },
  {
    id: 4,
    name: "Quality Assurance",
    focus: "Runs inspections, punch-list tracking, and handover documentation.",
    projectCount: 2,
    memberCount: 4,
    status: "On Hold",
    lastUpdate: "3 days ago",
    members: ["QS", "NP", "HB", "+1"],
    lead: "Nora P.",
    department: "QA/QC",
    location: "Inspection Unit",
    activeProjects: ["Skyline Plaza Phase II", "West Ring Road Viaduct"],
  },
];

export function findTeamById(id: number) {
  return TEAMS.find((team) => team.id === id);
}
