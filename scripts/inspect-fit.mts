/**
 * Development tool. Decodes FIT files copied off the watch and reports which
 * message types and fields are actually present in them.
 *
 * Monitoring files are far less standardised than activity files — what a
 * Forerunner 170 writes into /GARMIN/MONITOR is a firmware detail, not a
 * published contract. This script exists so the wellness columns in
 * sql/002_fit_import.sql are designed from a real file rather than from the
 * FIT profile, which lists every field any Garmin device has ever emitted.
 *
 * Usage:
 *   node scripts/inspect-fit.mts <file-or-directory> [...more]
 *   node scripts/inspect-fit.mts /path/to/GARMIN/MONITOR --keys-only
 *
 * Reads only. Writes nothing, uploads nothing, touches no database.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, basename } from "node:path";
import { Decoder, Stream } from "@garmin/fitsdk";

type DecodedMessage = Record<string, unknown>;
type DecodedMessages = Record<string, DecodedMessage[]>;

type FieldSummary = {
  name: string;
  sample: string;
  populatedCount: number;
};

type MessageSummary = {
  key: string;
  messageCount: number;
  fields: FieldSummary[];
};

/** Scanning every record of a three-hour ride adds nothing over the first few hundred. */
const MAX_MESSAGES_SCANNED_PER_TYPE = 500;

const FIELD_NAME_COLUMN_WIDTH = 30;
const SAMPLE_COLUMN_WIDTH = 28;
const MAX_SAMPLE_LENGTH = 26;

function isFitFile(filePath: string): boolean {
  return extname(filePath).toLowerCase() === ".fit";
}

