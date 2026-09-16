import { cn } from '@/lib/cn';

/**
 * A page section and its width-constrained inner container.
 *
 * @param alt - Use the alternate background (`.section-alt`).
 * @param wide - Use the wider container, as the research page does.
 */
export default function Section({
  children,
  alt = false,
  wide = false,
  className,
}: {
  children: React.ReactNode;
  alt?: boolean;
  wide?: boolean;
  className?: string;
}) {
  return (
    <section className={cn('section', alt && 'section-alt', className)}>
      <div className={wide ? 'container-wide' : 'container'}>{children}</div>
    </section>
  );
}
