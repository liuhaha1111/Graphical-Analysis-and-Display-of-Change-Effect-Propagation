import { ReactNode, useId } from 'react';
import { cn } from '../../lib/utils';

type PanelCardProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  headerSlot?: ReactNode;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
};

export default function PanelCard({
  title,
  description,
  eyebrow,
  headerSlot,
  className,
  contentClassName,
  children,
}: PanelCardProps) {
  const headingId = useId();

  return (
    <section
      role="region"
      aria-labelledby={headingId}
      className={cn(
        'overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_24px_50px_-30px_rgba(15,23,42,0.45)] backdrop-blur',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 bg-[linear-gradient(135deg,_rgba(15,23,42,1)_0%,_rgba(51,65,85,1)_52%,_rgba(180,83,9,0.94)_100%)] px-5 py-4 text-white">
        <div className="space-y-1.5">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-200/80">
              {eyebrow}
            </p>
          ) : null}
          <h2 id={headingId} className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          {description ? <p className="max-w-2xl text-sm text-slate-200/80">{description}</p> : null}
        </div>
        {headerSlot}
      </div>
      <div className={cn('px-5 py-5', contentClassName)}>{children}</div>
    </section>
  );
}
