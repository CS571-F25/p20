import { useRef, useState } from "react"
import { Link, useNavigate } from "react-router"
import trackTransactionsImg from '../../assets/transactions.png';
import budgetImg from '../../assets/budget.png';
import notiImg from '../../assets/notifications.png';
import logo from '../../assets/logo.png';


export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <style>{`
        .navbar {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          z-index: 1000 !important;
        }

        .landing-page {
          padding-top: 80px; /* Prevent content from hiding under navbar */
          background-color: #f7fafc;
          color: #2d3748;
          line-height: 1.6;
          margin: 0;
          padding: 0;
        }

        .hero-section {
          padding: 80px 20px;
          text-align: center;
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
        }

        .hero-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .hero-badge {
          display: inline-block;
          background-color: #ebf8ff;
          color: #2c5282;
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 0.9em;
          font-weight: 600;
          margin-bottom: 24px;
          border: 2px solid #bee3f8;
        }

        .hero-title {
          font-size: 3.5em;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 20px;
          line-height: 1.2;
        }

        .hero-title .highlight {
          background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-description {
          font-size: 1.25em;
          color: #718096;
          margin-bottom: 40px;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        .hero-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 40px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1.1em;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(66, 153, 225, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(66, 153, 225, 0.4);
        }

        .btn-secondary {
          background-color: white;
          color: #2d3748;
          border: 2px solid #e2e8f0;
          padding: 16px 32px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1.1em;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          border-color: #cbd5e0;
          background-color: #f7fafc;
        }

        .hero-stats {
          display: flex;
          gap: 40px;
          justify-content: center;
          color: #718096;
          font-size: 0.95em;
          flex-wrap: wrap;
        }

        .hero-stat {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .hero-image {
          margin-top: 60px;
          max-width: 1000px;
          margin-left: auto;
          margin-right: auto;
        }

        .image-placeholder {
          background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%);
          border-radius: 12px;
          padding: 100px 40px;
          border: 2px solid #a0aec0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #718096;
          font-weight: 600;
          font-size: 1.1em;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .features-section {
          padding: 80px 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .section-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .section-title {
          font-size: 2.5em;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 16px;
        }

        .section-subtitle {
          font-size: 1.2em;
          color: #718096;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 30px;
        }

        .feature-card {
          background: white;
          padding: 32px;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(66, 153, 225, 0.15);
          border-color: #4299e1;
        }

        .feature-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          margin-bottom: 20px;
        }

        .feature-title {
          font-size: 1.3em;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 12px;
        }

        .feature-description {
          color: #718096;
          line-height: 1.6;
        }

        .how-it-works-section {
          padding: 80px 20px;
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
        }

        .steps-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 40px;
        }

        .step-card {
          background: white;
          padding: 36px;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          position: relative;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .step-number {
          position: absolute;
          top: -20px;
          left: 36px;
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.5em;
          font-weight: 700;
          box-shadow: 0 4px 10px rgba(66, 153, 225, 0.3);
        }

        .step-title {
          font-size: 1.4em;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 12px;
          margin-top: 20px;
        }

        .step-description {
          color: #718096;
          line-height: 1.6;
        }

        .screenshot-section {
          padding: 80px 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .screenshot-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 40px;
          margin-top: 40px;
        }

        .screenshot-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .screenshot-title {
          font-size: 1.2em;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 16px;
          padding: 0 12px;
        }

        .cta-section {
          padding: 100px 20px;
          text-align: center;
          background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
          color: white;
        }

        .cta-container {
          max-width: 800px;
          margin: 0 auto;
        }

        .cta-title {
          font-size: 2.5em;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .cta-description {
          font-size: 1.2em;
          margin-bottom: 40px;
          opacity: 0.95;
        }

        .btn-cta {
          background: white;
          color: #3182ce;
          border: none;
          padding: 18px 40px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1.2em;
          font-weight: 700;
          transition: all 0.3s ease;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }

        .btn-cta:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .cta-note {
          margin-top: 20px;
          font-size: 0.9em;
          opacity: 0.85;
        }

        .footer {
          background: #232836;
          color: #a0aec0;
          padding: 60px 20px 30px;
        }

        .footer-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 40px;
          margin-bottom: 40px;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .footer-logo {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
        }

        .footer-brand-text {
          color: white;
          font-size: 1.2em;
          font-weight: 700;
        }

        .footer-description {
          font-size: 0.9em;
          line-height: 1.6;
        }

        .footer-title {
          color: white;
          font-weight: 600;
          margin-bottom: 16px;
          font-size: 1em;
        }

        .footer-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 0;
        }

        .footer-links a {
          color: #a0aec0;
          text-decoration: none;
          font-size: 0.9em;
          transition: color 0.2s ease;
        }

        .footer-links a:hover {
          color: #66aaff;
        }

        .footer-bottom {
          border-top: 1px solid #3a4051;
          padding-top: 30px;
          text-align: center;
          font-size: 0.9em;
        }

        @media (max-width: 880px) {
          .hero-title {
            font-size: 2.5em;
          }

          .section-title {
            font-size: 2em;
          }

          .features-grid, .steps-container, .screenshot-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="landing-page">
        {/* HERO SECTION */}
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-badge">💰 Track Every Dollar, Reach Every Goal</div>
            <h1 className="hero-title">
              Your Money,<br />
              <span className="highlight">Your Control</span>
            </h1>
            <p className="hero-description">
              Take control of your finances with WalletPalz. Track transactions, set smart budgets,
              and visualize your spending patterns. All in one intuitive platform.
            </p>
            <div className="hero-buttons">
              <button className="btn-primary" onClick={()=>{
                navigate("/signup");
              }}
              >Start Tracking Free →</button>
              <button className="btn-secondary" onClick={() => document.getElementById('features').scrollIntoView()}>See How It Works</button>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">✓ Free to use</div>
              <div className="hero-stat">✓ Multi-currency</div>
              <div className="hero-stat">✓ Real-time insights</div>
            </div>

            <div className="hero-image">
              <div className="image-placeholder">
                📊 Dashboard Screenshot Preview
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="features-section">
          <div className="section-header">
            <h2 className="section-title">Everything You Need to Master Your Money</h2>
            <p className="section-subtitle">Powerful features designed to simplify your financial life</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3 className="feature-title">Smart Transaction Tracking</h3>
              <p className="feature-description">
                Add and categorize transactions with ease. Track expenses and income across
                multiple currencies with automatic date grouping and filtering.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3 className="feature-title">Budget Management</h3>
              <p className="feature-description">
                Set spending limits by category and timeframe. Get real-time alerts on your
                daily budget and track progress with visual indicators.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3 className="feature-title">Visual Analytics Dashboard</h3>
              <p className="feature-description">
                View spending trends with beautiful charts and graphs. Understand your
                financial patterns with weekly and monthly breakdowns.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <h3 className="feature-title">Multi-Currency Support</h3>
              <p className="feature-description">
                Track transactions in 35+ currencies including USD, EUR, GBP, JPY, and more.
                Perfect for international travelers and expats.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📑</div>
              <h3 className="feature-title">Category Insights</h3>
              <p className="feature-description">
                Organize spending across Food, Transportation, Entertainment, Shopping, Bills,
                and more. See exactly where your money goes.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3 className="feature-title">Flexible Date Filtering</h3>
              <p className="feature-description">
                Filter transactions by custom date ranges, view this week's spending, or
                analyze historical data with powerful search and export features.
              </p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="how-it-works-section">
          <div className="section-header">
            <h2 className="section-title">Simple, Smart, Effective</h2>
            <p className="section-subtitle">Get started in three easy steps</p>
          </div>

          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">Add Transactions</h3>
              <p className="step-description">
                Quickly log your expenses and income with detailed descriptions, categories,
                and amounts in any currency.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <h3 className="step-title">Create Budgets</h3>
              <p className="step-description">
                Set spending limits for one or multiple categories with custom start and end
                dates to stay on track.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <h3 className="step-title">Track & Analyze</h3>
              <p className="step-description">
                View your dashboard to see spending trends, budget progress, and get daily
                spending recommendations to meet your goals.
              </p>
            </div>
          </div>
        </section>

        {/* SCREENSHOTS SECTION */}
        <section id="screenshots" className="screenshot-section">
          <div className="section-header">
            <h2 className="section-title">See WalletPalz in Action</h2>
            <p className="section-subtitle">Beautiful, intuitive interface designed for daily use</p>
          </div>

          <div className="screenshot-grid">
            <div className="screenshot-card">
              <h3 className="screenshot-title">📝 Transaction Tracking</h3>
              <img 
                src={trackTransactionsImg} 
                alt="Transaction tracking interface"
                style={{ width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
            </div>

            <div className="screenshot-card">
              <h3 className="screenshot-title">🎯 Budgeting</h3>
              <img 
                  src={budgetImg} 
                  alt="Budget tracking interface"
                  style={{ width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
            </div>
          </div>

          <div className="screenshot-grid">
            <div className="screenshot-card">
              <h3 className="screenshot-title">📊 Analytics Charts</h3>
              <div className="image-placeholder">
                Spending Trends Graph<br />
                <small style={{ opacity: 0.7 }}>Weekly and monthly spending breakdowns</small>
              </div>
            </div>

            <div className="screenshot-card">
              <h3 className="screenshot-title">🔔 Get Notified!</h3>
              <img 
                  src={notiImg} 
                  alt="Notification dropdown interface"
                  style={{ width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="cta-section">
          <div className="cta-container">
            <h2 className="cta-title">Ready to Take Control?</h2>
            <p className="cta-description">
              Join us now and manage your finances better with WalletPalz.
              Start tracking today. Completely free!
            </p>
            <button className="btn-cta" onClick={()=>{
              navigate("/signup");
            }}>Get Started Now</button>
            <p className="cta-note">No credit card required • Free forever</p>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer-container">
            <div className="footer-grid">
              <div>
                <div className="footer-brand">
                  <img src={logo} alt="Logo" className="nav-logo" />
                  <span className="footer-brand-text">WalletPalz</span>
                </div>
                <p className="footer-description">
                  Your trusted companion for smarter money management.
                </p>
              </div>

              <div>
                <h4 className="footer-title" id="feature">Features</h4>
                <ul className="footer-links">
                  <li><a href="#features">Transaction Tracking</a></li>
                  <li><a href="#features">Budget Management</a></li>
                  <li><a href="#features">Analytics Dashboard</a></li>
                </ul>
              </div>

              <div>
                <h4 className="footer-title">Company</h4>
                <ul className="footer-links">
                  <li><a href="#">About Us</a></li>
                  <li><a href="#">Privacy Policy</a></li>
                </ul>
              </div>

              <div>
                <h4 className="footer-title">Support</h4>
                <ul className="footer-links">
                  <li><a href="#">Contact Us</a></li>
                  <li><a href="#">Send Us Feedback</a></li>
                </ul>
              </div>
            </div>


          </div>
        </footer>
      </div>
    </div>
  );
}