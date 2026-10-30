import { SOCIAL_PROFILES, externalLinkProps } from '@/lib/social';

/** Icon links to every profile: the foot of the small-screen menu (Header) and the footer. */
export default function NavSocial() {
  return SOCIAL_PROFILES.map(({ key, label, href, Icon }) => (
    <a key={key} href={href} {...externalLinkProps(href)} aria-label={label} title={label}>
      <Icon size={18} />
    </a>
  ));
}
