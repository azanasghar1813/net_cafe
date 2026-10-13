import React, { useState, useEffect } from 'react';
import api from '../api';
import { Wallet, TrendingDown, Plus, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/format';

const Accounts = () => {
  const [register, setRegister] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [openingCash, setOpeningCash] = useState('');
  const [closingCash, setClosingCash] = useState('');
  
  const [expenseForm, setExpenseForm] = useState({ category: '', description: '', amount: '' });
  const expenseCategories = ['Electricity', 'Internet', 'Rent', 'Computer Repair', 'Stationery', 'Staff Salary', 'Other'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [regRes, expRes] = await Promise.all([
        api.get('/cash-register/today'),
        api.get('/expenses/today')
      ]);
      setRegister(regRes.data);
      setExpenses(expRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleOpenRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cash-register/open', { opening_cash: Number(openingCash) });
      toast.success("Register opened successfully");
      fetchData();
    } catch (err) {
      toast.error("Failed to open register");
    }
  };

  const handleCloseRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/cash-register/close', { actual_cash: Number(closingCash) });
      toast.success(`Register Closed! Difference: Rs. ${formatCurrency(res.data.difference)}`, { duration: 5000 });
      fetchData();
    } catch (err) {
      toast.error("Failed to close register");
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', {
        category: expenseForm.category,
        description: expenseForm.description,
        amount: Number(expenseForm.amount)
      });
      toast.success("Expense added");
      setExpenseForm({ category: '', description: '', amount: '' });
      fetchData();
    } catch (err) {
      toast.error("Failed to add expense");
    }
  };

  if (loading) return <div className="p-8">Loading Accounts...</div>;
  if (!register) return <div className="p-8">Couldn't load register data.</div>;

  return (
    <div className="space-y-8 h-full flex flex-col animate-in fade-in duration-500 w-full">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Accounts & Cash Register</h1>
        <p className="text-slate-500 mt-1">Manage daily cash flow and track shop expenses.</p>
      </div>

      <div className="flex gap-8">
        {/* Left Column: Cash Register */}
        <div className="w-1/2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                <Wallet size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Cash Register</h2>
                <p className="text-sm text-slate-500">
                  {register.status === 'NONE' ? 'Register is not open for today' : `Status: ${register.status}`}
                </p>
              </div>
            </div>

            {register.status === 'NONE' && (
              <form onSubmit={handleOpenRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Opening Cash (Rs.)</label>
                  <input 
                    type="number" 
                    required min="0"
                    value={openingCash} 
                    onChange={e => setOpeningCash(e.target.value)} 
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                  />
                </div>
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2">
                  <CheckCircle2 size={18} /> Open Register
                </button>
              </form>
            )}

            {register.status === 'OPEN' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-500 font-medium">Opening Cash</p>
                    <p className="text-2xl font-bold text-slate-800">Rs. {formatCurrency(register.opening_cash)}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-sm text-blue-600 font-medium">Expected Cash</p>
                    <p className="text-2xl font-bold text-blue-800">Auto-calculated</p>
                    <p className="text-xs text-blue-500 mt-1">Based on sales & expenses</p>
                  </div>
                </div>

                <form onSubmit={handleCloseRegister} className="space-y-4 pt-4 border-t border-slate-100">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Actual Cash at Closing (Rs.)</label>
                    <input 
                      type="number" 
                      required min="0"
                      value={closingCash} 
                      onChange={e => setClosingCash(e.target.value)} 
                      className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-xl" 
                    />
                  </div>
                  <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2">
                    Close Register
                  </button>
                </form>
              </div>
            )}

            {register.status === 'CLOSED' && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Expected Cash</span>
                  <span className="font-bold text-slate-800">Rs. {formatCurrency(register.expected_cash)}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Actual Cash</span>
                  <span className="font-bold text-slate-800">Rs. {formatCurrency(register.actual_cash)}</span>
                </div>
                <div className={`p-4 rounded-xl border flex justify-between items-center ${register.difference === 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                  <span className="font-medium">Difference</span>
                  <span className="font-bold">Rs. {formatCurrency(register.difference)}</span>
                </div>
                <p className="text-center text-sm text-slate-500 mt-4">Register is closed for today. Come back tomorrow.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Expenses */}
        <div className="w-1/2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                <TrendingDown size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Add Expense</h2>
                <p className="text-sm text-slate-500">Record money leaving the shop.</p>
              </div>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <input 
                    type="text"
                    required
                    list="expense-categories"
                    value={expenseForm.category} 
                    onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} 
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                    placeholder="e.g. Electricity, Food, Repair..."
                  />
                  <datalist id="expense-categories">
                    {expenseCategories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (Rs.)</label>
                  <input 
                    type="number" 
                    required min="1"
                    value={expenseForm.amount} 
                    onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} 
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                <input 
                  type="text" 
                  value={expenseForm.description} 
                  onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} 
                  placeholder="Details..."
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none" 
                />
              </div>
              <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2">
                <Plus size={18} /> Record Expense
              </button>
            </form>
          </div>

          {/* Today's Expenses List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Today's Expenses</h3>
            {expenses.length === 0 ? (
              <p className="text-sm text-slate-500">No expenses recorded today.</p>
            ) : (
              <div className="space-y-3">
                {expenses.map(exp => (
                  <div key={exp.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors">
                    <div>
                      <p className="font-bold text-slate-700">{exp.category}</p>
                      {exp.description && <p className="text-xs text-slate-500">{exp.description}</p>}
                    </div>
                    <span className="font-bold text-rose-600">- Rs. {formatCurrency(exp.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accounts;
