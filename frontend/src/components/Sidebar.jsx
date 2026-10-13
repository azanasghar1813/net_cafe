import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Gamepad2, Users, Printer, Globe, FileText, Receipt, Wallet, BarChart3, Settings } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { name: 'Gaming', icon: <Gamepad2 size={20} />, path: '/gaming' },
    { name: 'Customers', icon: <Users size={20} />, path: '/customers' },
    { name: 'Printing & Scanning', icon: <Printer size={20} />, path: '/printing' },
    { name: 'Online Services', icon: <Globe size={20} />, path: '/online' },
    { name: 'CV / Resume', icon: <FileText size={20} />, path: '/cv' },
    { name: 'Billing', icon: <Receipt size={20} />, path: '/billing' },
    { name: 'Accounts', icon: <Wallet size={20} />, path: '/accounts' },
    { name: 'Reports', icon: <BarChart3 size={20} />, path: '/reports' },
    { name: 'Settings', icon: <Settings size={20} />, path: '/settings' },
  ];

  return (
    <div className="w-64 h-full bg-slate-900 text-slate-300 flex flex-col shadow-xl">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white tracking-wider">NET CAFE</h1>
        <p className="text-xs text-slate-500 mt-1 uppercase">Management System</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-3 transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white border-l-4 border-blue-400'
                      : 'hover:bg-slate-800 hover:text-white border-l-4 border-transparent'
                  }`
                }
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 bg-slate-950/50 text-xs text-center text-slate-500">
        Phase 1 - v1.0.0
      </div>
    </div>
  );
};

export default Sidebar;
