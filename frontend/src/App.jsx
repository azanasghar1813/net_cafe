import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { FileText, Download, Users, Monitor, Settings as SettingsIcon, Printer, CheckSquare, Search, Wallet, BarChart, User, ChevronRight, ShoppingCart } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Gaming from './pages/Gaming';
import Customers from './pages/Customers';
import BillingModal from './components/BillingModal';
import Accounts from './pages/Accounts';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Transactions from './pages/Transactions';
import POS from './pages/POS';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import logoUrl from './assets/logo.png';
import api from './api';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ customers: [], transactions: [] });
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 0) {
        api.get(`/search?q=${query}`).then(res => {
          setResults(res.data);
          setIsOpen(true);
        }).catch(console.error);
      } else {
        setIsOpen(false);
        setResults({ customers: [], transactions: [] });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectCustomer = (id) => {
    navigate('/customers');
    setIsOpen(false);
    setQuery('');
  };

  const handleSelectTransaction = (id) => {
    navigate('/transactions');
    setIsOpen(false);
    setQuery('');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <BarChart size={18} /> },
    { name: 'Gaming', path: '/gaming', icon: <Monitor size={18} /> },
    { name: 'Customers', path: '/customers', icon: <Users size={18} /> },
    { name: 'Services (POS)', path: '/pos', icon: <ShoppingCart size={18} /> },
    { name: 'Accounts', path: '/accounts', icon: <Wallet size={18} /> },
    { name: 'Reports', path: '/reports', icon: <BarChart size={18} /> },
    { name: 'Settings', path: '/settings', icon: <SettingsIcon size={18} /> },
  ];

  return (
    <div className="bg-slate-900 px-6 py-3 flex items-center justify-between overflow-visible shrink-0 print:hidden shadow-md relative z-50">
      <div className="flex items-center gap-2 overflow-x-auto">
        <div className="flex items-center gap-2 mr-6 text-white font-bold text-lg shrink-0">
           <img src={logoUrl} className="w-8 h-8 object-contain" /> Greenway
        </div>
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.name} to={item.path} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap text-sm font-medium ${isActive ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
              {item.icon} {item.name}
            </Link>
          );
        })}
      </div>
      
      {/* Global Search */}
      <div className="relative w-72 shrink-0 ml-4" ref={wrapperRef}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-slate-400" />
        </div>
        <input 
          type="text" 
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Global Search..." 
          className="w-full bg-slate-800 border-none text-white placeholder-slate-400 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-slate-700 transition-all text-sm"
        />
        
        {isOpen && (results.customers.length > 0 || results.transactions.length > 0) && (
          <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden z-[100] max-h-96 overflow-y-auto">
            {results.customers.length > 0 && (
              <div>
                <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Customers</div>
                {results.customers.map(c => (
                  <button key={c.id} onClick={() => handleSelectCustomer(c.id)} className="w-full text-left px-4 py-3 hover:bg-emerald-50 flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg"><User size={16} /></div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.phone}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </button>
                ))}
              </div>
            )}
            
            {results.transactions.length > 0 && (
              <div>
                <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Transactions</div>
                {results.transactions.map(t => (
                  <button key={t.id} onClick={() => handleSelectTransaction(t.id)} className="w-full text-left px-4 py-3 hover:bg-emerald-50 flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg"><FileText size={16} /></div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">#{t.id} - {t.category}</p>
                        <p className="text-xs text-slate-500">{t.description}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                       <p className="font-bold text-emerald-600 text-sm">Rs. {t.amount}</p>
                       <ChevronRight size={16} className="text-slate-300" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const App = () => {

  return (
    <Router>
      <div className="flex flex-col h-[111.11vh] w-[111.11vw] bg-slate-50 overflow-hidden font-sans text-slate-900">
        <Navigation />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 relative">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/gaming" element={<Gaming />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/pos" element={<POS />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </ErrorBoundary>
          </div>
        </div>
      </div>
      <Toaster position="bottom-right" />
    </Router>
  );
};

const Placeholder = ({ title }) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center text-slate-500">
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p>This module will be developed in the next phase.</p>
    </div>
  </div>
);

export default App;
