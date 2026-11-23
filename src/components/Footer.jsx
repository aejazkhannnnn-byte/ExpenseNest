
import { ShieldCheck } from 'lucide-react';
import BrandAsset from './BrandAsset.jsx';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="website-footer">
      <div className="website-footer-inner">

        <div className="footer-brand">
          <div className="footer-logo"><BrandAsset /></div>
          <span>ExpenseNest</span>
        </div>

        <nav className="footer-links">
          <a href="/about">About Us</a>
          <a href="/privacy-policy">Privacy Policy</a>
          <a href="/contact">Contact Us</a>
          <a href="/admin" className="website-admin-link">
            <ShieldCheck size={15} />
            Admin Login
          </a>
        </nav>

        <div className="footer-copyright">
          © {new Date().getFullYear()} ExpenseNest. All rights reserved.
        </div>

      </div>
    </footer>
  );
}
