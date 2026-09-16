import { cn } from '@/lib/cn';

/**
 * The title block at the top of a subpage.
 *
 * `className` and `children` are deliberate escape hatches: a page that needs
 * a one-off tweak or an extra element under the subtitle can do it without
 * growing a new prop here.
 */
export default function PageHeader({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className={cn('page-header', className)}>
      <div className="container">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}
