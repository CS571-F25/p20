import "./AboutMe.css";

export default function AboutMe(props) {
  return (
    <main className="page-content about-page" aria-labelledby="about-title">
      <header className="about-header">
        <p className="eyebrow">Get to know us</p>
        <h1 id="about-title">About WalletPalz</h1>
        <p className="muted about-lead">
          We are building a calmer way to track money—clear insights, friendly controls, and accessibility first.
        </p>
      </header>

      <section className="about-grid" aria-label="What we stand for">
        <article className="about-card" aria-labelledby="mission-title">
          <h2 id="mission-title">Our mission</h2>
          <p>
            Help everyday people see their finances without stress. No jargon, no dark patterns—just the context you
            need to make confident decisions.
          </p>
          <ul className="about-list">
            <li>Clarity over complexity for every balance and budget.</li>
            <li>Accessible experiences that work with keyboard and screen readers.</li>
            <li>Data ownership that stays with you—export whenever you want.</li>
          </ul>
        </article>

        <article className="about-card" aria-labelledby="access-title">
          <h2 id="access-title">Accessibility first</h2>
          <p>
            From color contrast to logical headings, we design for everyone. Inputs are labeled, charts include text
            context, and you can navigate the app without a mouse.
          </p>
          <div className="pill-group" aria-label="Accessibility promises">
            <span className="pill">WCAG AA contrast</span>
            <span className="pill">Keyboard friendly</span>
            <span className="pill">Clear labels</span>
          </div>
        </article>

        <article className="about-card" aria-labelledby="team-title">
          <h2 id="team-title">Built for students</h2>
          <p>
            WalletPalz was created by learners who wanted a budgeting tool that respects time and focus. We listen to
            feedback and ship small, thoughtful updates often.
          </p>
          <div className="highlight-metrics">
            <div>
              <p className="about-metric-value">6 mo</p>
              <p className="about-metric-label">Trends tracked</p>
            </div>
            <div>
              <p className="about-metric-value">5x</p>
              <p className="about-metric-label">Faster insights</p>
            </div>
            <div>
              <p className="about-metric-value">100%</p>
              <p className="about-metric-label">Control of data</p>
            </div>
          </div>
        </article>
      </section>

      <section className="about-cta" aria-label="Connect with us">
        <div>
          <h2>Let&apos;s keep improving</h2>
          <p>
            Have an idea to make budgeting clearer or more accessible? Drop us a note—we read every message and ship
            changes quickly.
          </p>
          <div className="cta-actions">
            <a className="cta-link" href="mailto:support@walletpalz.app">
              Email support@walletpalz.app
            </a>
            <span className="cta-secondary">or chat with us in Settings &gt; Help</span>
          </div>
        </div>
      </section>
    </main>
  );
}
