interface StarDividerProps {
  /** Footer variant: slightly wider and more faded. */
  wide?: boolean;
}

// Decorative divider: a single faint hairline spanning most of the width.
// Colors come from theme tokens so light/dark recolor automatically.
export default function StarDivider({ wide = false }: StarDividerProps) {
  return (
    <svg
      className={`star-divider${wide ? ' star-divider--wide' : ''}`}
      viewBox="0 0 260 16"
      aria-hidden="true"
      focusable="false"
    >
      <line className="sd-line" x1="4" y1="8" x2="256" y2="8" />
    </svg>
  );
}
