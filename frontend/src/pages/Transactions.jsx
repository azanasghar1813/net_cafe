import React, { useState, useEffect } from 'react';
import api from '../api';
import { Search, Ban, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/format';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voidReason, setVoidReason] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleVoid = async (e) => {
    e.preventDefault();
    if (!voidReason.trim()) return toast.error("Reason is required");
    try {
      await api.post(`/transactions/${selectedTx.id}/void`, { reason: voidReason });
      toast.success("Transaction voided successfully");
      setVoidReason('');
      setSelectedTx(null);
      fetchTransactions();
    } catch (err) {
      toast.error("Failed to void transaction: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="space-y-8 h-full flex flex-col animate-in fade-in duration-500 w-full">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Transaction History</h1>
        <p className="text-slate-500 mt-1">View all recent transactions and manage voids.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-sm border-b border-slate-100 bg-slate-50">
                <th className="p-4 font-medium rounded-tl-xl">Receipt #</th>
                <th className="p-4 font-medium">Date & Time</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium text-right rounded-tr-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map(t => (
                <tr key={t.id} className={`hover:bg-slate-50 transition-colors ${t.status === 'VOIDED' ? 'opacity-60 bg-slate-50' : ''}`}>
                  <td className="p-4 font-mono text-slate-600">#{t.id}</td>
                  <td className="p-4 text-slate-600">
                    {new Date(t.date + (t.date.endsWith('Z') ? '' : 'Z')).toLocaleDateString()} <span className="text-xs">{new Date(t.date + (t.date.endsWith('Z') ? '' : 'Z')).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </td>
                  <td className="p-4 font-medium text-slate-700">
                    {t.customer_name || 'Walk-in'}
                  </td>
                  <td className="p-4 text-slate-700">
                    {t.type === 'EXPENSE' ? 'Expense' : t.category}
                  </td>
                  <td className="p-4">
                    {t.status === 'VOIDED' ? (
                      <span className="px-2 py-1 bg-slate-200 text-slate-600 rounded text-xs font-bold" title={t.void_reason}>
                        VOIDED
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">
                        ACTIVE
                      </span>
                    )}
                  </td>
                  <td className={`p-4 font-bold ${t.type === 'EXPENSE' ? 'text-rose-600' : 'text-slate-800'}`}>
                    Rs. {formatCurrency(t.amount)}
                  </td>
                  <td className="p-4 text-right">
                    {t.status === 'ACTIVE' && (
                      <button 
                        onClick={() => setSelectedTx(t)}
                        className="px-3 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-sm font-bold transition-colors"
                      >
                        Void
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTx && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in zoom-in duration-200">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Ban className="text-rose-500" /> Void Transaction
            </h2>
            <p className="text-slate-500 mb-6">
              You are about to void Receipt <strong>#{selectedTx.id}</strong> for <strong>Rs. {formatCurrency(selectedTx.amount)}</strong>. 
              This will automatically reverse any Udhaar or Cash Register totals associated with it.
            </p>
            
            <form onSubmit={handleVoid}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Voiding</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  placeholder="e.g. Wrong amount entered"
                  value={voidReason} 
                  onChange={e => setVoidReason(e.target.value)} 
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none" 
                />
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setSelectedTx(null)} className="flex-1 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold">
                  Confirm Void
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
