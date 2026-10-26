import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus, FileText, CheckCircle,
  Shield, Bell, BarChart3, History, HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const institutionNav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/applications/new', icon: FilePlus, label: 'New Application' },
  { to: '/applications', icon: FileText, label: 'My Applications' },
  { to: '/validation', icon: CheckCircle, label: 'Validation Results' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/audit', icon: History, label: 'Audit Trail' },
  { to: '/help', icon: HelpCircle, label: 'Help & Guidelines' },
];

const officerNav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/officer/review', icon: Shield, label: 'Officer Review' },
  { to: '/applications', icon: FileText, label: 'All Applications' },
  { to: '/validation', icon: CheckCircle, label: 'Validation Results' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/reports', icon: BarChart3, label: 'Reports & Analytics' },
  { to: '/audit', icon: History, label: 'Audit Trail' },
  { to: '/help', icon: HelpCircle, label: 'Help & Guidelines' },
];

export default function Sidebar() {
  const { isOfficer } = useAuth();
  const navItems = isOfficer ? officerNav : institutionNav;

  return (
    <aside className="w-60 bg-navy min-h-[calc(100vh-90px)] flex flex-col shrink-0">
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <item.icon size={17} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Integration Status Footer */}
      <div className="p-3 border-t border-white/10">
        <div className="px-3 py-2 bg-white/5 rounded text-xs">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
            <span>Integration: Demo Mode</span>
          </div>
          <p className="text-gray-500 text-[10px] leading-tight">
            Live AICTE Connection: Not Configured
          </p>
        </div>
      </div>
    </aside>
  );
}
