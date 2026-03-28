import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

type MetricCardProps = {
  label: string;
  value: string | number;
  caption?: string;
  icon?: ReactNode;
  className?: string;
};

export default function MetricCard({
  label,
  value,
  caption,
  icon,
  className,
}: MetricCardProps) {
  return (
    <article
      className={cn(
        'rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.8)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        {icon}
      </div>
      {caption ? <p className="mt-3 text-sm text-slate-500">{caption}</p> : null}
    </article>
  );
}
