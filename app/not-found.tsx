import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="section not-found">
      <div className="container">
        <p className="not-found__code">404</p>
        <h1>Page not found</h1>
        <p className="not-found__text">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <div className="not-found__links">
          <Link href="/" className="link-inline">
            Back to home
          </Link>
          <Link href="/research/" className="link-inline">
            Browse projects
          </Link>
        </div>
      </div>
    </section>
  );
}
