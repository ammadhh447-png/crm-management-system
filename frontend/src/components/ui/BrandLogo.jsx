import { Layers } from 'lucide-react';

const sizes = {
  sm: { box: 'h-8 w-8', icon: 'h-4 w-4', title: 'text-sm', subtitle: 'text-[10px]' },
  md: { box: 'h-10 w-10', icon: 'h-5 w-5', title: 'text-base', subtitle: 'text-xs' },
  lg: { box: 'h-12 w-12', icon: 'h-6 w-6', title: 'text-lg', subtitle: 'text-sm' },
};

const BrandLogo = ({ size = 'md', variant = 'dark', showText = true, fullName = true, className = '' }) => {
  const s = sizes[size];
  const isDark = variant === 'dark';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`${s.box} relative flex shrink-0 items-center justify-center rounded-xl shadow-lg ${
          isDark
            ? 'bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 shadow-blue-500/25'
            : 'bg-gradient-to-br from-slate-800 to-slate-900 shadow-slate-900/20'
        }`}
      >
        <div className={`absolute inset-0 rounded-xl ${isDark ? 'bg-white/10' : 'bg-white/5'}`} />
        <Layers className={`${s.icon} relative text-white`} strokeWidth={2.25} />
      </div>
      {showText && (
        <div className="min-w-0">
          <p className={`${s.title} font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {fullName ? 'CRM Management System' : 'CRM'}
          </p>
          {fullName && (
            <p className={`${s.subtitle} ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Customer Relationship Platform
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
