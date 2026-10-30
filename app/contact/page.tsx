import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import Section from '@/components/Section';
import { pageMetadata } from '@/lib/metadata';
import { SOCIAL_PROFILES, externalLinkProps } from '@/lib/social';

export const metadata: Metadata = pageMetadata({
  title: 'Contact',
  description: 'Contact Valentine Mohaugen at Clemson University.',
  path: '/contact/',
});

export default function ContactPage() {
  return (
    <>
      <PageHeader title="Contact" subtitle="Get in touch" figure="contact" />

      <Section>
        <div className="contact-list">
          {SOCIAL_PROFILES.map(({ key, contactLabel, displayValue, href, Icon }) => (
            <div className="contact-item" key={key}>
              <div className="contact-icon">
                <Icon size={20} />
              </div>
              <div>
                <div className="contact-label">{contactLabel}</div>
                <div className="contact-value">
                  <a href={href} {...externalLinkProps(href)} aria-label={displayValue}>
                    {displayValue.split(/(?<=[@/-])/).flatMap((part, i) => (i ? [<wbr key={i} />, part] : [part]))}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
