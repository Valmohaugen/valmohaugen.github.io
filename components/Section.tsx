import { cn } from '@/lib/cn';

/**
 * A page section and its width-constrained inner container.
 *
 * @param alt - Use the alternate background (`.section-alt`).
 */
export default function Section({
  children,
  alt = false,
  className,
}: {
  children: React.ReactNode;
  alt?: boolean;
  className?: string;
}) {
  return (
    <section className={cn('section', alt && 'section-alt', className)}>
      <div className="container">{children}</div>
    </section>
  );
}
