import {
  alerts,
  coverageStats,
  dashboardCards,
  meetings,
  municipalities,
  personas,
  projects,
  sampleResults,
} from "@/lib/mock-data";

export async function getCoverageStats() {
  return coverageStats;
}

export async function getPersonas() {
  return personas;
}

export async function getSearchResults() {
  return sampleResults;
}

export async function getDashboardCards() {
  return dashboardCards;
}

export async function getAlerts() {
  return alerts;
}

export async function getProjects() {
  return projects;
}

export async function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export async function getMeetings() {
  return meetings;
}

export async function getMeeting(slug: string) {
  return meetings.find((meeting) => meeting.slug === slug);
}

export async function getMunicipalities() {
  return municipalities;
}
