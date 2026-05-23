import { db, sqlClient } from "@/db";
import {
  agendaItems,
  alerts,
  documents,
  entities,
  governingBodies,
  jurisdictions,
  meetings,
  mentions,
  savedSearches,
  summaries,
} from "@/db/schema";

const jurisdictionRows = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Vancouver",
    slug: "vancouver",
    platform: "Custom + Open Data",
    websiteUrl: "https://council.vancouver.ca",
    population: "662K",
    priority: "P0",
    connectorStatus: "planned",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Surrey",
    slug: "surrey",
    platform: "Custom archive",
    websiteUrl: "https://www.surrey.ca",
    population: "568K",
    priority: "P0",
    connectorStatus: "planned",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Burnaby",
    slug: "burnaby",
    platform: "eScribe",
    websiteUrl: "https://pub-burnaby.escribemeetings.com",
    population: "249K",
    priority: "P0",
    connectorStatus: "eScribe target",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "Richmond",
    slug: "richmond",
    platform: "Granicus + YouTube",
    websiteUrl: "https://www.richmond.ca",
    population: "209K",
    priority: "P1",
    connectorStatus: "phase 2 connector",
  },
];

const governingBodyRows = [
  {
    id: "11111111-aaaa-4111-8111-111111111111",
    jurisdictionId: jurisdictionRows[0].id,
    name: "Vancouver Council",
    slug: "vancouver-council",
    bodyType: "council",
    sourceUrl: "https://council.vancouver.ca",
  },
  {
    id: "22222222-aaaa-4222-8222-222222222222",
    jurisdictionId: jurisdictionRows[1].id,
    name: "Surrey Council",
    slug: "surrey-council",
    bodyType: "council",
    sourceUrl: "https://www.surrey.ca/city-government/council-meetings",
  },
  {
    id: "33333333-aaaa-4333-8333-333333333333",
    jurisdictionId: jurisdictionRows[2].id,
    name: "Burnaby Council",
    slug: "burnaby-council",
    bodyType: "council",
    sourceUrl: "https://pub-burnaby.escribemeetings.com",
  },
  {
    id: "44444444-aaaa-4444-8444-444444444444",
    jurisdictionId: jurisdictionRows[3].id,
    name: "Richmond Council",
    slug: "richmond-council",
    bodyType: "council",
    sourceUrl: "https://www.richmond.ca/city-hall/city-council.htm",
  },
];

const meetingRows = [
  {
    id: "11111111-bbbb-4111-8111-111111111111",
    governingBodyId: governingBodyRows[0].id,
    title: "Regular Council Meeting",
    status: "scheduled" as const,
    startsAt: new Date("2026-05-26T02:30:00.000Z"),
    sourceUrl: "https://council.vancouver.ca",
    agendaUrl: "https://council.vancouver.ca/agenda",
    videoUrl: "https://council.vancouver.ca/video",
    sourceExternalId: "vancouver-2026-05-25",
  },
  {
    id: "22222222-bbbb-4222-8222-222222222222",
    governingBodyId: governingBodyRows[1].id,
    title: "Public Hearing",
    status: "scheduled" as const,
    startsAt: new Date("2026-05-27T02:00:00.000Z"),
    sourceUrl: "https://www.surrey.ca",
    agendaUrl: "https://www.surrey.ca/public-hearing-agenda",
    videoUrl: "https://www.surrey.ca/council-video",
    sourceExternalId: "surrey-2026-05-26",
  },
  {
    id: "33333333-bbbb-4333-8333-333333333333",
    governingBodyId: governingBodyRows[2].id,
    title: "Planning and Development Committee",
    status: "held" as const,
    startsAt: new Date("2026-05-19T01:00:00.000Z"),
    sourceUrl: "https://pub-burnaby.escribemeetings.com",
    agendaUrl: "https://pub-burnaby.escribemeetings.com/agenda",
    videoUrl: "https://pub-burnaby.escribemeetings.com/video",
    sourceExternalId: "burnaby-2026-05-18",
  },
  {
    id: "44444444-bbbb-4444-8444-444444444444",
    governingBodyId: governingBodyRows[3].id,
    title: "General Purposes Committee",
    status: "held" as const,
    startsAt: new Date("2026-05-20T23:00:00.000Z"),
    sourceUrl: "https://www.richmond.ca",
    agendaUrl: "https://www.richmond.ca/agendas",
    videoUrl: "https://youtube.com/@cityofrichmondbc",
    sourceExternalId: "richmond-2026-05-20",
  },
];

const documentRows = [
  {
    id: "11111111-cccc-4111-8111-111111111111",
    meetingId: meetingRows[0].id,
    type: "agenda" as const,
    title: "Broadway Plan implementation update",
    sourceUrl: meetingRows[0].agendaUrl!,
    extractedText:
      "Council reviewed rental replacement requirements, CD-1 amendments, and public realm delivery timelines.",
  },
  {
    id: "22222222-cccc-4222-8222-222222222222",
    meetingId: meetingRows[1].id,
    type: "agenda" as const,
    title: "King George corridor rezoning package",
    sourceUrl: meetingRows[1].agendaUrl!,
    extractedText:
      "Staff recommended first and second reading for a mixed-use residential proposal near rapid transit.",
  },
  {
    id: "33333333-cccc-4333-8333-333333333333",
    meetingId: meetingRows[2].id,
    type: "minutes" as const,
    title: "Metrotown development permit delegation",
    sourceUrl: meetingRows[2].agendaUrl!,
    extractedText:
      "Committee discussion covered tower separation, daycare contribution, and transportation demand measures.",
  },
  {
    id: "44444444-cccc-4444-8444-444444444444",
    meetingId: meetingRows[3].id,
    type: "minutes" as const,
    title: "City Centre OCP amendment review",
    sourceUrl: meetingRows[3].agendaUrl!,
    extractedText:
      "Committee reviewed City Centre OCP amendments and active transportation connections.",
  },
];

