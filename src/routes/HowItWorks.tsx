import { useAuth } from '../auth/AuthContext';

type GuideItem = { name: string; description: string };

const coachGuide: GuideItem[] = [
  { name: 'Clients', description: 'Opens your player list and shows who needs your attention today.' },
  { name: 'Library', description: 'Opens the tools you reuse when building training and nutrition plans.' },
  { name: 'Exercises', description: 'Shows the exercises you can add to workouts.' },
  { name: 'Workouts', description: 'Shows saved workouts that can be reused in player programs.' },
  { name: 'Sections', description: 'Shows reusable groups of workouts for organizing a program.' },
  { name: 'Programs', description: 'Shows complete saved training programs you can reuse.' },
  { name: 'Tasks', description: 'Shows extra tasks or habits that can be assigned to players.' },
  { name: 'Forms', description: 'Shows forms used to collect information from players.' },
  { name: 'Meal Plans', description: 'Shows saved nutrition plans that can be assigned to players.' },
  { name: 'Recipes', description: 'Shows saved recipes for use in nutrition plans.' },
  { name: 'Ingredients', description: 'Shows the foods and ingredients used in recipes.' },
  { name: 'Metric Groups', description: 'Shows the measurements you use to track player progress.' },
  { name: 'Check-ups', description: 'Opens the page where you can see the players you have checked up on so far and who is still waiting.' },
  { name: 'Messages', description: 'Opens your conversations with players.' },
  { name: 'Team', description: 'Lets you view and manage the people helping you run your coaching account.' },
  { name: 'Subs', description: 'Lets you create access keys, renew players, and manage subscription dates.' },
  { name: 'Settings', description: 'Lets you change your account and workspace preferences.' },
  { name: 'Support', description: 'Opens your conversation with the Trainova support team.' },
];

const playerGuide: GuideItem[] = [
  { name: 'Program', description: 'Opens the training plan your coach prepared for you.' },
  { name: 'Diet', description: 'Opens your current meal and nutrition plan.' },
  { name: 'Progress', description: 'Shows your training results and progress over time.' },
  { name: 'Diet Progress', description: 'Lets you record and review how well you are following your diet plan.' },
  { name: 'Chat', description: 'Opens your private conversation with your coach.' },
  { name: 'My Profile', description: 'Shows your personal details and lets you update them.' },
];

const adminGuide: GuideItem[] = [
  { name: 'Users & Keys', description: 'Shows coach accounts and the access keys used to join Trainova.' },
  { name: 'Support', description: 'Shows support conversations that need help from an administrator.' },
  { name: 'Traffic', description: 'Shows website activity and controls for handling suspicious access.' },
];

export default function HowItWorks() {
  const { profile } = useAuth();
  const guide = profile?.role === 'coach' ? coachGuide : profile?.role === 'admin' ? adminGuide : playerGuide;

  return <section className="how-it-works-page">
    <header className="how-it-works-hero">
      <span>Simple guide</span>
      <h1>How It Works</h1>
      <p>Here is what each button does. Choose any button from the menu whenever you want to open that part of Trainova.</p>
    </header>
    <div className="how-it-works-grid">
      {guide.map((item) => <article key={item.name} className="how-it-works-card">
        <strong>{item.name}</strong>
        <p>{item.description}</p>
      </article>)}
    </div>
  </section>;
}
