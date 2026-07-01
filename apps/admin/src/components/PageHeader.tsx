import { SectionLabel } from '@dpt/ui';
import { ARCHIVO } from '~/lib/theme';

export function PageHeader({
  label, title, action, meta,
}: {
  label: string;
  title: string;
  action?: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <div
      className="w-full border-b border-white/6"
      style={{ background: 'linear-gradient(180deg, rgba(232,181,58,0.05) 0%, transparent 100%)' }}
    >
      <div className="container py-6 sm:py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <SectionLabel className="mb-1.5">{label}</SectionLabel>
            <h1
              className="text-4xl sm:text-5xl font-black italic uppercase leading-none text-[#f0f0f0]"
              style={{ fontFamily: ARCHIVO }}
            >
              {title}
            </h1>
            {meta && <div className="mt-2">{meta}</div>}
          </div>
          {action && <div className="shrink-0 mt-1">{action}</div>}
        </div>
      </div>
    </div>
  );
}

export function PageBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="container py-8 sm:py-12">
      {children}
    </div>
  );
}
