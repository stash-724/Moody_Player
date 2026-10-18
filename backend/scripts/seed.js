// Loads the royalty-free tracks in seed/tracks.json into MongoDB, re-hosting each
// MP3 on ImageKit (ImageKit fetches the source URL itself). Idempotent: tracks whose
// sourceUrl is already in the database are skipped.
//
// Usage: npm run seed   (add -- --dry-run to only report what would be added)
require('dotenv').config();
require('../src/config/dns')();
const mongoose = require('mongoose');
const connectDB = require('../src/db/db');
const songModel = require('../src/models/song.model');
const { uploadFromUrl } = require('../src/services/storage.service');
const { tracks } = require('../seed/tracks.json');

const dryRun = process.argv.includes('--dry-run');

async function main() {
  // Validate every entry against the schema before touching anything.
  for (const t of tracks) {
    await songModel.validate({ ...t, audio: t.sourceUrl });
  }
  console.log(`${tracks.length} tracks pass schema validation`);

  await connectDB();
  let added = 0;
  let skipped = 0;
  let failed = 0;
  for (const t of tracks) {
    if (await songModel.exists({ sourceUrl: t.sourceUrl })) {
      skipped += 1;
      continue;
    }
    if (dryRun) {
      console.log(`would add: ${t.title}`);
      added += 1;
      continue;
    }
    try {
      const file = await uploadFromUrl(t.sourceUrl, `${t.title.replace(/[^\w-]+/g, '_')}.mp3`);
      await songModel.create({
        title: t.title,
        artist: t.artist,
        audio: file.url,
        mood: t.mood,
        valence: t.valence,
        energy: t.energy,
        license: t.license,
        licenseUrl: t.licenseUrl,
        sourceUrl: t.sourceUrl,
      });
      added += 1;
      console.log(`added: ${t.title}`);
    } catch (err) {
      failed += 1;
      console.error(`failed: ${t.title}: ${err.message}`);
    }
  }
  console.log(`${dryRun ? '[dry run] ' : ''}added ${added}, skipped ${skipped} existing, failed ${failed}`);
  return failed;
}

main()
  .then(async (failed) => {
    await mongoose.disconnect();
    process.exit(failed ? 1 : 0);
  })
  .catch(async (err) => {
    console.error(err);
    await mongoose.disconnect();
    process.exit(1);
  });
