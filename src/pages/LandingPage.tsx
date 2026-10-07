import { Link } from 'react-router';

export default function LandingPage() {
  return (
    <main className="landing-page">
      <h1>Dutyy</h1>
      <p>Organize projects and keep track of the work that moves them forward.</p>
      <Link to="/signup">Create an account</Link>
    </main>
  );
}
