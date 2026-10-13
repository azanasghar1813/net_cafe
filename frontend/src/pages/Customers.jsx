import React, { useState, useEffect } from 'react';
import api from '../api';
import { UserPlus, UserCircle, Search, CreditCard, ChevronRight, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/format';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', cnic: '', address: '' });
  
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerHistory, setCustomerHistory] = useState([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const formatPhone = (val) => {
    let clean = val.replace(/\D/g, '');
    if (clean.length > 4) {
      return clean.substring(0, 4) + '-' + clean.substring(4, 11);
    }
    return clean;
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      await api.post('/customers', newCustomer);
      setNewCustomer({ name: '', phone: '', cnic: '', address: '' });
      setShowAddForm(false);
      fetchCustomers();
      toast.success("Customer added");
    } catch (err) {
      toast.error("Failed to add customer");
    }
  };

  const handleEditCustomer = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/customers/${selectedCustomer.id}`, newCustomer);
      setShowEditForm(false);
      fetchCustomers();
      setSelectedCustomer({...selectedCustomer, ...newCustomer});
      toast.success("Customer updated");
    } catch (err) {
      toast.error("Failed to update customer");
    }
  };

  const handleDeleteCustomer = async () => {
    if(!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      await api.delete(`/customers/${selectedCustomer.id}`);
      setSelectedCustomer(null);
      fetchCustomers();
      toast.success("Customer deleted");
    } catch (err) {
      toast.error("Failed to delete customer");
    }
  };

  const handleSelectCustomer = async (customer) => {
    setSelectedCustomer(customer);
    try {
      const res = await api.get(`/customers/${customer.id}/history`);
      setCustomerHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayUdhaar = async (e) => {
    e.preventDefault();
    const amount = Number(e.target.amount.value);
    if (amount > selectedCustomer.balance) {
      return toast.error("Amount cannot be greater than balance");
    }
    try {
      await api.post(`/customers/${selectedCustomer.id}/pay`, { amount });
      toast.success("Payment recorded!");
      fetchCustomers();
      handleSelectCustomer({ ...selectedCustomer, balance: selectedCustomer.balance - amount });
    } catch (err) {
      toast.error("Payment failed");
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.cnic && c.cnic.includes(searchTerm))
  );

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-500 w-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Customers</h1>
          <p className="text-slate-500 mt-1">Manage profiles and Udhaar balances.</p>
        </div>
        <button 
          onClick={() => { setNewCustomer({ name: '', phone: '', cnic: '', address: '' }); setShowAddForm(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2"
        >
          <UserPlus size={20} /> New Customer
        </button>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Customer List */}
        <div className="w-1/3 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search customers..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? <p className="text-center p-4 text-slate-500">Loading...</p> : 
             filteredCustomers.map(c => (
              <button 
                key={c.id}
                onClick={() => handleSelectCustomer(c)}
                className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors ${selectedCustomer?.id === c.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${selectedCustomer?.id === c.id ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                    <UserCircle size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.phone}</p>
                  </div>
                </div>
                {c.balance > 0 && <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">Rs. {formatCurrency(c.balance)}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Details */}
        <div className="w-2/3 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-y-auto p-6">
          {selectedCustomer ? (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <UserCircle className="text-blue-600" size={28} /> {selectedCustomer.name}
                  </h2>
                  <div className="mt-2 space-y-1">
                    <p className="text-slate-500 flex items-center gap-2">
                      <span className="font-medium w-16">Phone:</span> {selectedCustomer.phone || 'N/A'}
                    </p>
                    <p className="text-slate-500 flex items-center gap-2">
                      <span className="font-medium w-16">CNIC:</span> {selectedCustomer.cnic || 'N/A'}
                    </p>
                    <p className="text-slate-500 flex items-center gap-2">
                      <span className="font-medium w-16">Address:</span> {selectedCustomer.address || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 font-medium mb-1">Customer ID #{String(selectedCustomer.id).padStart(4, '0')}</p>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setNewCustomer(selectedCustomer); setShowEditForm(true); }} className="text-blue-600 text-sm font-bold hover:underline">Edit</button>
                    <button onClick={handleDeleteCustomer} className="text-rose-600 text-sm font-bold hover:underline">Delete</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-sm text-slate-500 font-medium">Total Spent</p>
                  <p className="text-2xl font-bold text-slate-800">Rs. {formatCurrency(selectedCustomer.total_spent)}</p>
                </div>
                <div className={`p-4 rounded-xl border ${selectedCustomer.balance > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                  <p className={`text-sm font-medium ${selectedCustomer.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>Udhaar Balance</p>
                  <p className={`text-2xl font-bold ${selectedCustomer.balance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>Rs. {formatCurrency(selectedCustomer.balance)}</p>
                </div>
              </div>

              {selectedCustomer.balance > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><CreditCard size={18}/> Collect Payment</h3>
                  <form onSubmit={handlePayUdhaar} className="flex gap-2">
                    <input type="number" name="amount" required max={selectedCustomer.balance} min="1" placeholder="Amount..." className="flex-1 p-2 rounded-lg border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold">Record Payment</button>
                  </form>
                </div>
              )}

              <div>
                <h3 className="font-bold text-slate-800 mb-4">Transaction History</h3>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-3 font-medium text-slate-600">Date</th>
                        <th className="p-3 font-medium text-slate-600">Service</th>
                        <th className="p-3 font-medium text-slate-600">Total</th>
                        <th className="p-3 font-medium text-slate-600">Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customerHistory.map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-50">
                          <td className="p-3 text-slate-600">{new Date(tx.date + (tx.date.endsWith('Z') ? '' : 'Z')).toLocaleDateString()}</td>
                          <td className="p-3 font-medium text-slate-800">{tx.category}</td>
                          <td className="p-3">Rs. {formatCurrency(tx.amount)}</td>
                          <td className={`p-3 font-bold ${tx.amount > (tx.paid_amount || 0) && tx.type === 'SALE' ? 'text-rose-600' : 'text-emerald-600'}`}>
                            Rs. {formatCurrency(tx.paid_amount || 0)}
                          </td>
                        </tr>
                      ))}
                      {customerHistory.length === 0 && (
                        <tr><td colSpan="4" className="p-4 text-center text-slate-500">No transactions yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <Users size={64} className="opacity-20" />
              <p>Select a customer to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Customer Modal */}
      {(showAddForm || showEditForm) && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in zoom-in duration-200">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{showEditForm ? 'Edit Customer' : 'New Customer'}</h2>
            <form onSubmit={showEditForm ? handleEditCustomer : handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input 
                  type="text" 
                  required
                  autoFocus
                  value={newCustomer.name} 
                  onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} 
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input 
                  type="text" 
                  placeholder="0300-0000000"
                  value={newCustomer.phone} 
                  onChange={e => setNewCustomer({...newCustomer, phone: formatPhone(e.target.value)})} 
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CNIC (Optional)</label>
                <input 
                  type="text" 
                  value={newCustomer.cnic} 
                  onChange={e => setNewCustomer({...newCustomer, cnic: e.target.value})} 
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address (Optional)</label>
                <input type="text" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => { setShowAddForm(false); setShowEditForm(false); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
