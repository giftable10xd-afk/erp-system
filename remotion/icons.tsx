// أيقونات SVG بسيطة (نفس أرواح lucide-react) — مستقلة عن مكتبة lucide-react
// عشان نضمن توافق كامل مع سياق ترندر Remotion
import type { Scene } from "./scenes";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function SceneIcon({ name, size = 48 }: { name: Scene["icon"]; size?: number }) {
  const props = { width: size, height: size, viewBox: "0 0 24 24", ...stroke };

  switch (name) {
    case "Building2":
      return (
        <svg {...props}>
          <path d="M6 22V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v18" />
          <path d="M6 12H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2" />
          <path d="M18 9h2a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-2" />
          <path d="M10 6h1M10 10h1M10 14h1M14 6h1M14 10h1M14 14h1M10 18h1M14 18h1" />
        </svg>
      );
    case "Package":
      return (
        <svg {...props}>
          <path d="m7.5 4.27 9 5.15" />
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
        </svg>
      );
    case "Wrench":
      return (
        <svg {...props}>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />
        </svg>
      );
    case "Bell":
      return (
        <svg {...props}>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      );
    case "Users":
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "Handshake":
      return (
        <svg {...props}>
          <path d="m11 17 2 2a1 1 0 1 0 3-3" />
          <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
          <path d="m21 3 1 11h-2M3 3l6.5 8.5M3 4l8 10" />
        </svg>
      );
    case "Receipt":
      return (
        <svg {...props}>
          <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
          <path d="M8 7h8M8 11h8M8 15h5" />
        </svg>
      );
    case "LifeBuoy":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
          <path d="m4.93 4.93 4.24 4.24m5.66 5.66 4.24 4.24m0-14.14-4.24 4.24m-5.66 5.66-4.24 4.24" />
        </svg>
      );
    case "LayoutDashboard":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      );
    case "Search":
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      );
    case "ShieldCheck":
      return (
        <svg {...props}>
          <path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V6l8-3 8 3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
  }
}
