import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { SCENES } from "./scenes";
import { SceneView } from "./SceneView";
import { ensureFontLoaded } from "./loadFont";
import manifest from "./public/audio/manifest.json";

const AUDIO_TAIL_FRAMES = 20; // فاصل صغير بعد نهاية الصوت قبل ما المشهد يتغير

export function getSceneDurationsInFrames(fps: number) {
  return SCENES.map((scene) => {
    const entry = manifest.find((m) => m.id === scene.id);
    const seconds = entry?.durationSeconds ?? 8;
    return Math.ceil(seconds * fps) + AUDIO_TAIL_FRAMES;
  });
}

export function getTotalDurationInFrames(fps: number) {
  return getSceneDurationsInFrames(fps).reduce((a, b) => a + b, 0);
}

export function Tour() {
  ensureFontLoaded();
  const { fps } = useVideoConfig();
  const durations = getSceneDurationsInFrames(fps);
  const starts = durations.reduce<number[]>((acc, duration, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + durations[i - 1]);
    return acc;
  }, []);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b1220" }}>
      {SCENES.map((scene, i) => {
        const from = starts[i];
        const audioEntry = manifest.find((m) => m.id === scene.id);

        return (
          <Sequence key={scene.id} from={from} durationInFrames={durations[i]}>
            <SceneView scene={scene} index={i} total={SCENES.length} />
            {audioEntry && <Audio src={staticFile(`audio/${audioEntry.file}`)} />}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
