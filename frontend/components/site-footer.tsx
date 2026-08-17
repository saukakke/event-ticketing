import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Link className="logo" href="/">
            <span className="logo-mark">EF</span>
            EventFlow
          </Link>
          <p className="footer-copy">
            Digital event ticketing for discovering events, managing bookings and issuing secure digital tickets.
          </p>
        </div>
        <div>
          <div className="footer-title">Explore</div>
          <Link href="/events">Events</Link>
          <Link href="/register">Create an account</Link>
        </div>
        <div>
          <div className="footer-title">Platform</div>
          <Link href="/login">Sign in</Link>
          <Link href="/register">Become an organizer</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>EventFlow · 3MTT Capstone MVP</span>
        <span>Built with Next.js and PostgreSQL.</span>
      </div>
    </footer>
  );
}