const agendaItemRows = documentRows.map((document, index) => ({
  id: [
    "11111111-dddd-4111-8111-111111111111",
    "22222222-dddd-4222-8222-222222222222",
    "33333333-dddd-4333-8333-333333333333",
    "44444444-dddd-4444-8444-444444444444",
  ][index],
  meetingId: document.meetingId,
  documentId: document.id,
  itemNumber: `${index + 1}`,
  title: document.title,
  body: document.extractedText,
  sourceUrl: document.sourceUrl,
}));

const entityRows = [
  {
    id: "11111111-eeee-4111-8111-111111111111",
    type: "policy" as const,
    name: "Broadway Plan",
    normalizedName: "broadway plan",
    metadata: { jurisdiction: "Vancouver" },
  },
  {
    id: "22222222-eeee-4222-8222-222222222222",
    type: "project" as const,
    name: "King George corridor rezoning",
    normalizedName: "king george corridor rezoning",
    metadata: { jurisdiction: "Surrey" },
  },
  {
    id: "33333333-eeee-4333-8333-333333333333",
    type: "topic" as const,
    name: "Rental replacement",
    normalizedName: "rental replacement",
    metadata: { issue: "housing" },
  },
  {
    id: "44444444-eeee-4444-8444-444444444444",
    type: "policy" as const,
    name: "City Centre OCP",
    normalizedName: "city centre ocp",
    metadata: { jurisdiction: "Richmond" },
  },
];

const savedSearchRows = [
  {
    id: "11111111-ffff-4111-8111-111111111111",
    name: "Broadway Plan + CD-1",
    audience: "Planning consultant",
    query: "Broadway Plan CD-1 rental replacement",
    cadence: "agenda + post-meeting",
    filters: { jurisdictions: ["vancouver"] },
  },
  {
    id: "22222222-ffff-4222-8222-222222222222",
    name: "King George rezoning",
    audience: "Developer",
    query: "King George rezoning mixed-use rapid transit",
    cadence: "immediate",
    filters: { jurisdictions: ["surrey"] },
  },
];

const alertRows = [
  {
    id: "11111111-9999-4111-8111-111111111111",
    savedSearchId: savedSearchRows[0].id,
    status: "preview" as const,
    title: "Broadway Plan implementation update",
    summary:
      "Vancouver council agenda includes rental replacement and CD-1 implementation language.",
    evidence: [{ documentId: documentRows[0].id, agendaItemId: agendaItemRows[0].id }],
  },
  {
    id: "22222222-9999-4222-8222-222222222222",
    savedSearchId: savedSearchRows[1].id,
    status: "preview" as const,
    title: "King George corridor rezoning package",
    summary:
      "Surrey public hearing agenda includes mixed-use residential rezoning near rapid transit.",
    evidence: [{ documentId: documentRows[1].id, agendaItemId: agendaItemRows[1].id }],
  },
];

const mentionRows = [
  {
    id: "11111111-7777-4111-8111-111111111111",
    entityId: entityRows[0].id,
    documentId: documentRows[0].id,
    agendaItemId: agendaItemRows[0].id,
    confidence: "high",
    matchedText: "Broadway Plan",
  },
  {
    id: "22222222-7777-4222-8222-222222222222",
    entityId: entityRows[1].id,
    documentId: documentRows[1].id,
    agendaItemId: agendaItemRows[1].id,
    confidence: "high",
    matchedText: "King George corridor rezoning",
  },
  {
    id: "33333333-7777-4333-8333-333333333333",
    entityId: entityRows[2].id,
    documentId: documentRows[0].id,
    agendaItemId: agendaItemRows[0].id,
    confidence: "medium",
    matchedText: "rental replacement",
  },
  {
    id: "44444444-7777-4444-8444-444444444444",
    entityId: entityRows[3].id,
    documentId: documentRows[3].id,
    agendaItemId: agendaItemRows[3].id,
    confidence: "medium",
    matchedText: "City Centre OCP",
  },
];

const summaryRows = agendaItemRows.map((item, index) => ({
  id: [
    "11111111-6666-4111-8111-111111111111",
    "22222222-6666-4222-8222-222222222222",
    "33333333-6666-4333-8333-333333333333",
    "44444444-6666-4444-8444-444444444444",
  ][index],
  meetingId: item.meetingId,
  agendaItemId: item.id,
  title: item.title,
  body: item.body ?? "",
  sourceRefs: [{ agendaItemId: item.id, documentId: item.documentId }],
}));

async function seed() {
  await db.insert(jurisdictions).values(jurisdictionRows).onConflictDoNothing();
  await db
    .insert(governingBodies)
    .values(governingBodyRows)
    .onConflictDoNothing();
  await db.insert(meetings).values(meetingRows).onConflictDoNothing();
  await db.insert(documents).values(documentRows).onConflictDoNothing();
  await db.insert(agendaItems).values(agendaItemRows).onConflictDoNothing();
  await db.insert(entities).values(entityRows).onConflictDoNothing();
  await db.insert(savedSearches).values(savedSearchRows).onConflictDoNothing();
  await db.insert(alerts).values(alertRows).onConflictDoNothing();
  await db.insert(mentions).values(mentionRows).onConflictDoNothing();
  await db.insert(summaries).values(summaryRows).onConflictDoNothing();
}

seed()
  .then(async () => {
    await sqlClient.end();
    console.log("Seeded Carried sample data.");
  })
  .catch(async (error) => {
    await sqlClient.end();
    console.error(error);
    process.exit(1);
  });
