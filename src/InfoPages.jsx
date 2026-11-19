
import { useEffect, useState } from 'react';
import {
  Wallet,
  ShieldCheck,
  Target,
  Eye,
  Mail,
  ArrowLeft,
  ChartNoAxesCombined,
  PiggyBank,
  Receipt,
  Cloud,
  Download,
  Smartphone,
  CircleAlert,
  CircleCheck,
  LoaderCircle,
  MessageSquareText,
  Send,
} from 'lucide-react';
import { supabase } from './supabase';

import './InfoPages.css';

const SUPPORT_EMAIL = 'aejazkhannnn@gmail.com';

function Header() {
  return (
    <header className="info-header">
      <a href="/" className="info-brand">
        <span className="info-brand-icon">
          <Wallet size={23} />
        </span>
        ExpenseNest
      </a>

      <a href="/" className="info-back">
        <ArrowLeft size={16} />
        Back to Dashboard
      </a>
    </header>
  );
}

function PageTitle({ eyebrow, title, description }) {
  return (
    <div className="info-page-title">
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}

function PrivacyPolicy() {
  return (
    <>
      <PageTitle
        eyebrow="YOUR PRIVACY MATTERS"
        title="Privacy Policy"
        description="Understand how ExpenseNest handles information when you use our platform."
      />

      <p className="info-updated">Last Updated: November 2026</p>

      <section className="info-section">
        <h2>1. Information We Collect</h2>
        <p>
          Depending on how you use ExpenseNest, information may include
          account details, income, expenses, transactions, budgets,
          savings goals and preferences that you enter.
        </p>
      </section>

      <section className="info-section">
        <h2>2. Data Storage</h2>
        <p>
          ExpenseNest uses browser storage for local data and Supabase
          for authentication and cloud synchronization. The information
          available in your account depends on the features you use. If you
          submit feedback while signed in, your message, category and account
          email (when available) are stored in Supabase for the ExpenseNest
          team to review and respond.
        </p>
      </section>

      <section className="info-section">
        <h2>3. How Information Is Used</h2>
        <p>
          Information is used to provide expense tracking, budgeting,
          financial summaries, analytics and synchronization features.
        </p>
      </section>

      <section className="info-section">
        <h2>4. Data Security</h2>
        <p>
          We use available authentication and database security controls.
          However, no online service or electronic storage method can
          guarantee absolute security.
        </p>
      </section>

      <section className="info-section">
        <h2>5. Your Responsibilities</h2>
        <p>
          Keep your login credentials private. Use a secure device and
          avoid entering passwords or other highly sensitive information
          into expense descriptions.
        </p>
      </section>

      <section className="info-section">
        <h2>6. Third-Party Services</h2>
        <p>
          ExpenseNest relies on services such as Supabase for
          authentication and cloud functionality and Vercel for website
          hosting and analytics. Their own privacy policies may also apply.
        </p>
      </section>

      <section className="info-section">
        <h2>7. Contact About Privacy</h2>
        <p>
          For questions about this policy, contact us at:
        </p>
        <a className="info-email" href={`mailto:${SUPPORT_EMAIL}`}>
          <Mail size={17} />
          {SUPPORT_EMAIL}
        </a>
      </section>
    </>
  );
}

const features = [
  {
    icon: Receipt,
    title: 'Expense Tracking',
    description: 'Keep track of daily income and expenses.'
  },
  {
    icon: Wallet,
    title: 'Account Management',
    description: 'Organize transactions across multiple accounts.'
  },
  {
    icon: Target,
    title: 'Budget Planning',
    description: 'Set monthly and category-wise budgets.'
  },
  {
    icon: PiggyBank,
    title: 'Savings Goals',
    description: 'Keep an eye on your savings goals.'
  },
  {
    icon: ChartNoAxesCombined,
    title: 'Financial Analytics',
    description: 'Understand your spending with useful summaries.'
  },
  {
    icon: Cloud,
    title: 'Cloud Sync',
    description: 'Synchronize supported data with your account.'
  },
  {
    icon: Download,
    title: 'Data Backup',
    description: 'Use available import and export options.'
  },
  {
    icon: Smartphone,
    title: 'Mobile Friendly',
    description: 'Access the platform on supported mobile devices.'
  }
];

function AboutUs() {
  return (
    <>
      <PageTitle
        eyebrow="ABOUT OUR PLATFORM"
        title="About ExpenseNest"
        description="A simple and organized way to understand and manage everyday money."
      />

      <section className="about-highlight">
        <div className="about-highlight-icon">
          <Wallet size={32} />
        </div>
        <h2>Your Money. Your Control.</h2>
        <p>
          ExpenseNest is a personal expense management platform
          designed to help people organize their income, expenses,
          budgets and savings goals in one place.
        </p>
      </section>

      <div className="about-columns">
        <section className="about-info-card">
          <Target size={25} />
          <h2>Our Mission</h2>
          <p>
            To make everyday money management easier through
            simple, accessible and useful tools.
          </p>
        </section>

        <section className="about-info-card">
          <Eye size={25} />
          <h2>Our Vision</h2>
          <p>
            To help people build better financial awareness
            and make more informed everyday decisions.
          </p>
        </section>
      </div>

      <section className="info-section">
        <h2>What ExpenseNest Offers</h2>

        <div className="feature-grid">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div className="feature-card" key={feature.title}>
                <Icon size={23} />
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="about-founder">
        <h2>Created By</h2>
        <h3>Azaz Khan</h3>
        <p>Founder & Creator of ExpenseNest</p>
      </section>
    </>
  );
}

function ContactUs() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState(null);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setFeedbackNotice({ type: 'error', text: error.message });
        setSession(data?.session || null);
        setAuthLoading(false);
      })
      .catch((error) => {
        if (!active) return;
        setFeedbackNotice({ type: 'error', text: error.message || 'Could not check your sign-in status.' });
        setAuthLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function submitFeedback(event) {
    event.preventDefault();
    setFeedbackNotice(null);

    const cleanMessage = message.trim();
    if (cleanMessage.length < 10) {
      setFeedbackNotice({ type: 'error', text: 'Please write at least 10 characters so we can understand your feedback.' });
      return;
    }
    if (!session?.user?.id) {
      setFeedbackNotice({ type: 'error', text: 'Please sign in before sending feedback.' });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from('feedback_messages').insert({
        user_id: session.user.id,
        user_email: session.user.email || null,
        category,
        message: cleanMessage,
      });

      if (error) throw error;

      setMessage('');
      setCategory('general');
      setFeedbackNotice({ type: 'success', text: 'Thanks! Your feedback has been sent to the ExpenseNest team.' });
    } catch (error) {
      setFeedbackNotice({ type: 'error', text: error.message || 'Could not send feedback. Please try again.' });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <PageTitle
        eyebrow="WE ARE HERE TO HELP"
        title="Contact Us"
        description="Have a question, suggestion or feedback? We'd be happy to hear from you."
      />

      <div className="contact-card">
        <div className="contact-icon">
          <Mail size={30} />
        </div>

        <h2>Get in Touch</h2>
        <p>
          For questions, feedback or technical support,
          you can reach ExpenseNest through email.
        </p>

        <a
          className="contact-email-button"
          href={`mailto:${SUPPORT_EMAIL}`}
        >
          <Mail size={18} />
          {SUPPORT_EMAIL}
        </a>

        <p className="contact-note">
          Please include a short description of your question
          so we can understand how to help.
        </p>
      </div>

      <section className="contact-feedback-card">
        <div className="contact-feedback-heading">
          <span className="contact-feedback-icon"><MessageSquareText size={20} /></span>
          <div>
            <h2>Send feedback</h2>
            <p>Share an idea, report a problem, or tell us what could work better.</p>
          </div>
        </div>

        {authLoading ? (
          <div className="contact-feedback-loading"><LoaderCircle size={17} /> Checking your account…</div>
        ) : !session?.user?.id ? (
          <div className="contact-feedback-signin">
            <p>Sign in to send feedback from this form. Your account email will be attached when available.</p>
            <a href="/">Go to sign in</a>
          </div>
        ) : (
          <>
            <p className="contact-feedback-account">Sending as <strong>{session.user.email || 'your ExpenseNest account'}</strong></p>
            <form className="contact-feedback-form" onSubmit={submitFeedback}>
              <label>
                Feedback type
                <select value={category} onChange={(event) => setCategory(event.target.value)} disabled={sending}>
                  <option value="general">General feedback</option>
                  <option value="idea">Feature idea</option>
                  <option value="bug">Report a problem</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                Your message
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Tell us what happened or what you would like to see…"
                  rows={5}
                  minLength={10}
                  maxLength={2000}
                  required
                  disabled={sending}
                />
                <small className="contact-feedback-counter">{message.length}/2000 characters</small>
              </label>
              <p className="contact-feedback-privacy">Your message and account email are stored for the team to review. Please do not include passwords, bank details or other sensitive financial information.</p>
              {feedbackNotice && (
                <div className={`contact-feedback-notice ${feedbackNotice.type}`} role={feedbackNotice.type === 'error' ? 'alert' : 'status'}>
                  {feedbackNotice.type === 'success' ? <CircleCheck size={17} /> : <CircleAlert size={17} />}
                  <span>{feedbackNotice.text}</span>
                </div>
              )}
              <button type="submit" className="contact-feedback-submit" disabled={sending}>
                {sending ? <><LoaderCircle size={16} className="contact-feedback-spinner" /> Sending…</> : <><Send size={16} /> Send feedback</>}
              </button>
            </form>
          </>
        )}
      </section>

      <section className="contact-extra">
        <h2>We Welcome Your Feedback</h2>
        <p>
          Your suggestions can help us improve ExpenseNest
          and make money management easier for everyone.
        </p>
      </section>
    </>
  );
}

function NotFound() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you are looking for does not exist.</p>
      <a href="/">Return to ExpenseNest</a>
    </div>
  );
}

export default function InfoPages() {
  const path =
    window.location.pathname.replace(/\/+$/, '') || '/';

  let content;

  if (path === '/privacy-policy') {
    content = <PrivacyPolicy />;
  } else if (path === '/about') {
    content = <AboutUs />;
  } else if (path === '/contact') {
    content = <ContactUs />;
  } else {
    content = <NotFound />;
  }

  return (
    <div className="info-page">
      <Header />

      <main className="info-container">
        {content}
      </main>

      <footer className="info-footer">
        <div className="info-footer-brand">
          <Wallet size={19} />
          ExpenseNest
        </div>
        <p>Your Money. Your Control.</p>
        <span>
          © {new Date().getFullYear()} ExpenseNest. All Rights Reserved.
        </span>
      </footer>
    </div>
  );
}
