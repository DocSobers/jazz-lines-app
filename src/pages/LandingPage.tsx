import JazzInstruments from '../components/JazzInstruments';
import PlayerCta from '../components/PlayerCta';
import SiteFooter from '../components/SiteFooter';
import SiteNav from '../components/SiteNav';
import '../App.css';
import './LandingPage.css';

interface LandingPageProps {
  clerkEnabled: boolean;
}

export default function LandingPage({ clerkEnabled }: LandingPageProps) {
  return (
    <div className="landing">
      <SiteNav clerkEnabled={clerkEnabled} />

      <section className="landing__hero">
        <JazzInstruments />

        <p className="landing__eyebrow">
          Mel Bay Publishing · Wes Montgomery · George Benson · Joe Pass · Sid Jacobs · Chuck
          Loeb · Frank Gambale · Norman Brown
        </p>
        <h1 className="landing__title">Jazz Lines</h1>
        <p className="landing__lede">
          A great tool for building and practicing your jazz lines using short idioms
          from the jazz language.
        </p>

        <div className="landing__cta-row">
          <PlayerCta
            clerkEnabled={clerkEnabled}
            className="btn btn--primary landing__cta-primary"
            action="signup"
          >
            Start practicing
          </PlayerCta>
          <PlayerCta
            clerkEnabled={clerkEnabled}
            className="btn btn--ghost"
            action="browse"
          >
            Browse idioms
          </PlayerCta>
        </div>
      </section>

      <div className="landing__body">
        <section className="landing__section">
          <h2>Speak the language</h2>
          <p>
            Jazz improvisation is built from reusable phrases — the ii–V–I shapes,
            resolutions, and major-key endings that players like Wes Montgomery,
            George Benson, Joe Pass, Sid Jacobs, Chuck Loeb, Frank Gambale, and Norman Brown
            wove into countless choruses.
            This app lets you hear, chain, and internalize those
            idioms one phrase at a time.
          </p>
          <p>
            Pick a II–V figure, connect it to a V–I resolution and an I maj ending,
            or mix freely across sections. Adjust swing, tempo, and octave until the
            line sits right under your fingers.
          </p>
        </section>

        <section className="landing__section">
          <h2>How it works</h2>
          <div className="landing__features">
            <article className="landing__feature">
              <h3>84 idioms</h3>
              <p>
                II–V, V–I, and I maj phrases from <code>jazz_idoms.xlsx</code> — the
                vocabulary of the jazz guitar line.
              </p>
            </article>
            <article className="landing__feature">
              <h3>Chain &amp; play</h3>
              <p>
                Build a full line across sections. Matching pitches join smoothly;
                non-matching phrases octave-align automatically.
              </p>
            </article>
            <article className="landing__feature">
              <h3>Hear the swing</h3>
              <p>
                Nylon guitar playback with adjustable BPM and swing — from straight
                eighths to full triplet feel.
              </p>
            </article>
          </div>
        </section>
      </div>

      <SiteFooter>
        <p>
          Inspired by the jazz combo — guitar, tenor sax, piano, trumpet, and upright
          bass — working the same changes together.
        </p>
      </SiteFooter>
    </div>
  );
}
