import { CheckCircle2 } from 'lucide-react';
import BrandLogo from '../ui/BrandLogo';

const features = [
  'Contact & lead management',
  'Sales pipeline tracking',
  'Tasks, reports & analytics',
];

const AuthLayout = ({ children, title, subtitle, compact = false }) => (
  <div className={`auth-page ${compact ? 'auth-page-compact' : ''}`}>
    <div className="auth-panel">
      <div className="auth-grid" aria-hidden="true" />
      <div className="auth-panel-inner">
        <BrandLogo size="lg" variant="dark" fullName />

        <div className="auth-shapes" aria-hidden="true">
          <div className="auth-shape auth-shape-1" />
          <div className="auth-shape auth-shape-2" />
          <div className="auth-shape auth-shape-3" />
        </div>

        <div className="auth-panel-content">
          <h2 className="auth-tagline">Grow relationships.<br />Close more deals.</h2>
          <p className="auth-description">
            CRM Management System helps your team manage contacts, pipelines, tasks, and communications in one modern workspace.
          </p>
          <ul className="auth-features">
            {features.map((item) => (
              <li key={item} className="auth-feature-item">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="auth-footer">&copy; {new Date().getFullYear()} CRM Management System</p>
      </div>
    </div>

    <div className="auth-form-side">
      <div className="auth-form-container">
        <div className="auth-mobile-brand lg:hidden">
          <BrandLogo size="md" variant="light" fullName />
        </div>

        <div className={`auth-form-card ${compact ? 'auth-form-card-compact' : ''}`}>
          <div className={`auth-form-header ${compact ? 'auth-form-header-compact' : ''}`}>
            <h1 className="auth-form-title">{title}</h1>
            {subtitle && <p className="auth-form-subtitle">{subtitle}</p>}
          </div>
          <div className="auth-form-body">{children}</div>
        </div>
      </div>
    </div>
  </div>
);

export default AuthLayout;
