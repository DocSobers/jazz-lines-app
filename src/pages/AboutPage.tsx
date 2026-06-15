import { Link } from 'react-router-dom';
import PlayerCta from '../components/PlayerCta';
import SiteFooter from '../components/SiteFooter';
import SiteNav from '../components/SiteNav';
import '../App.css';
import './LandingPage.css';

interface AboutPageProps {
  clerkEnabled: boolean;
}

export default function AboutPage({ clerkEnabled }: AboutPageProps) {
  return (
    <div className="landing">
      <SiteNav clerkEnabled={clerkEnabled} />

      <main className="about">
        <header className="about__header about__header--solo">
          <p className="landing__eyebrow">The app</p>
          <h1 className="about__title">About Jazz Lines</h1>
          <p className="about__subtitle">
            Build and practice jazz lines from short idioms in the jazz language.
          </p>
        </header>

        <section className="about__app about__app--solo">
          <p>
            Jazz Lines is a practice tool for hearing, chaining, and internalizing
            ii–V–I vocabulary — the short phrases that make up the jazz language on
            the bandstand. The idioms come from Mel Bay Publishing&apos;s{' '}
            <em>Complete Book of Jazz Guitar Lines &amp; Phrases</em> by Sid Jacobs.
          </p>
          <p>
            Browse II–V, V–I, and I maj figures, play each one with adjustable BPM and
            swing, then chain them into a full line. Matching pitches join smoothly at
            the boundary; other phrases octave-align automatically. Per-idiom octave
            controls let you shape how the line sits on the fretboard.
          </p>
          <p>
            Nylon guitar playback brings each phrase to life. Sign in as an admin to
            edit idioms in the browser and export changes back to the spreadsheet.
          </p>
          <div className="about__actions">
            <PlayerCta clerkEnabled={clerkEnabled} className="btn btn--primary">
              Open the player
            </PlayerCta>
            <Link to="/bio" className="btn btn--ghost">
              Meet the musician
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter>
        <p>
          Created by{' '}
          <Link to="/bio" className="landing__footer-link">
            Colin Doc&apos; Sobers
          </Link>
        </p>
      </SiteFooter>
    </div>
  );
}
