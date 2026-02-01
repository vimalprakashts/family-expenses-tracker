import {
  BarChart3,
  Building2,
  CalendarDays,
  LayoutDashboard,
  Settings
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const bottomNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/monthly-tracker', icon: CalendarDays, label: 'Tracker' },
  { to: '/accounts', icon: Building2, label: 'Accounts' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-gray-200 shadow-lg z-50 safe-area-inset-bottom">
      <div className="grid grid-cols-5 gap-1">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-2 px-1 min-h-[64px] transition-colors ${
                isActive
                  ? 'text-indigo-600'
                  : 'text-gray-500'
              }`
            }
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-[10px] sm:text-xs font-medium text-center">
              {item.label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
