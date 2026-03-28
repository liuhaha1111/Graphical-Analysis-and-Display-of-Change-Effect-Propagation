type GraphLegendProps = {
  mode: 'explore' | 'propagation';
};

function Dot({ className }: { className: string }) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${className}`} aria-hidden="true" />;
}

export default function GraphLegend({ mode }: GraphLegendProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Legend</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
        <span className="inline-flex items-center gap-2">
          <Dot className="bg-amber-500" />
          Component
        </span>
        <span className="inline-flex items-center gap-2">
          <Dot className="bg-sky-500" />
          Supply Partner
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-0.5 w-5 rounded bg-slate-400" aria-hidden="true" />
          Relationship Edge
        </span>
        {mode === 'propagation' ? (
          <span className="inline-flex items-center gap-2">
            <Dot className="bg-rose-500" />
            Impacted
          </span>
        ) : null}
      </div>
    </div>
  );
}
