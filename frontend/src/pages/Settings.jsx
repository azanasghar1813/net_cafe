import React, { useState, useEffect } from 'react';
import api from '../api';
import { Save, Shield, Store, CreditCard, Key } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    shop_name: '',
    address: '',
    phone: '',
    receipt_footer: '',
    print_bw_price: '',
    print_color_price: '',
    scan_price_1: '',
    scan_price_2: '',
    scan_price_5: '',
    admin_password: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ category: 'Printing', name: '', price: '' });

  useEffect(() => {
    fetchSettings();
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await api.get('/services');
      setServices(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings({...res.data, admin_password: ''});
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', settings);
      alert("Settings saved successfully!");
      setSettings(prev => ({...prev, admin_password: ''}));
    } catch (err) {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newService.name || !newService.price) return alert('Name and Price are required');
    try {
      const res = await api.post('/services', newService);
      setServices([...services, { ...newService, id: res.data.id }]);
      setNewService({ ...newService, name: '', price: '' });
      alert("Service added!");
    } catch (err) {
      alert("Failed to add service");
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      await api.delete(`/services/${id}`);
      setServices(services.filter(s => s.id !== id));
    } catch (err) {
      alert("Failed to delete service");
    }
  };

  if (loading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 mt-1">Configure shop details, security, and pricing.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Security / Admin */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Shield className="text-blue-600" /> Security
          </h2>
          <div className="max-w-md">
            <label className="block text-sm font-medium text-slate-700 mb-2">Change Admin Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                placeholder="Leave blank to keep current password"
                value={settings.admin_password || ''}
                onChange={e => setSettings({...settings, admin_password: e.target.value})}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">If you forget this password, you will have to manually reset it in the database.</p>
          </div>
        </div>

        {/* General Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Store className="text-blue-600" /> General Shop Info
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Shop Name</label>
              <input type="text" value={settings.shop_name} onChange={e => setSettings({...settings, shop_name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
              <input type="text" value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
              <input type="text" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Receipt Footer Text</label>
              <input type="text" value={settings.receipt_footer} onChange={e => setSettings({...settings, receipt_footer: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Thank you for visiting!" />
            </div>
          </div>
        </div>

        {/* Services & POS Items Manager */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Store className="text-emerald-600" /> Services & POS Items Manager
          </h2>
          <p className="text-sm text-slate-500 mb-6">Add or remove items for Printing, Scanning, Online Services, etc.</p>
          
          <div className="flex gap-4 mb-8">
            <select 
              value={newService.category} 
              onChange={e => setNewService({...newService, category: e.target.value})}
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
            >
              <option value="Printing">Printing</option>
              <option value="Scanning">Scanning</option>
              <option value="Online Services">Online Services</option>
              <option value="Email">Email / Send</option>
              <option value="CV & Resume">CV & Resume</option>
              <option value="Gaming">Gaming</option>
            </select>
            <input 
              type="text" 
              placeholder="Item Name (e.g. A4 Color Print)" 
              value={newService.name} 
              onChange={e => setNewService({...newService, name: e.target.value})}
              className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <input 
              type="number" 
              placeholder="Price (Rs.)" 
              value={newService.price} 
              onChange={e => setNewService({...newService, price: e.target.value})}
              className="w-32 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <button 
              type="button" 
              onClick={handleAddService}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md shadow-emerald-500/20"
            >
              Add Item
            </button>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {['Printing', 'Scanning', 'Online Services', 'Email', 'CV & Resume', 'Gaming'].map(category => {
              const catServices = services.filter(s => s.category === category);
              if (catServices.length === 0) return null;
              return (
                <div key={category}>
                  <h3 className="font-bold text-slate-700 mb-3 border-b pb-2">{category} Items</h3>
                  <div className="space-y-2">
                    {catServices.map(s => (
                      <div key={s.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{s.name}</p>
                          <p className="text-xs font-bold text-emerald-600">Rs. {s.price}</p>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleDeleteService(s.id)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 text-lg"
          >
            {saving ? 'Saving...' : <><Save size={20} /> Save All Settings</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
