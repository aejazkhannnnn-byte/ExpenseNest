
import { ShieldCheck } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="website-footer">
      <div className="website-footer-inner">
        <span>
          © {new Date().getFullYear()} ExpenseNest. All rights reserved.
        </span>

        <a href="/admin" className="website-admin-link">
          <ShieldCheck size={15} />
          Admin Login
        </a>
      </div>
    </footer>
  );
}
