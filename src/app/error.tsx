"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main id="main" className="empty-state"><h1>We couldn’t load this page.</h1><p>Please try again. If the problem continues, contact the property team.</p><button className="button" onClick={reset}>Try again</button></main>;
}
