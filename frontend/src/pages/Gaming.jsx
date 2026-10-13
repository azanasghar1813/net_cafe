import React, { useState, useEffect } from 'react';
import api from '../api';
import { Monitor, Clock, Play, Square, Plus, Users, Calculator, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import BillingModal from '../components/BillingModal';

const Gaming = () => {
  const [pcs, setPcs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals State
  const [selectedPc, setSelectedPc] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [showAddTimeModal, setShowAddTimeModal] = useState(false);
  const [billingModalState, setBillingModalState] = useState({ isOpen: false, details: null });

  // Forms
  const [startForm, setStartForm] = useState({ customer_id: '', mode: 'open', package_name: '', custom_minutes: 60, custom_amount: 0 });
  const [addTimeForm, setAddTimeForm] = useState({ additional_minutes: 60, additional_amount: 0 });

  // Live Timer State (keyed by session id)
  const [timers, setTimers] = useState({});
  const [elapsedMins, setElapsedMins] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Initial call to update immediately
    updateTimers();
    const tick = setInterval(updateTimers, 1000);
    return () => { clearInterval(tick); };
  }, [sessions]); // Depend on sessions to update timers correctly

  const fetchData = async () => {
    try {
      const [dbRes, sessionRes, custRes, pkgRes] = await Promise.all([
        api.get('/dashboard'),
        api.get('/gaming-sessions'),
        api.get('/customers'),
        api.get('/services')
      ]);
      
      setPcs(dbRes.data.pcs);
      setSessions(sessionRes.data);
      setCustomers(custRes.data);
      setPackages(pkgRes.data.filter(s => s.category === 'Gaming'));
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const updateTimers = () => {
    const newTimers = {};
    const newElapsed = {};
    
    sessions.forEach(session => {
      const now = new Date().getTime();
      const start = new Date(session.start_time + (session.start_time.endsWith('Z') ? '' : 'Z')).getTime();
      
      if (session.end_time) {
        // Prepaid Session (Count Down)
        const end = new Date(session.end_time + (session.end_time.endsWith('Z') ? '' : 'Z')).getTime();
        const diff = end - now;
        
        if (diff <= 0) {
          newTimers[session.id] = "TIME FINISHED";
        } else {
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          newTimers[session.id] = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
      } else {
        // Open Session (Count Up)
        const diff = now - start;
        const totalMinutes = Math.floor(diff / (1000 * 60));
        newElapsed[session.id] = totalMinutes;
        
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        newTimers[session.id] = `+${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    });
    
    setTimers(newTimers);
    setElapsedMins(newElapsed);
  };

  const getSessionForPc = (pcId) => sessions.find(s => s.pc_id === pcId);

  const handleStartSession = async (e) => {
    e.preventDefault();
    let duration = null;
    let amount = 0;
    let pkgName = "Open Session";

    if (startForm.mode === 'package') {
      const pkg = packages.find(p => p.name === startForm.package_name);
      if (!pkg) return toast.error("Please select a package");
      pkgName = pkg.name;
      amount = pkg.price;
      if (pkg.name.includes("Hour")) {
        const num = parseFloat(pkg.name.split(" ")[0]);
        duration = num * 60;
      } else {
        duration = 60;
      }
    } else if (startForm.mode === 'custom') {
      duration = Number(startForm.custom_minutes);
      amount = Number(startForm.custom_amount);
      if (duration <= 0) return toast.error("Please enter valid minutes");
      pkgName = `${duration} Mins (Custom)`;
    }

    try {
      await api.post('/gaming-sessions/start', {
        pc_id: selectedPc.id,
        customer_id: startForm.customer_id || null,
        package_name: pkgName,
        amount,
        duration_minutes: duration
      });
      setShowStartModal(false);
      fetchData();
      toast.success("Session Started!");
      // Reset form defaults
      setStartForm({ customer_id: '', mode: 'open', package_name: '', custom_minutes: 60, custom_amount: 0 });
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to start session");
    }
  };

  const handleStopSessionClick = () => {
    const session = getSessionForPc(selectedPc.id);
    if (!session.end_time) {
      // Open Session, calculate price dynamically based on elapsed minutes (assuming Rs 120/hr, i.e., 2/min)
      const el = Math.max(1, elapsedMins[session.id] || 1); // at least 1 min
      const calculatedAmount = Math.ceil((el / 60) * 120); // Rs 120 per hour
      setStartForm({ ...startForm, custom_amount: calculatedAmount });
    } else {
      setStartForm({ ...startForm, custom_amount: session.amount });
    }
    setShowStopModal(true);
  };

  const handleGenerateBill = (e) => {
    e.preventDefault();
    const session = getSessionForPc(selectedPc.id);
    
    // Check if open session to adjust the description and amount
    const isOpenSession = !session.end_time;
    let finalAmount = isOpenSession ? Number(startForm.custom_amount) : session.amount;
    let desc = isOpenSession 
      ? `Gaming: ${elapsedMins[session.id] || 0} Minutes Played` 
      : `Gaming Session: ${session.package_name}`;

    const cust = customers.find(c => c.id.toString() === session.customer_id?.toString());

    // Stop session in backend first
    api.post(`/gaming-sessions/${session.id}/stop`, {
      paid_amount: 0, // We will just update DB amount first, handle payment in BillingModal
      discount: 0
    }).then(() => {
      // Open Billing Modal
      setBillingModalState({
        isOpen: true,
        details: {
          customer_id: cust ? cust.id : null,
          customer_name: cust ? cust.name : null,
          category: 'Gaming Revenue',
          description: desc,
          total: finalAmount
        }
      });
      setShowStopModal(false);
      setSelectedPc(null);
      fetchData(); // refresh session data to remove from grid
    }).catch(err => toast.error("Failed to stop session properly"));
  };

  const handleAddTime = async (e) => {
    e.preventDefault();
    const session = getSessionForPc(selectedPc.id);
    try {
      await api.put(`/gaming-sessions/${session.id}/add-time`, {
        additional_minutes: Number(addTimeForm.additional_minutes),
        additional_amount: Number(addTimeForm.additional_amount)
      });
      setShowAddTimeModal(false);
      fetchData();
      toast.success("Time added");
    } catch (err) {
      toast.error("Failed to add time");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Gaming PCs...</div>;

  const activeSession = selectedPc ? getSessionForPc(selectedPc.id) : null;
  const isTimeFinished = activeSession && timers[activeSession.id] === "TIME FINISHED";

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-500 w-full">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Gaming Management</h1>
        <p className="text-slate-500 mt-1">Monitor live PCs, manage time, and generate bills.</p>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        {/* PCs Grid */}
        <div className="w-2/3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-y-auto">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pcs.map(pc => {
              const session = getSessionForPc(pc.id);
              const timer = session ? timers[session.id] : null;
              const isFinished = timer === "TIME FINISHED";

              return (
                <div 
                  key={pc.id}
                  onClick={() => setSelectedPc(pc)}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                    selectedPc?.id === pc.id ? 'ring-4 ring-blue-500/30' : ''
                  } ${
                    pc.status === 'AVAILABLE' ? 'border-slate-200 bg-slate-50 hover:border-blue-400' :
                    isFinished ? 'border-rose-400 bg-rose-50 ring-2 ring-rose-400/50 animate-pulse' :
                    'border-emerald-400 bg-emerald-50'
                  }`}
                >
                  <Monitor size={32} className={`mb-2 ${
                    pc.status === 'AVAILABLE' ? 'text-slate-400' :
                    isFinished ? 'text-rose-500' :
                    'text-emerald-500'
                  }`} />
                  <span className="font-bold text-slate-700">{pc.pc_number}</span>
                  
                  {pc.status === 'IN_USE' && session && (
                    <div className={`mt-2 px-2 py-1 rounded text-xs font-bold w-full text-center ${
                      isFinished ? 'bg-rose-500 text-white' : 
                      !session.end_time ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {timer || 'Loading...'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Panel */}
        <div className="w-1/3 flex flex-col gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex-1">
            {selectedPc ? (
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <div className={`p-3 rounded-xl ${selectedPc.status === 'AVAILABLE' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-600'}`}>
                    <Monitor size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">{selectedPc.pc_number}</h2>
                    <p className={`font-medium text-sm ${selectedPc.status === 'AVAILABLE' ? 'text-slate-500' : 'text-emerald-600'}`}>
                      {selectedPc.status === 'AVAILABLE' ? 'Available' : 'In Use'}
                    </p>
                  </div>
                </div>

                {selectedPc.status === 'AVAILABLE' ? (
                  <button 
                    onClick={() => setShowStartModal(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-lg"
                  >
                    <Play size={20} fill="currentColor" /> Start Session
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Customer</span>
                        <span className="font-bold text-slate-700">
                          {activeSession?.customer_id ? customers.find(c => c.id === activeSession.customer_id)?.name : 'Guest'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Package</span>
                        <span className="font-bold text-slate-700">{activeSession?.package_name}</span>
                      </div>
                      {!activeSession?.end_time && (
                         <div className="flex justify-between text-sm">
                           <span className="text-slate-500">Time Played</span>
                           <span className="font-bold text-blue-600">{elapsedMins[activeSession?.id] || 0} Mins</span>
                         </div>
                      )}
                      <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                        <span className="text-slate-500">Base Amount</span>
                        <span className="font-bold text-emerald-600">Rs. {activeSession?.amount}</span>
                      </div>
                    </div>

                    <button 
                      onClick={handleStopSessionClick}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-lg"
                    >
                      <Square size={20} fill="currentColor" /> Stop & Generate Bill
                    </button>

                    {activeSession?.end_time && (
                      <button 
                        onClick={() => setShowAddTimeModal(true)}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <Plus size={18} /> Add More Time
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Monitor size={48} className="mb-4 opacity-20" />
                <p>Select a PC to manage</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* START MODAL */}
      {showStartModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[400px] shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Play size={20} className="text-blue-600" /> Start {selectedPc?.pc_number}
            </h2>
            <form onSubmit={handleStartSession} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Customer (Optional)</label>
                <select 
                  value={startForm.customer_id} 
                  onChange={e => setStartForm({...startForm, customer_id: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Guest (Walk-in)</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} (Bal: {c.balance})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Session Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => setStartForm({...startForm, mode: 'open'})} className={`py-2 text-xs font-bold rounded-lg border ${startForm.mode === 'open' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-500'}`}>Open Ended</button>
                  <button type="button" onClick={() => setStartForm({...startForm, mode: 'package'})} className={`py-2 text-xs font-bold rounded-lg border ${startForm.mode === 'package' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-500'}`}>Package</button>
                  <button type="button" onClick={() => setStartForm({...startForm, mode: 'custom'})} className={`py-2 text-xs font-bold rounded-lg border ${startForm.mode === 'custom' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-500'}`}>Custom Time</button>
                </div>
              </div>

              {startForm.mode === 'package' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Package</label>
                  <select 
                    required
                    value={startForm.package_name} 
                    onChange={e => setStartForm({...startForm, package_name: e.target.value})} 
                    className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose Package --</option>
                    {packages.map(p => <option key={p.id} value={p.name}>{p.name} - Rs. {p.price}</option>)}
                  </select>
                </div>
              )}

              {startForm.mode === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Minutes</label>
                    <input type="number" required min="1" value={startForm.custom_minutes} onChange={e => setStartForm({...startForm, custom_minutes: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                    <input type="number" required min="0" value={startForm.custom_amount} onChange={e => setStartForm({...startForm, custom_amount: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              )}

              {startForm.mode === 'open' && (
                <div className="p-3 bg-blue-50 text-blue-700 text-sm font-medium rounded-xl border border-blue-100 flex items-center gap-2">
                   <Clock size={16} /> Timer will start now. Amount will be calculated when you stop.
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowStartModal(false)} className="flex-1 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors font-bold">Cancel</button>
                <button type="submit" className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-bold">Start Now</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOP / GENERATE BILL MODAL */}
      {showStopModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl p-6 w-[400px] shadow-2xl animate-in zoom-in-95 duration-200">
             <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Square size={20} className="text-rose-600" /> Stop Session
            </h2>
            
            <form onSubmit={handleGenerateBill} className="space-y-4">
              {!activeSession?.end_time && (
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Total Amount (Rs.)</label>
                    <p className="text-xs text-slate-500 mb-2">Calculated for {elapsedMins[activeSession?.id] || 0} minutes</p>
                    <input 
                      type="number" 
                      min="0" 
                      required
                      value={startForm.custom_amount} 
                      onChange={e => setStartForm({...startForm, custom_amount: e.target.value})} 
                      className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg" 
                    />
                 </div>
              )}
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowStopModal(false)} className="flex-1 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors font-bold">Cancel</button>
                <button type="submit" className="flex-[2] py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors font-bold flex justify-center items-center gap-2">
                  <Calculator size={18} /> Proceed to Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD TIME MODAL */}
      {showAddTimeModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[400px] shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Add Time to {selectedPc?.pc_number}</h2>
            <form onSubmit={handleAddTime} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Additional Minutes</label>
                  <input type="number" required min="1" value={addTimeForm.additional_minutes} onChange={e => setAddTimeForm({...addTimeForm, additional_minutes: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Additional Amount</label>
                  <input type="number" required min="0" value={addTimeForm.additional_amount} onChange={e => setAddTimeForm({...addTimeForm, additional_amount: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAddTimeModal(false)} className="flex-1 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors font-bold">Cancel</button>
                <button type="submit" className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-bold">Add Time</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Billing Modal */}
      <BillingModal 
        isOpen={billingModalState.isOpen} 
        details={billingModalState.details} 
        onClose={() => setBillingModalState({ isOpen: false, details: null })} 
        onSuccess={() => {
          fetchData(); 
        }} 
      />

    </div>
  );
};

export default Gaming;
