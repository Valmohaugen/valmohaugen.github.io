import Decrypt from '@/components/qrng/Decrypt';
import RouteFigure from '@/components/stage/RouteFigure';
import type { RouteFigureId } from '@/components/stage/StageSlot';
import { cn } from '@/lib/cn';

/**
 * The title block at the top of a subpage. The h1 decrypts through measured
 * ibm_sherbrooke digits on client navigation (components/qrng/Decrypt.tsx);
 * `figure` adds the page's live figure beside it (components/stage/RouteFigure.tsx).
 *
 * `className` and `children` are deliberate escape hatches: a page that needs
 * a one-off tweak or an extra element under the subtitle can do it without
 * growing a new prop here.
 */
export default function PageHeader({
  title,
  subtitle,
  figure,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  figure?: RouteFigureId;
  className?: string;
  children?: React.ReactNode;
}) {
  const text = (
    <>
      {/* An "&" stays with the word before it: a line never starts with one. */}
      <Decrypt>{title.replace(/ &/g, '\u00a0&')}</Decrypt>
      {subtitle && <p>{subtitle}</p>}
      {children}
    </>
  );
  return (
    <section className={cn('page-header', figure && 'page-header--figure', className)}>
      <div className="container">
        {figure ? (
          <div className="page-header__grid">
            <div className="page-header__text">{text}</div>
            <RouteFigure figure={figure} />
          </div>
        ) : (
          <div className="page-header__text">{text}</div>
        )}
      </div>
    </section>
  );
}
