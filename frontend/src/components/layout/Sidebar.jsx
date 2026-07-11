import { NavLink } from 'react-router-dom';
import BrandLogo from '../ui/BrandLogo';
import {
  LayoutDashboard, Users, Contact, Kanban, CheckSquare,
  MessageSquare, FileText, BarChart3, Settings, Activity,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import UserAvatar from '../ui/UserAvatar';

const navItems = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, permission: 'dashboard:view' },
  { to: '/reports', labelKey: 'nav.reports', icon: BarChart3, permission: 'reports:view' },
  { to: '/contacts', labelKey: 'nav.contacts', icon: Contact, permission: 'contacts:view' },
  { to: '/deals', labelKey: 'nav.deals', icon: Kanban, permission: 'deals:view' },
  { to: '/tasks', labelKey: 'nav.tasks', icon: CheckSquare, permission: 'tasks:view' },
  { to: '/communications', labelKey: 'nav.communications', icon: MessageSquare, permission: 'communications:view' },
  { to: '/documents', labelKey: 'nav.documents', icon: FileText, permission: 'documents:view' },
  { to: '/users', labelKey: 'nav.users', icon: Users, permission: 'users:view' },
  { to: '/activity', labelKey: 'nav.activity', icon: Activity, permission: 'activity:view' },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings, permission: 'profile:view' },
];

const Sidebar = ({ mobile, onClose }) => {
  const { hasPermission, user, displayUser } = useAuth();
  const { t } = useLanguage();

  const visibleItems = navItems.filter((i) => !i.permission || hasPermission(i.permission));

  return (
    <aside className={`flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white ${mobile ? '' : 'hidden lg:flex'}`}>
      <div className="flex h-16 items-center border-b border-slate-200 px-5">
        <BrandLogo size="sm" variant="light" fullName={false} />
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} onClick={onClose} className={({ isActive }) => (isActive ? 'nav-item-active' : 'nav-item-inactive')}>
                <item.icon className="h-4 w-4 shrink-0" />
                {t(item.labelKey)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
          <UserAvatar user={displayUser || user} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{user?.fullName}</p>
            <p className="truncate text-xs text-slate-500">{user?.roleLabel}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
