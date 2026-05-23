import {
  Bell,
  Building2,
  CalendarDays,
  FileSearch,
  Landmark,
  MapPinned,
  Newspaper,
  Search,
} from "lucide-react";

export const coverageStats = [
  { label: "V1 municipalities", value: "17" },
  { label: "Priority bodies", value: "35+" },
  { label: "Population coverage", value: "93%" },
  { label: "Target launch", value: "6-8w" },
];

export const personas = [
  {
    title: "Developers",
    description:
      "Track rezonings, agenda movement, votes, and public mentions across Metro Vancouver.",
    icon: Building2,
  },
  {
    title: "Advocates",
    description:
      "Follow topics like housing, transit, climate, SROs, bike lanes, or neighbourhood plans.",
    icon: Bell,
  },
  {
    title: "Journalists",
    description:
      "Search meetings quickly and get concise source-linked summaries after long sessions.",
    icon: Newspaper,
  },
];

export const municipalities = [
  {
    name: "Vancouver",
    platform: "Custom + Open Data",
    status: "Connector planned",
    population: "662K",
    priority: "P0",
  },
  {
    name: "Surrey",
    platform: "Custom archive",
    status: "Connector planned",
    population: "568K",
    priority: "P0",
  },
  {
    name: "Burnaby",
    platform: "eScribe",
    status: "eScribe target",
    population: "249K",
    priority: "P0",
  },
  {
    name: "Richmond",
    platform: "Granicus + YouTube",
    status: "Phase 2 connector",
    population: "209K",
    priority: "P1",
  },
  {
    name: "New Westminster",
    platform: "eScribe",
    status: "eScribe target",
    population: "89K",
    priority: "P1",
  },
  {
    name: "Port Moody",
    platform: "eScribe",
    status: "eScribe target",
    population: "35K",
    priority: "P1",
  },
];

export const sampleResults = [
  {
    title: "Broadway Plan implementation update",
    body: "Council reviewed rental replacement requirements and public realm delivery timelines.",
    city: "Vancouver",
    date: "May 21, 2026",
    type: "Council agenda",
    matches: ["Broadway Plan", "rental replacement", "CD-1"],
  },
  {
    title: "King George corridor rezoning package",
    body: "Staff recommended first and second reading for a mixed-use residential proposal near rapid transit.",
    city: "Surrey",
    date: "May 20, 2026",
    type: "Public hearing",
    matches: ["rezoning", "mixed-use", "rapid transit"],
  },
  {
    title: "Metrotown development permit delegation",
    body: "Committee discussion covered tower separation, daycare contribution, and transportation demand measures.",
    city: "Burnaby",
    date: "May 18, 2026",
    type: "Committee minutes",
    matches: ["Metrotown", "daycare", "transportation"],
  },
];

export const meetings = [
  {
    slug: "vancouver-regular-council-2026-05-25",
    title: "Regular Council Meeting",
    jurisdiction: "Vancouver",
    body: "Vancouver Council",
    date: "May 25, 2026",
    status: "Scheduled",
    source: "Custom + Open Data",
    summary:
      "Upcoming agenda includes Broadway Plan implementation, CD-1 amendment language, and rental replacement requirements.",
    agendaItems: [
      "Broadway Plan implementation update",
      "Rental replacement policy language",
      "CD-1 amendment package",
    ],
  },
  {
    slug: "surrey-public-hearing-2026-05-26",
    title: "Public Hearing",
    jurisdiction: "Surrey",
    body: "Surrey Council",
    date: "May 26, 2026",
    status: "Scheduled",
    source: "Custom archive",
    summary:
      "Public hearing package includes a mixed-use King George corridor rezoning near rapid transit.",
    agendaItems: [
      "King George corridor rezoning package",
      "Mixed-use residential proposal",
      "Rapid transit adjacency considerations",
    ],
  },
  {
    slug: "burnaby-planning-committee-2026-05-18",
    title: "Planning and Development Committee",
    jurisdiction: "Burnaby",
    body: "Burnaby Council",
    date: "May 18, 2026",
    status: "Held",
    source: "eScribe",
    summary:
      "Committee minutes cover Metrotown development permit delegation, daycare contribution, and transportation demand measures.",
    agendaItems: [
      "Metrotown development permit delegation",
      "Daycare contribution",
      "Transportation demand measures",
    ],
  },
  {
    slug: "richmond-general-purposes-2026-05-20",
    title: "General Purposes Committee",
    jurisdiction: "Richmond",
    body: "Richmond Council",
    date: "May 20, 2026",
    status: "Held",
    source: "Granicus + YouTube",
    summary:
      "Committee reviewed City Centre OCP amendments and active transportation connections.",
    agendaItems: [
      "City Centre OCP amendment review",
      "Active transportation connections",
      "Development application status report",
    ],
  },
];

