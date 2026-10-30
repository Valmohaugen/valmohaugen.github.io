import type { ReactNode } from 'react';

// One token of inline math: a sub- or superscript (`_x`, `_{…}`, `^x`, `^{…}`;
// braces do not nest), a run of Latin letters, one Greek letter, or anything
// else (a `_` or `^` with nothing after it stays as text, so a typo shows).
const TOKEN = /([_^])(?:\{([^}]*)\}|(.))|([A-Za-z]+)|([α-ωΑ-Ω])|([^_^A-Za-zα-ωΑ-Ω]+|[_^])/gu;

/**
 * Typesets the math in `src` the way LaTeX would: a single letter is an
 * italic variable (lowercase Greek too), while longer words ("bias", "cos")
 * and capital Greek stay upright, like \text and \Psi.
 */
function renderMath(src: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  let i = 0;
  for (const m of src.matchAll(TOKEN)) {
    const key = `${keyPrefix}.${i++}`;
    const [, script, braced, single, latin, greek, other] = m;
    if (script) {
      const Tag = script === '_' ? 'sub' : 'sup';
      out.push(<Tag key={key}>{renderMath(braced ?? single, key)}</Tag>);
    } else if (latin) {
      out.push(latin.length === 1 ? <i key={key}>{latin}</i> : latin);
    } else if (greek) {
      out.push(greek === greek.toLowerCase() ? <i key={key}>{greek}</i> : greek);
    } else {
      out.push(other);
    }
  }
  return out;
}

/**
 * Renders a content string with inline math between `$` delimiters, e.g.
 * `"($T_Z$ and $T_X$ lifetimes)"` or `"data $G(V_{bias}, V_{gate})$"`.
 *
 * Text outside the delimiters is returned unchanged, so strings without math
 * render exactly as before. Each math span is a `.math` element (the serif,
 * which carries the Greek glyphs DM Sans lacks, and never breaks across lines).
 *
 * @param text - Content string; `$…$` marks math. Unpaired `$` is left as text.
 * @returns The text with each math span typeset.
 */
export default function MathText({ text }: { text: string }) {
  const parts = text.split(/\$([^$]+)\$/);
  if (parts.length === 1) return text;
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span className="math" key={i}>
            {renderMath(part, String(i))}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}
