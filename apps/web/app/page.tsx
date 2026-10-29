import InquiryForm from './ui/InquiryForm';

export default function Home() {
  return <main className="public-shell">
    <nav className="topbar"><a href="/" className="brand"><span className="brand-mark">N</span><span>northstar<span className="brand-light"> learning</span></span></a><a href="/admin" className="admin-link">Team sign in <span aria-hidden="true">↗</span></a></nav>
    <section className="hero-grid">
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot" /> A brighter way forward</div><h1>Big plans start<br/>with a <em>conversation.</em></h1><p className="hero-lede">Tell us what you’re exploring. Our learning team will help you find the right next step.</p>
        <div className="promise-list"><div><span className="promise-icon">✳</span><span><strong>Personal guidance</strong><small>Real people, thoughtful answers</small></span></div><div><span className="promise-icon">↗</span><span><strong>Made for your journey</strong><small>Support for every kind of learner</small></span></div></div>
        <div className="hero-note"><span className="note-line"/>A little question can open a lot of doors.</div>
      </div>
      <div className="form-card"><div className="card-topline"><span>LET’S GET STARTED</span><span className="card-step">01 <i/> 02</span></div><h2>How can we help?</h2><p className="form-intro">Share a few details and we’ll be in touch soon.</p><InquiryForm /></div>
    </section>
    <footer className="public-footer"><span>Northstar Learning <span className="footer-dot">·</span> Learning with purpose</span><span>Every great journey has a first step.</span></footer>
  </main>;
}
