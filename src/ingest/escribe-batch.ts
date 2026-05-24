import { sqlClient } from "@/db";
import { ESCRIBE_TENANTS } from "@/ingest/escribe";
import { persistEscribeMeetings } from "@/ingest/escribe-persist";

type BatchResult = {
  tenant: string;
  status: "ok" | "error";
  meetingsSeen: number;
  meetingsInserted: number;
  documentsInserted: number;
  agendaItemsInserted: number;
  error?: string;
};

export async function persistEscribeTenantBatch(
  tenantKeys: string[],
  range: { from: string; to: string },
  options: { limit?: number } = {},
) {
  const results: BatchResult[] = [];

  for (const tenantKey of tenantKeys) {
    try {
      const result = await persistEscribeMeetings(tenantKey, range, options);
      results.push({
        tenant: tenantKey,
        status: "ok",
        ...result,
      });
    } catch (error) {
      results.push({
        tenant: tenantKey,
        status: "error",
        meetingsSeen: 0,
        meetingsInserted: 0,
        documentsInserted: 0,
        agendaItemsInserted: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    range,
    limit: options.limit ?? null,
    totals: results.reduce(
      (totals, result) => ({
        meetingsSeen: totals.meetingsSeen + result.meetingsSeen,
        meetingsInserted: totals.meetingsInserted + result.meetingsInserted,
        documentsInserted: totals.documentsInserted + result.documentsInserted,
        agendaItemsInserted:
          totals.agendaItemsInserted + result.agendaItemsInserted,
        errors: totals.errors + (result.status === "error" ? 1 : 0),
      }),
      {
        meetingsSeen: 0,
        meetingsInserted: 0,
        documentsInserted: 0,
        agendaItemsInserted: 0,
        errors: 0,
      },
    ),
    results,
  };
}

function readArg(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readTenantKeys() {
  const tenants = readArg("--tenants");
  if (!tenants) {
    return Object.keys(ESCRIBE_TENANTS);
  }

  return tenants
    .split(",")
    .map((tenant) => tenant.trim())
    .filter(Boolean);
}

async function main() {
  const result = await persistEscribeTenantBatch(
    readTenantKeys(),
    {
      from: readArg("--from") ?? "2026-02-01T00:00:00-08:00",
      to: readArg("--to") ?? "2026-02-28T23:59:59-08:00",
    },
    {
      limit: Number(readArg("--limit") ?? 5),
    },
  );

  console.log(JSON.stringify(result, null, 2));

  if (result.totals.errors > 0) {
    process.exitCode = 1;
  }
}

if (process.argv[1]?.endsWith("escribe-batch.ts")) {
  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await sqlClient.end();
    });
}
