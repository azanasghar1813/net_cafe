import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { Monitor, CreditCard, Users, Printer, CheckSquare, FileText, Wallet, Gamepad2, ArrowRight } from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!data) return <div className="p-8">Loading Dashboard...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Shop Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of today's shop performance and quick actions.</p>
      </div>

      {/* QUICK ACTIONS */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button onClick={() => navigate('/gaming')} className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-2xl font-bold transition-all shadow-sm hover:shadow-md flex flex-col items-center justify-center gap-3">
            <Gamepad2 size={32} />
            Start Gaming
          </button>
          
          <button onClick={() => navigate('/pos')} className="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 p-6 rounded-2xl font-bold transition-all shadow-sm flex flex-col items-center justify-center gap-3">
            <Printer size={32} className="text-blue-600" />
            Quick POS (Services)
          </button>
          
          <button onClick={() => navigate('/customers')} className="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 p-6 rounded-2xl font-bold transition-all shadow-sm flex flex-col items-center justify-center gap-3">
            <Users size={32} className="text-emerald-600" />
            New Customer
          </button>
          
          <button onClick={() => navigate('/accounts')} className="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 p-6 rounded-2xl font-bold transition-all shadow-sm flex flex-col items-center justify-center gap-3">
            <Wallet size={32} className="text-rose-600" />
            Add Expense
          </button>
        </div>
      </div>

      {/* MAIN KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 font-medium mb-1">Today's Sales</p>
            <p className="text-3xl font-bold text-emerald-600">Rs. {Number(data.todaySales || 0).toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
            <CreditCard size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 font-medium mb-1">Today's Expenses</p>
            <p className="text-3xl font-bold text-rose-600">Rs. {Number(data.expenses || 0).toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
            <CreditCard size={24} />
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl shadow-sm shadow-slate-200 flex items-center justify-between text-white">
          <div>
            <p className="text-slate-400 font-medium mb-1">Today's Net Profit</p>
            <p className="text-3xl font-bold">Rs. {Number(data.netProfit || 0).toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
            <Wallet size={24} className="text-blue-400" />
          </div>
        </div>
      </div>

      {/* DETAILED STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-1">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Revenue by Category</h2>
          <div className="space-y-4">
            {Object.keys(data.revenueByCategory).length > 0 ? Object.entries(data.revenueByCategory).map(([category, amount]) => (
              <div key={category} className="flex justify-between items-center border-b border-slate-50 pb-2 last:border-0">
                <span className="text-slate-600 font-medium">{category}</span>
                <span className="font-bold text-slate-800">Rs. {Number(amount || 0).toLocaleString()}</span>
              </div>
            )) : (
              <p className="text-sm text-slate-500 italic">No sales recorded yet today.</p>
            )}
          </div>
        </div>

        {/* PCs & Operations */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm md:col-span-2">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Operations Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3 text-slate-600">
                  <Monitor size={18} /> <span className="font-medium">Active PCs</span>
                </div>
                <span className="font-bold text-blue-600 text-lg">{data.pcsInUse} / {data.pcs.length}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3 text-slate-600">
                  <Users size={18} /> <span className="font-medium">Total Customers</span>
                </div>
                <span className="font-bold text-slate-800 text-lg">{data.totalCustomers || 0}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3 text-slate-600">
                  <FileText size={18} /> <span className="font-medium">Transactions Today</span>
                </div>
                <span className="font-bold text-slate-800 text-lg">{data.transactionsCount}</span>
              </div>
              
              {/* Quick Links */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button onClick={() => navigate('/pos')} className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 flex items-center justify-between">
                  Scanning Services <ArrowRight size={14} className="text-slate-400" />
                </button>
                <button onClick={() => navigate('/pos')} className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 flex items-center justify-between">
                  Online Services <ArrowRight size={14} className="text-slate-400" />
                </button>
                <button onClick={() => navigate('/pos')} className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 flex items-center justify-between col-span-2">
                  CV & Print Jobs <ArrowRight size={14} className="text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