function collectFitFiles(target: string): string[] {
  const stats = statSync(target);

  if (stats.isFile()) {
    return isFitFile(target) ? [target] : [];
  }

  if (!stats.isDirectory()) {
    return [];
  }

  const collected: string[] = [];
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    const entryPath = join(target, entry.name);
    if (entry.isDirectory()) {
      collected.push(...collectFitFiles(entryPath));
    } else if (entry.isFile() && isFitFile(entryPath)) {
      collected.push(entryPath);
    }
  }

  return collected.sort();
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}…`;
}

function describeValue(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return `[${value.length} item${value.length === 1 ? "" : "s"}]`;
  }

  if (typeof value === "number") {
    const rounded = Number.isInteger(value) ? value : Number(value.toFixed(3));
    return String(rounded);
  }

  if (typeof value === "string" || typeof value === "boolean") {
    return truncate(String(value), MAX_SAMPLE_LENGTH);
  }

  if (value === null || value === undefined) {
    return "";
  }

  return truncate(JSON.stringify(value), MAX_SAMPLE_LENGTH);
}

function isPopulated(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return true;
}

function summarizeOneMessageType(
  key: string,
  messages: DecodedMessage[]
): MessageSummary {
  const scanned = messages.slice(0, MAX_MESSAGES_SCANNED_PER_TYPE);
  const populatedCounts = new Map<string, number>();
  const samples = new Map<string, string>();

  for (const message of scanned) {
    for (const [fieldName, fieldValue] of Object.entries(message)) {
      if (!isPopulated(fieldValue)) {
        continue;
      }

      const previousCount = populatedCounts.get(fieldName) ?? 0;
      populatedCounts.set(fieldName, previousCount + 1);

      if (!samples.has(fieldName)) {
        samples.set(fieldName, describeValue(fieldValue));
      }
    }
  }

  const fields: FieldSummary[] = [...populatedCounts.entries()]
    .map(([name, populatedCount]) => ({
      name,
      populatedCount,
      sample: samples.get(name) ?? "",
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return { key, messageCount: messages.length, fields };
}

function summarizeMessages(messages: DecodedMessages): MessageSummary[] {
  return Object.entries(messages)
    .filter(([, messageList]) => messageList.length > 0)
    .map(([key, messageList]) => summarizeOneMessageType(key, messageList))
    .sort((left, right) => left.key.localeCompare(right.key));
}

function formatFileSize(byteCount: number): string {
  return `${(byteCount / 1024).toFixed(1)} KB`;
}

function printFileIdentity(messages: DecodedMessages): void {
  const fileIdMessages = messages.fileIdMesgs ?? [];
  if (fileIdMessages.length === 0) {
    console.log("  file_id:  (none — unexpected, every FIT file should carry one)");
    return;
  }

  const fileId = fileIdMessages[0];
  const parts = [
    `type=${describeValue(fileId.type)}`,
    `manufacturer=${describeValue(fileId.manufacturer)}`,
    `product=${describeValue(fileId.garminProduct ?? fileId.product)}`,
    `serial=${describeValue(fileId.serialNumber)}`,
    `created=${describeValue(fileId.timeCreated)}`,
  ];
  console.log(`  file_id:  ${parts.join("  ")}`);
}

function printMessageSummary(summary: MessageSummary, keysOnly: boolean): void {
  console.log(`\n  ${summary.key} (${summary.messageCount})`);

  if (keysOnly) {
    return;
  }

  const scannedCount = Math.min(
    summary.messageCount,
    MAX_MESSAGES_SCANNED_PER_TYPE
  );

  for (const field of summary.fields) {
    const name = field.name.padEnd(FIELD_NAME_COLUMN_WIDTH);
    const sample = field.sample.padEnd(SAMPLE_COLUMN_WIDTH);
    console.log(`    ${name}${sample}${field.populatedCount}/${scannedCount}`);
  }
}

function inspectFile(filePath: string, keysOnly: boolean): void {
  console.log(`\n${"=".repeat(78)}`);
  console.log(basename(filePath));
  console.log("=".repeat(78));

  const bytes = readFileSync(filePath);
  const stream = Stream.fromBuffer(bytes);
  const decoder = new Decoder(stream);

  const looksLikeFit = Decoder.isFIT(stream);
  const integrityOk = looksLikeFit && decoder.checkIntegrity();

  console.log(
    `  size: ${formatFileSize(bytes.byteLength)}   isFIT: ${looksLikeFit}   integrity: ${integrityOk ? "ok" : "FAILED"}`
  );

  if (!looksLikeFit) {
    console.log("  skipped — not a FIT file");
    return;
  }

  const result = decoder.read({
    applyScaleAndOffset: true,
    convertDateTimesToDates: true,
    convertTypesToStrings: true,
    expandSubFields: true,
  }) as unknown as { messages: DecodedMessages; errors: unknown[] };

  printFileIdentity(result.messages);

  for (const summary of summarizeMessages(result.messages)) {
    printMessageSummary(summary, keysOnly);
  }

  if (result.errors.length > 0) {
    console.log(`\n  decode errors (${result.errors.length}):`);
    for (const error of result.errors.slice(0, 5)) {
      console.log(`    ${String(error)}`);
    }
  }
}

function printUsage(): void {
  console.log("Usage: node scripts/inspect-fit.mts <file-or-directory> [...] [--keys-only]");
  console.log("");
  console.log("Copy files off the watch first — /GARMIN/ACTIVITY, /GARMIN/MONITOR,");
  console.log("/GARMIN/SLEEP — then point this at the folder.");
}

function main(): void {
  const args = process.argv.slice(2);
  const keysOnly = args.includes("--keys-only");
  const targets = args.filter((argument) => !argument.startsWith("--"));

  if (targets.length === 0) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const filePaths = targets.flatMap(collectFitFiles);

  if (filePaths.length === 0) {
    console.log("No .fit files found in the given paths.");
    process.exitCode = 1;
    return;
  }

  console.log(`Inspecting ${filePaths.length} FIT file(s).`);

  for (const filePath of filePaths) {
    inspectFile(filePath, keysOnly);
  }
}

main();
