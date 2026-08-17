export function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="ltr-technical font-bold">{value}</span>
    </div>
  );
}
