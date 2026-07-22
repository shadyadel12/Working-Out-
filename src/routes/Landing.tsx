import { Link } from 'react-router-dom';

const features = [
  { number: '01', title: 'Training that adapts', copy: 'Your coach builds every set, rep, and progression around your real performance.' },
  { number: '02', title: 'Nutrition with direction', copy: 'Simple daily plans, meal check-ins, and feedback keep the work sustainable.' },
  { number: '03', title: 'Progress you can see', copy: 'Turn completed sessions and check-ups into a clear story of momentum.' },
];

export default function Landing() {
  return <div className="pulse-landing">
    <header className="pulse-header">
<Link to="/" className="pulse-logo" aria-label="Trainova home">
<span className="trainova-mark"><img src="/trainova-wordmark.jpeg" alt="" /></span>
<strong>TRAINOVA</strong>
</Link>
<nav aria-label="Main navigation">
<a href="#experience">Experience</a>
<a href="#features">Features</a>
<Link to="/changelog">Updates</Link>
</nav>
<div className="pulse-auth-actions">
<details className="pulse-auth-menu">
<summary>Sign in</summary>
<div role="menu" aria-label="Choose how to sign in">
<Link role="menuitem" to="/login/player">
<span>Athlete</span>
<small>Open your training space</small>
</Link>
<Link role="menuitem" to="/login/coach">
<span>Coach</span>
<small>Open your coaching workspace</small>
</Link>
</div>
</details>
<details className="pulse-auth-menu pulse-auth-menu-primary">
<summary>Sign up</summary>
<div role="menu" aria-label="Choose how to sign up">
<Link role="menuitem" to="/signup/player">
<span>Athlete</span>
<small>Start training with a coach</small>
</Link>
<Link role="menuitem" to="/signup/coach">
<span>Coach</span>
<small>Create your coaching account</small>
</Link>
</div>
</details>
</div>
</header>
    <main>
      <section className="pulse-hero">
        <div className="pulse-noise" aria-hidden="true" />
        <div className="pulse-copy">
<span className="pulse-pill">
<i/> Personal coaching, connected</span>
<h1>Build strength.<br/>
<em>Own the change.</em>
</h1>
<p>A private training space where your workouts, nutrition, progress, and coach move together.</p>
<div className="pulse-actions">
<Link className="pulse-primary-cta" to="/login/player">Enter as player <span aria-hidden="true">→</span>
</Link>
<Link to="/login/coach">Coach workspace <span aria-hidden="true">↗</span>
</Link>
</div>
<div className="pulse-stats">
<div>
<strong>01</strong>
<span>One clear plan</span>
</div>
<div>
<strong>24/7</strong>
<span>Coach connection</span>
</div>
<div>
<strong>100%</strong>
<span>Built for you</span>
</div>
</div>
</div>
        <div className="pulse-visual" aria-label="A preview of today's personalized workout">
<div className="pulse-orbit orbit-one"/>
<div className="pulse-orbit orbit-two"/>
<div className="pulse-workout-card">
<header>
<span className="pulse-card-icon" aria-hidden="true">P</span>
<div>
<small>Today · Lower body</small>
<strong>Strength / 04</strong>
</div>
<b>72%</b>
</header>
<div className="pulse-exercise active">
<i>01</i>
<span>
<strong>Back squat</strong>
<small>4 sets · 8 reps</small>
</span>
<em>Done</em>
</div>
<div className="pulse-exercise">
<i>02</i>
<span>
<strong>Romanian deadlift</strong>
<small>3 sets · 10 reps</small>
</span>
<em>Next</em>
</div>
<div className="pulse-exercise">
<i>03</i>
<span>
<strong>Walking lunge</strong>
<small>3 sets · 12 reps</small>
</span>
<em>12:00</em>
</div>
<div className="pulse-progress">
<b/>
</div>
<footer>
<span>Session progress</span>
<strong>32 min</strong>
</footer>
</div>
<span className="pulse-float pulse-float-top">Coach checked in <b>Now</b>
</span>
<span className="pulse-float pulse-float-bottom">4 week streak <b>↗ 18%</b>
</span>
</div>
        <a href="#experience" className="pulse-scroll">Scroll to explore <span>↓</span>
</a>
      </section>
      <section className="pulse-marquee" aria-hidden="true">
<div>TRAIN SMARTER <i/> RECOVER BETTER <i/> STAY CONSISTENT <i/> TRAIN SMARTER <i/> RECOVER BETTER <i/> STAY CONSISTENT</div>
</section>
      <section className="pulse-experience" id="experience">
<div>
<span className="pulse-kicker">The connected experience</span>
<h2>Everything your next result needs. Nothing it doesn’t.</h2>
</div>
<p>Less app-switching. Less guessing. One focused place for the work between you and your coach.</p>
</section>
      <section className="pulse-feature-grid" id="features">{features.map((feature) => <article key={feature.number}>
<span>{feature.number}</span>
<h3>{feature.title}</h3>
<p>{feature.copy}</p>
<i aria-hidden="true">↗</i>
</article>)}</section>
      <section className="pulse-final">
<span>Ready when you are</span>
<h2>Your strongest chapter<br/>starts with one session.</h2>
<Link className="pulse-primary-cta" to="/signup/player">Start training <span aria-hidden="true">→</span>
</Link>
</section>
    </main>
    <footer className="pulse-footer">
<span>TRAINOVA · Train · Grow · Achieve.</span>
<span>© {new Date().getFullYear()} · <Link to="/terms">Terms</Link>
</span>
</footer>
  </div>;
}
