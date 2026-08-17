import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { SCENES } from "./scenes";

const execFileAsync = promisify(execFile);
const AUDIO_DIR = path.join(__dirname, "public", "audio");
const VOICE = "ar-SA-HamedNeural"; // صوت عربي فصيح (سعودي) لشرح رسمي

async function getDurationSeconds(filePath: string): Promise<number> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);
  return parseFloat(stdout.trim());
}

async function main() {
  await mkdir(AUDIO_DIR, { recursive: true });

  const manifest: { id: string; file: string; durationSeconds: number }[] = [];

  for (const scene of SCENES) {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioFilePath } = await tts.toFile(AUDIO_DIR, scene.narrationAr);

    const finalPath = path.join(AUDIO_DIR, `${scene.id}.mp3`);
    const { rename } = await import("node:fs/promises");
    await rename(audioFilePath, finalPath);

    const durationSeconds = await getDurationSeconds(finalPath);
    manifest.push({ id: scene.id, file: `${scene.id}.mp3`, durationSeconds });
    console.log(`✓ ${scene.id}: ${durationSeconds.toFixed(2)}s`);
  }

  await writeFile(
    path.join(AUDIO_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf-8"
  );
  console.log("\nتم توليد كل ملفات الصوت وحفظ manifest.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
