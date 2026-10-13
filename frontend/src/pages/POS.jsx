import React, { useState, useEffect } from 'react';
import api from '../api';
import { ShoppingCart, Printer, ScanLine, Globe, Mail, FileText, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import BillingModal from '../components/BillingModal';

const POS = () => {
  const [activeTab, setActiveTab] = useState('Printing');
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cart & POS State
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState('');
  
  // Custom Item Form State
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  // Printing Specific State
  const [pages, setPages] = useState(1);

  const [modalState, setModalState] = useState({ isOpen: false, details: null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [custRes, servRes] = await Promise.all([
        api.get('/customers'),
        api.get('/services')
      ]);
      setCustomers(custRes.data);
      setServices(servRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const categories = [
    { id: 'Printing', icon: <Printer size={18} />, label: 'Printing' },
    { id: 'Scanning', icon: <ScanLine size={18} />, label: 'Scanning' },
    { id: 'Online Services', icon: <Globe size={18} />, label: 'Online Apply' },
    { id: 'Email', icon: <Mail size={18} />, label: 'Email / Send' },
    { id: 'CV & Resume', icon: <FileText size={18} />, label: 'CV & Resume' },
    { id: 'Custom', icon: <Plus size={18} />, label: 'Custom Item' }
  ];

  const currentServices = services.filter(s => s.category === activeTab);

  const addToCart = (item) => {
    setCart([...cart, { ...item, cartId: Date.now() + Math.random() }]);
  };

  const handleAddService = (service) => {
    if (activeTab === 'Printing') {
      addToCart({
        name: `${service.name} (${pages} pages)`,
        price: service.price * pages,
        qty: pages,
        category: 'Printing'
      });
      setPages(1); // reset
    } else {
      addToCart({
        name: service.name,
        price: service.price,
        qty: 1,
        category: service.category
      });
    }
  };

  const handleAddCustom = (e) => {
    e.preventDefault();
    if (!customName || !customPrice) return;
    addToCart({
      name: customName,
      price: Number(customPrice),
      qty: 1,
      category: 'Custom'
    });
    setCustomName('');
    setCustomPrice('');
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const grandTotal = cart.reduce((sum, item) => sum + item.price, 0);

  const handleGenerateBill = () => {
    if (cart.length === 0) return alert("Cart is empty");

    const cust = customers.find(c => c.id.toString() === customerId);
    
    const description = cart.map(item => `${item.qty > 1 ? item.qty + 'x ' : ''}${item.name}`).join('\n');

    setModalState({
      isOpen: true,
      details: {
        customer_id: cust ? cust.id : null,
        customer_name: cust ? cust.name : null,
        category: 'POS Services',
        description: description,
        items: cart, // Pass items for ReceiptPrint
        total: grandTotal
      }
    });
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading POS...</div>;

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-500 w-full">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Services POS</h1>
        <p className="text-slate-500 mt-1">Unified billing for printing, scanning, and online services.</p>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        
        {/* Left Side: Services Grid */}
        <div className="w-2/3 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Categories Navbar */}
          <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50 p-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === cat.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
            {activeTab === 'Custom' ? (
              <div className="max-w-md bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Add Custom Item</h3>
                <form onSubmit={handleAddCustom} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Service Name / Description</label>
                    <input 
                      type="text" 
                      required
                      value={customName} 
                      onChange={e => setCustomName(e.target.value)} 
                      className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                      placeholder="e.g. Special Editing"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount (Rs.)</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      value={customPrice} 
                      onChange={e => setCustomPrice(e.target.value)} 
                      className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                    />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-sm flex justify-center items-center gap-2">
                    <Plus size={18} /> Add to Bill
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                {activeTab === 'Printing' && (
                  <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-blue-100 shadow-sm w-max">
                    <label className="font-bold text-slate-700">Number of Pages:</label>
                    <div className="flex items-center bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                      <button onClick={() => setPages(Math.max(1, pages - 1))} className="px-4 py-2 hover:bg-slate-200 font-bold">-</button>
                      <input 
                        type="number" 
                        min="1" 
                        value={pages} 
                        onChange={e => setPages(Math.max(1, Number(e.target.value)))}
                        className="w-16 text-center bg-transparent font-bold outline-none"
                      />
                      <button onClick={() => setPages(pages + 1)} className="px-4 py-2 hover:bg-slate-200 font-bold">+</button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentServices.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-slate-500">
                      No services found in this category. Go to Settings to add them.
                    </div>
                  ) : currentServices.map(service => (
                    <button
                      key={service.id}
                      onClick={() => handleAddService(service)}
                      className="bg-white border-2 border-slate-200 hover:border-blue-500 rounded-xl p-4 text-left transition-all hover:shadow-md group flex flex-col justify-between h-28"
                    >
                      <span className="font-bold text-slate-700 leading-tight group-hover:text-blue-700">{service.name}</span>
                      <span className="font-extrabold text-blue-600 text-lg">Rs. {service.price}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Cart & Checkout */}
        <div className="w-1/3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ShoppingCart size={20} className="text-blue-600" /> Current Bill
          </h2>

          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Customer</label>
            <select 
              value={customerId} 
              onChange={e => setCustomerId(e.target.value)} 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
            >
              <option value="">Guest (Walk-in, No Udhaar)</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} (Bal: Rs. {c.balance})</option>)}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50 rounded-xl border border-slate-100 p-3 mb-4 space-y-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <ShoppingCart size={40} className="mb-2 opacity-50" />
                <p>Cart is empty</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.cartId} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex justify-between items-start animate-in slide-in-from-right-4 duration-200">
                  <div className="pr-2">
                    <p className="font-bold text-slate-800 text-sm leading-tight">{item.name}</p>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{item.category}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-blue-600">Rs. {item.price}</span>
                    <button onClick={() => removeFromCart(item.cartId)} className="text-slate-400 hover:text-rose-500 transition-colors p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 mb-6">
            <div className="flex justify-between items-center mb-1 text-slate-500 font-medium">
              <span>Items</span>
              <span>{cart.length}</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-lg font-bold text-slate-800">Grand Total</span>
              <span className="text-3xl font-extrabold text-emerald-600">Rs. {grandTotal}</span>
            </div>
          </div>

          <button 
            onClick={handleGenerateBill}
            disabled={cart.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-sm flex justify-center items-center gap-2"
          >
            <CheckCircle2 size={24} /> Complete & Pay
          </button>
        </div>

      </div>

      <BillingModal 
        isOpen={modalState.isOpen} 
        details={modalState.details} 
        onClose={() => setModalState({ isOpen: false, details: null })} 
        onSuccess={() => {
          setCart([]);
          setCustomerId('');
          setPages(1);
          setCustomName('');
          setCustomPrice('');
          fetchData(); // Refresh udhaar balances
        }} 
      />
    </div>
  );
};

export default POS;
