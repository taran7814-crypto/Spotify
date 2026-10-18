// Run from the Spotify project root with: node generate-songs-manifest.cjs
// It scans react-client/public/songs and creates react-client/public/songs/songs.json.

const fs = require("node:fs");
const path = require("node:path");

const songsRoot = path.join(
  process.cwd(),
  "react-client",
  "public",
  "songs"
);

const outputFile = path.join(songsRoot, "songs.json");
const audioExtensions = new Set([
  ".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac", ".opus"
]);

if (!fs.existsSync(songsRoot)) {
  console.error("Could not find:", songsRoot);
  console.error("Run this script from your Spotify project root.");
  process.exit(1);
}

const manifest = {};

function scanFolder(folderPath, key) {
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });

  const audioFiles = entries
    .filter(entry => entry.isFile())
    .map(entry => entry.name)
    .filter(name => audioExtensions.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  if (audioFiles.length > 0) {
    manifest[key] = audioFiles;
  }

  // Include nested folders if you organize music inside subfolders.
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const childPath = path.join(folderPath, entry.name);
    const childKey = `${key}/${entry.name}`;
    scanFolder(childPath, childKey);
  }
}

for (const entry of fs.readdirSync(songsRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const folderPath = path.join(songsRoot, entry.name);

  if (entry.name.toLowerCase() === "albums") {
    // Album keys become "albums/4 Da Gang EP", etc.
    for (const album of fs.readdirSync(folderPath, { withFileTypes: true })) {
      if (album.isDirectory()) {
        scanFolder(path.join(folderPath, album.name), `albums/${album.name}`);
      }
    }
  } else {
    // Artist keys use the actual directory spelling, e.g. "anuv jain".
    scanFolder(folderPath, entry.name);
  }
}

fs.writeFileSync(outputFile, JSON.stringify(manifest, null, 2) + "\n", "utf8");

const folderCount = Object.keys(manifest).length;
const songCount = Object.values(manifest).reduce((sum, files) => sum + files.length, 0);

console.log(`Created ${outputFile}`);
console.log(`Folders with audio: ${folderCount}`);
console.log(`Audio files found: ${songCount}`);
console.log("Use manifest keys exactly as the folder paths passed to getSongs().");
