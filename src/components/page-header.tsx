import type { LucideIcon } from "lucide-react";

const COLOR_CLASSES = {
  blue: { bg: "bg-badge-1-bg", icon: "text-badge-1" },
  amber: { bg: "bg-badge-2-bg", icon: "text-badge-2" },
  green: { bg: "bg-badge-3-bg", icon: "text-badge-3" },
  violet: { bg: "bg-badge-4-bg", icon: "text-badge-4" },
  pink: { bg: "bg-badge-5-bg", icon: "text-badge-5" },
  cyan: { bg: "bg-badge-6-bg", icon: "text-badge-6" },
} as const;

export type PageHeaderColor = keyof typeof COLOR_CLASSES;

export function PageHeader({
  icon: Icon,
  title,
  description,
  color = "blue",
  actions,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  color?: PageHeaderColor;
  actions?: React.ReactNode;
}) {
  const classes = COLOR_CLASSES[color];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${classes.bg}`}
        >
          <Icon className={`size-5 ${classes.icon}`} />
        </span>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
