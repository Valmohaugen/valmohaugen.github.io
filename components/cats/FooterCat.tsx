import CatSprite from '@/components/cats/CatSprite';
import FooterCatWalk from '@/components/cats/FooterCatWalk';

/**
 * The footer cat beside Schrödinger's box, a decorative drawing. The drawings
 * are server-rendered; only FooterCatWalk (a few lines of JS) runs in the
 * browser, to walk the cat in once per session.
 */
export default function FooterCat() {
  return (
    <div className="footer-cat" aria-hidden="true">
      <div className="footer-cat__scene">
        <FooterCatWalk>
          <CatSprite pose="walk" size={48} play className="footer-cat__walking" />
          <CatSprite pose="awake" size={48} className="footer-cat__sitting" />
        </FooterCatWalk>
        <CatSprite pose="box" size={48} className="footer-cat__box" />
      </div>
    </div>
  );
}
