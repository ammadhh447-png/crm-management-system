import { Link, useLocation } from 'react-router-dom';
import { LEGAL_NAV } from '../../data/legalContent';

const Footer = () => {
  const { pathname } = useLocation();

  return (
    <footer className="z-20 shrink-0 border-t border-slate-200 bg-white">
      <div className="flex h-14 flex-col items-center justify-between gap-2 px-4 sm:h-12 sm:flex-row lg:px-6">
        <p className="text-xs text-slate-500 sm:text-sm">
          &copy; {new Date().getFullYear()} CRM Management System. All rights reserved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-1">
          {LEGAL_NAV.map((item, index) => (
            <span key={item.key} className="flex items-center gap-1">
              {index > 0 && <span className="text-slate-300">|</span>}
              <Link
                to={item.path}
                className={`rounded-md px-2.5 py-1 text-sm transition-colors ${
                  pathname === item.path
                    ? 'font-semibold text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </Link>
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
