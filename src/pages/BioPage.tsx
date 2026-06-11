import { Link } from 'react-router-dom';
import SiteFooter from '../components/SiteFooter';
import SiteNav from '../components/SiteNav';
import { BIO } from '../data/bio';
import '../App.css';
import './LandingPage.css';

interface BioPageProps {
  clerkEnabled: boolean;
}

export default function BioPage({ clerkEnabled }: BioPageProps) {
  return (
    <div className="landing">
      <SiteNav clerkEnabled={clerkEnabled} />

      <main className="about about--bio">
        <header className="about__header">
          <img
            src="/doc-sobers-bio.jpeg"
            alt="Colin Doc' Sobers with jazz guitars"
            className="about__photo"
            width={342}
            height={505}
          />
          <div className="about__intro">
            <p className="landing__eyebrow">The musician</p>
            <h1 className="about__title">{BIO.name}</h1>
            <p className="about__role">{BIO.role}</p>
          </div>
        </header>

        <div className="about__body">
          {BIO.paragraphs.map((paragraph, i) => (
            <p key={i} className="about__paragraph">
              {paragraph}
            </p>
          ))}
        </div>

        <p className="about__crosslink">
          <Link to="/about">About the Jazz Lines app</Link>
        </p>
      </main>

      <SiteFooter>
        <p>Colin Doc&apos; Sobers · Atlanta, GA</p>
      </SiteFooter>
    </div>
  );
}
