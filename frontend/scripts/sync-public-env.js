const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..", "..");
const frontendRoot = path.resolve(__dirname, "..");
const targetEnvPath = path.join(frontendRoot, ".env");
const sourceEnvCandidates = [
  path.join(projectRoot, ".env"),
  path.join(projectRoot, ".env.local"),
];

function parseEnvFile(content) {
  const entries = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  }

  return entries;
}

function escapeEnvValue(value) {
  return String(value).replace(/\n/g, "\\n");
}

function syncPublicEnv() {
  const existingSources = sourceEnvCandidates.filter((candidate) => fs.existsSync(candidate));
  if (existingSources.length === 0) {
    console.warn(`Skipping Expo env sync: none of ${sourceEnvCandidates.join(", ")} were found.`);
    return;
  }

  const parsed = existingSources.reduce((accumulator, sourcePath) => {
    const sourceContent = fs.readFileSync(sourcePath, "utf8");
    return {
      ...accumulator,
      ...parseEnvFile(sourceContent),
    };
  }, {});
  const publicEntries = Object.entries(parsed).filter(([key]) => key.startsWith("EXPO_PUBLIC_"));

  if (publicEntries.length === 0) {
    console.warn("Skipping Expo env sync: no EXPO_PUBLIC_ variables found in root .env.");
    return;
  }

  const nextContent = [
    "# Auto-generated from the root .env / .env.local files for Expo native/web bundling.",
    "# Do not edit by hand; update the root env files instead.",
    "",
    ...publicEntries.map(([key, value]) => `${key}=${escapeEnvValue(value)}`),
    "",
  ].join("\n");

  fs.writeFileSync(targetEnvPath, nextContent, "utf8");
  console.log(`Synced ${publicEntries.length} public env vars from ${existingSources.length} env file(s) to ${targetEnvPath}`);
}

syncPublicEnv();
