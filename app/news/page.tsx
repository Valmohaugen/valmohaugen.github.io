import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import Section from '@/components/Section';
import Decrypt from '@/components/qrng/Decrypt';
import news from '@/data/news.json';
import { pageMetadata } from '@/lib/metadata';
import type { NewsItem } from '@/lib/types';

// Unlisted on purpose: reached only from the homepage's "View all news" link,
// so it stays out of the nav and the sitemap and asks search engines not to
// index it (links on it are still followed).
export const metadata: Metadata = {
  ...pageMetadata({
    title: 'News',
    description: 'Every news item from Valentine Mohaugen’s homepage, newest first.',
    path: '/news/',
  }),
  robots: { index: false, follow: true },
};

const newsItems: NewsItem[] = news;

/**
 * The whole news log, grouped by year. data/news.json is kept newest-first,
 * so the groups and the entries in each come out newest-first too. The
 * homepage's "Latest" shows the top five and links here. Not in the nav.
 */
function byYear(items: NewsItem[]): [string, NewsItem[]][] {
  const groups = new Map<string, NewsItem[]>();
  for (const item of items) {
    const year = item.date.slice(-4);
    groups.set(year, [...(groups.get(year) ?? []), item]);
  }
  return [...groups.entries()];
}

export default function NewsPage() {
  return (
    <>
      <PageHeader title="News" subtitle="Everything from the homepage’s Latest, newest first" />

      <Section>
        {byYear(newsItems).map(([year, items]) => (
          <div className="news-year" key={year}>
            <Decrypt as="h2" trigger="visible">
              {year}
            </Decrypt>
            <ul className="news-list">
              {items.map(({ date, text }) => (
                <li className="news-item" key={date + text.slice(0, 24)}>
                  <span className="news-date">{date}</span>
                  <span className="news-text">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Section>
    </>
  );
}
