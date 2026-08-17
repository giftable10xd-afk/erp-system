import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Scene } from "./scenes";
import { SceneIcon } from "./icons";
import { BADGE_COLORS, COLORS } from "./colors";

const FRAME_WIDTH = 1600;
const FRAME_HEIGHT = 900;

export function SceneView({
  scene,
  index,
  total,
}: {
  scene: Scene;
  index: number;
  total: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palette = BADGE_COLORS[scene.color];

  const frameScale = spring({ frame, fps, config: { damping: 16, mass: 0.7 } });
  const captionOpacity = interpolate(frame, [10, 26], [0, 1], { extrapolateRight: "clamp" });
  const captionY = interpolate(frame, [10, 26], [24, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      dir="rtl"
      style={{
        background: "linear-gradient(160deg, #111827 0%, #0f172a 60%, #0b1220 100%)",
        fontFamily: "'Decotype Naskh Special', sans-serif",
      }}
    >
      {/* شريط تقدم علوي */}
      <div style={{ position: "absolute", top: 32, insetInline: 64, display: "flex", gap: 8, zIndex: 3 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 5,
              borderRadius: 999,
              background: i <= index ? COLORS.primary : "rgba(255,255,255,0.22)",
            }}
          />
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          top: 50,
          insetInlineEnd: 64,
          fontSize: 20,
          color: "rgba(255,255,255,0.65)",
          zIndex: 3,
        }}
      >
        {index + 1} / {total}
      </div>

      {/* تسجيل الشاشة الحقيقي */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            transform: `scale(${frameScale})`,
            width: FRAME_WIDTH,
            height: FRAME_HEIGHT,
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 40px 90px rgba(0,0,0,0.5)",
            border: `2px solid ${palette.fg}55`,
          }}
        >
          <OffthreadVideo
            src={staticFile(`screens/${scene.id}.webm`)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            muted
          />
        </div>
      </AbsoluteFill>

      {/* شريط عنوان سفلي */}
      <div
        style={{
          position: "absolute",
          insetInline: 0,
          bottom: 0,
          height: 150,
          background: "linear-gradient(0deg, rgba(11,18,32,0.94) 0%, rgba(11,18,32,0) 100%)",
          display: "flex",
          alignItems: "center",
          paddingInline: 90,
          gap: 24,
          opacity: captionOpacity,
          transform: `translateY(${captionY}px)`,
          zIndex: 3,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 64,
            height: 64,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            background: palette.bg,
            color: palette.fg,
            flexShrink: 0,
          }}
        >
          <SceneIcon name={scene.icon} size={32} />
        </div>
        <div style={{ fontSize: 40, fontWeight: 700, color: "#ffffff" }}>{scene.titleAr}</div>
      </div>
    </AbsoluteFill>
  );
}
