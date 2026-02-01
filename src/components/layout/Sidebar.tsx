import {
  BarChart3,
  Building2,
  CalendarClock,
  CalendarDays,
  CreditCard,
  FileText,
  Home,
  LayoutDashboard,
  Settings,
  Shield,
  TrendingUp,
  Users,
  UsersRound,
  Wallet,
  X
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/budget', icon: Wallet, label: 'Budget' },
  { to: '/monthly-tracker', icon: CalendarDays, label: 'Monthly Tracker' },
  { to: '/schedules', icon: CalendarClock, label: 'Schedules' },
  { to: '/accounts', icon: Building2, label: 'Accounts' },
  { to: '/loans', icon: CreditCard, label: 'Loans & EMI' },
  { to: '/investments', icon: TrendingUp, label: 'Investments' },
  { to: '/insurance', icon: Shield, label: 'Insurance' },
  { to: '/lending', icon: Users, label: 'Lending' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/family', icon: UsersRound, label: 'Family' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 w-64 bg-slate-900 h-screen flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
      {/* Logo */}
      <div className="p-4 sm:p-6 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-white text-sm sm:text-base truncate">Family Finance</h1>
              <p className="text-xs text-slate-400">Expense Tracker</p>
            </div>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => {
              // Close sidebar on mobile when a link is clicked
              if (onClose) {
                onClose();
              }
            }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-xl transition-all duration-200 min-h-[44px] ${isActive
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 sm:p-4 border-t border-slate-800">
        <div className="text-xs text-slate-500 text-center">
          v1.6.0 • Jan 2026
        </div>
      </div>
    </aside>
    </>
  );
}
