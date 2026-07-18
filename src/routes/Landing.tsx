import { Link } from 'react-router-dom';

export default function Landing() {
  return <div className="pulse-landing">
    <header className="pulse-header"><Link to="/" className="pulse-logo"><span>ϟ</span>PULSE<strong>FIT</strong></Link><nav><a href="#features">Workouts</a><a href="#features">Trainers</a><Link to="/changelog">Community</Link></nav><div><Link to="/login/player">Log in</Link><Link to="/signup/player"><button>Start Training</button></Link></div></header>
    <main className="pulse-hero"><div className="pulse-copy"><span className="pulse-pill"><i/> Personal coaching platform</span><h1>Transform<br/>Your Body<br/><em>Your Life</em></h1><p>Train with your personal coach using personalized workouts, nutrition plans, progress tracking, and private support.</p><div className="pulse-actions"><Link to="/login/player"><button>I'm a Player →</button></Link><Link to="/login/coach">I'm a Coach</Link></div><div className="pulse-stats" id="features"><div><strong>Custom</strong><span>Programs</span></div><div><strong>Weekly</strong><span>Diet Plans</span></div><div><strong>Live</strong><span>Coach Chat</span></div></div></div>
      <div className="pulse-workout-card"><header><span>ϟ</span><div><strong>Today's Workout</strong><small>Personal Training</small></div></header><p><i className="done"/> Warm Up <span>5 min</span></p><p><i className="done"/> Main Workout <span>30 min</span></p><p><i/> Cool Down <span>5 min</span></p><div className="pulse-progress"><b/></div><small>Program ready for you</small></div>
    </main>
    <footer className="pulse-footer">© {new Date().getFullYear()} Coach Platform · <Link to="/terms">Terms of Use</Link></footer>
  </div>;
}
