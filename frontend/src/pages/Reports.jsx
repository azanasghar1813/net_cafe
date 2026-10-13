import React, { useState, useEffect } from 'react';
import api from '../api';
import { FileBarChart, Calendar, Download, Printer } from 'lucide-react';
import { formatCurrency } from '../utils/format';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('daily');
  
  // Daily State
  const [dailySales, setDailySales] = useState({ transactions: [], totals: {} });
  
  // Monthly State
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [monthlyData, setMonthlyData] = useState(null);

  // Custom Range State
  const [dateRange, setDateRange] = useState({ start: new Date().toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) });
  const [customData, setCustomData] = useState(null);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDaily();
    } else if (activeTab === 'monthly') {
      fetchMonthly();
    } else if (activeTab === 'custom') {
      fetchCustom();
    }
  }, [activeTab, selectedMonth, dateRange]);

  const fetchDaily = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard');
      const txRes = await api.get('/transactions/today');
      setDailySales({ transactions: txRes.data || [], totals: res.data.todaySales || {} });
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchMonthly = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/monthly?month=${selectedMonth}`);
      setMonthlyData(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchCustom = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/custom?start=${dateRange.start}&end=${dateRange.end}`);
      setCustomData(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 h-full flex flex-col animate-in fade-in duration-500 w-full">
      <div className="flex justify-between items-end print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Shop Reports</h1>
          <p className="text-slate-500 mt-1">Analyze daily sales and monthly performance.</p>
        </div>
        <button onClick={() => window.print()} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-bold flex items-center gap-2">
          <Printer size={18} /> Print / Export
        </button>
      </div>

      <div className="flex gap-4 border-b border-slate-200 print:hidden">
        <button 
          onClick={() => setActiveTab('daily')}
          className={`pb-4 px-4 font-bold transition-colors ${activeTab === 'daily' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Daily Sales
        </button>
        <button 
          onClick={() => setActiveTab('monthly')}
          className={`pb-4 px-4 font-bold transition-colors ${activeTab === 'monthly' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Monthly Report
        </button>
        <button 
          onClick={() => setActiveTab('custom')}
          className={`pb-4 px-4 font-bold transition-colors ${activeTab === 'custom' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Custom Date Range
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading Report...</div>
      ) : activeTab === 'daily' ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm" id="printable-report">
            <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Today's Transactions</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 text-sm border-b border-slate-100">
                    <th className="pb-3 font-medium">Receipt #</th>
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Details</th>
                    <th className="pb-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailySales.transactions.length === 0 ? (
                    <tr><td colSpan="6" className="py-4 text-center text-slate-500">No transactions today</td></tr>
                  ) : (
                    dailySales.transactions.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="py-3 font-mono text-slate-600">#{t.id}</td>
                        <td className="py-3 text-slate-600">{new Date(t.date + (t.date.endsWith('Z') ? '' : 'Z')).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            t.type === 'SALE' ? 'bg-emerald-100 text-emerald-700' : 
                            t.type === 'EXPENSE' ? 'bg-rose-100 text-rose-700' : 
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="py-3 font-medium text-slate-700">{t.category}</td>
                        <td className="py-3 text-sm text-slate-500">{t.description}</td>
                        <td className={`py-3 text-right font-bold ${t.type === 'EXPENSE' ? 'text-rose-600' : 'text-slate-800'}`}>
                          {t.type === 'EXPENSE' ? '-' : ''}Rs. {formatCurrency(t.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'monthly' ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-6 print:hidden">
            <label className="font-medium text-slate-700 flex items-center gap-2">
              <Calendar size={18} /> Select Month:
            </label>
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(e.target.value)} 
              className="p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm" id="printable-report">
            <div className="text-center mb-8 pb-8 border-b border-slate-100">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Monthly Financial Report</h2>
              <p className="text-slate-500 text-lg">For the month of {new Date(selectedMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
            </div>

            {monthlyData && (
              <div className="space-y-8">
                {/* Highlights */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-center">
                    <p className="text-slate-500 font-medium mb-1">Total Sales</p>
                    <p className="text-3xl font-bold text-emerald-600">Rs. {formatCurrency(monthlyData.totalSales)}</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-center">
                    <p className="text-slate-500 font-medium mb-1">Total Expenses</p>
                    <p className="text-3xl font-bold text-rose-600">Rs. {formatCurrency(monthlyData.totalExpenses)}</p>
                  </div>
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center">
                    <p className="text-blue-600 font-medium mb-1">Net Profit</p>
                    <p className="text-3xl font-bold text-blue-800">Rs. {formatCurrency(monthlyData.netProfit)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  {/* Revenue Breakdown */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <FileBarChart size={18} className="text-blue-600" /> Revenue Breakdown
                    </h3>
                    <div className="space-y-3 bg-slate-50 p-6 rounded-xl border border-slate-100">
                      {Object.entries(monthlyData.categoryRevenue).map(([category, amount]) => (
                        <div key={category} className="flex justify-between items-center border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                          <span className="font-medium text-slate-700">{category}</span>
                          <span className="font-bold text-slate-800">Rs. {formatCurrency(amount)}</span>
                        </div>
                      ))}
                      {Object.keys(monthlyData.categoryRevenue).length === 0 && (
                        <p className="text-slate-500 text-sm">No sales data for this month.</p>
                      )}
                    </div>
                  </div>

                  {/* KPIs */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Key Metrics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-500 font-medium">Total Transactions</p>
                        <p className="text-xl font-bold text-slate-800">{monthlyData.totalTransactions}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-500 font-medium">Unique Customers</p>
                        <p className="text-xl font-bold text-slate-800">{monthlyData.totalCustomers}</p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                        <p className="text-xs text-orange-600 font-medium">Udhaar Given</p>
                        <p className="text-xl font-bold text-orange-800">Rs. {formatCurrency(monthlyData.udhaarGiven)}</p>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                        <p className="text-xs text-emerald-600 font-medium">Udhaar Collected</p>
                        <p className="text-xl font-bold text-emerald-800">Rs. {formatCurrency(monthlyData.udhaarCollected)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-6 print:hidden">
            <label className="font-medium text-slate-700 flex items-center gap-2">
              <Calendar size={18} /> Start Date:
            </label>
            <input 
              type="date" 
              value={dateRange.start} 
              onChange={e => setDateRange({...dateRange, start: e.target.value})} 
              className="p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <label className="font-medium text-slate-700 flex items-center gap-2 ml-4">
              End Date:
            </label>
            <input 
              type="date" 
              value={dateRange.end} 
              onChange={e => setDateRange({...dateRange, end: e.target.value})} 
              className="p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm" id="printable-report">
            <div className="text-center mb-8 pb-8 border-b border-slate-100">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Custom Financial Report</h2>
              <p className="text-slate-500 text-lg">{new Date(dateRange.start).toLocaleDateString()} to {new Date(dateRange.end).toLocaleDateString()}</p>
            </div>

            {customData && (
              <div className="space-y-8">
                {/* Highlights */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-center">
                    <p className="text-slate-500 font-medium mb-1">Total Sales</p>
                    <p className="text-3xl font-bold text-emerald-600">Rs. {formatCurrency(customData.totalSales)}</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-center">
                    <p className="text-slate-500 font-medium mb-1">Total Expenses</p>
                    <p className="text-3xl font-bold text-rose-600">Rs. {formatCurrency(customData.totalExpenses)}</p>
                  </div>
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center">
                    <p className="text-blue-600 font-medium mb-1">Net Profit</p>
                    <p className="text-3xl font-bold text-blue-800">Rs. {formatCurrency(customData.netProfit)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  {/* Revenue Breakdown */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <FileBarChart size={18} className="text-blue-600" /> Revenue Breakdown
                    </h3>
                    <div className="space-y-3 bg-slate-50 p-6 rounded-xl border border-slate-100">
                      {Object.entries(customData.categoryRevenue).map(([category, amount]) => (
                        <div key={category} className="flex justify-between items-center border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                          <span className="font-medium text-slate-700">{category}</span>
                          <span className="font-bold text-slate-800">Rs. {formatCurrency(amount)}</span>
                        </div>
                      ))}
                      {Object.keys(customData.categoryRevenue).length === 0 && (
                        <p className="text-slate-500 text-sm">No sales data for this period.</p>
                      )}
                    </div>
                  </div>

                  {/* KPIs */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Key Metrics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-500 font-medium">Total Transactions</p>
                        <p className="text-xl font-bold text-slate-800">{customData.totalTransactions}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-500 font-medium">Unique Customers</p>
                        <p className="text-xl font-bold text-slate-800">{customData.totalCustomers}</p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                        <p className="text-xs text-orange-600 font-medium">Udhaar Given</p>
                        <p className="text-xl font-bold text-orange-800">Rs. {formatCurrency(customData.udhaarGiven)}</p>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                        <p className="text-xs text-emerald-600 font-medium">Udhaar Collected</p>
                        <p className="text-xl font-bold text-emerald-800">Rs. {formatCurrency(customData.udhaarCollected)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Print CSS for Reports */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; border: none; }
        }
      `}</style>
    </div>
  );
};

export default Reports;
