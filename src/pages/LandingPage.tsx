import { Link } from 'react-router';

import dashboardImage from '../assets/landing/dashboard.webp';
import workflowPoster from '../assets/landing/workflow-poster.webp';
import workflowMp4 from '../assets/landing/workflow.mp4?url';
import workflowWebm from '../assets/landing/workflow.webm?url';
import './LandingPage.css';

function shouldAutoPlay(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true;
  }

  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function LandingPage() {
  const autoPlay = shouldAutoPlay();

  return (
    <main className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-terminal">
          <div className="landing-window-bar" aria-hidden="true">
            <span className="landing-window-dots">
              <i />
              <i />
              <i />
            </span>
            <span>dutyy — zsh</span>
          </div>

          <div className="landing-terminal__body">
            <p className="landing-prompt">
              <span>visitor@dutyy</span>:~$ ./dutyy
            </p>
            <h1 id="landing-title">
              Dutyy
              <span className="terminal-cursor" aria-hidden="true" />
            </h1>
            <p className="landing-tagline">
              Organize projects and keep track of the work that moves them forward.
            </p>
            <p className="landing-aside">
              <span aria-hidden="true">#</span> yes, we made another to-do app.
            </p>
            <div className="landing-actions">
              <Link to="/signup" className="landing-primary-action">
                Start organizing
              </Link>
              <Link to="/login" className="landing-secondary-action">
                I have an account
              </Link>
            </div>
          </div>
        </div>

        <figure className="landing-product-shot">
          <div className="landing-product-shot__bar" aria-hidden="true">
            <span className="landing-window-dots">
              <i />
              <i />
              <i />
            </span>
            <span>dutyy.app/dashboard</span>
          </div>
          <img
            src={dashboardImage}
            width="1800"
            height="1200"
            alt="Dutyy dashboard showing a household project and its dutyys"
          />
        </figure>
      </section>

      <section className="landing-workflow" aria-labelledby="workflow-title">
        <header className="landing-workflow__header">
          <p className="landing-section-kicker">Work in motion</p>
          <h2 id="workflow-title">
            <span>Edit the details.</span>
            <span>Finish the work.</span>
          </h2>
          <p>
            Keep the next action clear, update it when plans change, and close the loop when it is
            done.
          </p>
        </header>

        <div className="landing-demo">
          <div className="landing-demo__glow" aria-hidden="true" />
          <video
            autoPlay={autoPlay}
            loop
            muted
            playsInline
            poster={workflowPoster}
            preload="metadata"
            aria-label="A dutyy being edited and marked complete"
          >
            <source src={workflowWebm} type="video/webm" />
            <source src={workflowMp4} type="video/mp4" />
          </video>
        </div>
      </section>
    </main>
  );
}