export const alerts = [
  {
    name: "Broadway Plan + CD-1",
    audience: "Planning consultant",
    cadence: "Agenda + post-meeting",
    lastMatch: "Vancouver council agenda",
    status: "Ready for preview",
  },
  {
    name: "SRO policy / DTES",
    audience: "Journalist",
    cadence: "Daily digest",
    lastMatch: "Standing committee minutes",
    status: "Ready for preview",
  },
  {
    name: "King George rezoning",
    audience: "Developer",
    cadence: "Immediate",
    lastMatch: "Surrey public hearing notice",
    status: "Needs source link",
  },
];

export const projects = [
  {
    slug: "broadway-mixed-use-rezoning",
    name: "Broadway mixed-use rezoning",
    jurisdiction: "Vancouver",
    stage: "Agenda monitoring",
    nextAction: "Watch next council package",
    signal: "High",
    address: "Broadway corridor",
    summary:
      "Monitoring CD-1 and rental replacement language as Broadway Plan implementation moves through council packages.",
    timeline: [
      "Agenda item detected for Broadway Plan implementation update.",
      "Rental replacement requirements mentioned in staff report.",
      "Next council package should be checked for vote language.",
    ],
  },
  {
    slug: "king-george-transit-village",
    name: "King George transit village",
    jurisdiction: "Surrey",
    stage: "Public hearing",
    nextAction: "Summarize council debate",
    signal: "High",
    address: "King George corridor",
    summary:
      "Tracking mixed-use residential rezoning near rapid transit through public hearing and council readings.",
    timeline: [
      "Public hearing agenda detected.",
      "Staff recommendation includes first and second reading.",
      "Council debate summary pending transcript capture.",
    ],
  },
  {
    slug: "metrotown-rental-replacement",
    name: "Metrotown rental replacement",
    jurisdiction: "Burnaby",
    stage: "Committee review",
    nextAction: "Track vote and conditions",
    signal: "Medium",
    address: "Metrotown",
    summary:
      "Watching committee conditions around tower separation, daycare contribution, and transportation demand measures.",
    timeline: [
      "Committee minutes mention daycare contribution.",
      "Transportation demand measures flagged.",
      "Vote and final conditions not yet captured.",
    ],
  },
];

export const dashboardCards = [
  {
    title: "Search civic records",
    description: "Find agenda items, minutes, transcript moments, and votes.",
    icon: Search,
    href: "/dashboard/search",
  },
  {
    title: "Watch alerts",
    description: "Preview saved searches before email delivery is wired.",
    icon: Bell,
    href: "/dashboard/alerts",
  },
  {
    title: "Track projects",
    description: "Follow rezonings and named initiatives across meetings.",
    icon: FileSearch,
    href: "/dashboard/projects",
  },
  {
    title: "Review coverage",
    description: "See v1 municipality priorities and connector status.",
    icon: MapPinned,
    href: "/dashboard/jurisdictions",
  },
  {
    title: "Open meetings",
    description: "Inspect agenda items, summaries, and source evidence.",
    icon: CalendarDays,
    href: "/dashboard/meetings",
  },
];

export const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: Landmark },
  { label: "Search", href: "/dashboard/search", icon: Search },
  { label: "Alerts", href: "/dashboard/alerts", icon: Bell },
  { label: "Projects", href: "/dashboard/projects", icon: FileSearch },
  { label: "Meetings", href: "/dashboard/meetings", icon: CalendarDays },
  { label: "Jurisdictions", href: "/dashboard/jurisdictions", icon: MapPinned },
];
