import React, { useState, useEffect } from 'react';
import api from '../api';
import { CheckCircle2, Receipt, Printer } from 'lucide-react';
import ReceiptPrint from './ReceiptPrint';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/format';

const BillingModal = ({ isOpen, onClose, details, onSuccess }) => {
  const [paidAmount, setPaidAmount] = useState(details?.total || 0);
  const [discount, setDiscount] = useState(0);
  const [transactionComplete, setTransactionComplete] = useState(false);
  const [completedTxData, setCompletedTxData] = useState(null);
  const [shopInfo, setShopInfo] = useState({});

  useEffect(() => {
    if (isOpen) {
      setPaidAmount(details.total);
      setDiscount(0);
      setTransactionComplete(false);
      setCompletedTxData(null);
      // Fetch shop info for receipt
      api.get('/settings').then(res => {
        setShopInfo(res.data || {});
      }).catch(console.error);
    }
  }, [isOpen, details]);

  if (!isOpen) return null;

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      const finalAmount = details.total - Number(discount);
      const res = await api.post('/bill', {
        customer_id: details.customer_id,
        category: details.category,
        description: details.description,
        total_amount: finalAmount,
        paid_amount: Number(paidAmount),
        discount: Number(discount)
      });
      
      setCompletedTxData({
        ...details,
        id: res.data.transactionId,
        total: finalAmount,
        paid_amount: Number(paidAmount),
        discount: Number(discount)
      });
      setTransactionComplete(true);
      onSuccess(res.data);
    } catch (err) {
      toast.error("Failed to save transaction");
    }
  };

  const finalAmount = details.total - Number(discount);
  const udhaar = finalAmount - Number(paidAmount);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 print:bg-transparent print:backdrop-blur-none">
      <div className="bg-white rounded-2xl p-6 w-[450px] shadow-2xl animate-in zoom-in-95 duration-200 print:hidden">
        
        {!transactionComplete ? (
          <>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Receipt size={20} className="text-blue-600" /> Complete Transaction
            </h2>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Service:</span>
                <span className="font-bold text-slate-700">{details.description}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-700">{details.customer_name || 'Guest'}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-slate-200 pt-2 mt-2">
                <span className="text-slate-600 font-medium">Base Total:</span>
                <span className="font-bold text-slate-800">Rs. {formatCurrency(details.total)}</span>
              </div>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Discount (Rs.)</label>
                <input 
                  type="number" 
                  min="0" 
                  value={discount} 
                  onChange={e => setDiscount(e.target.value)} 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex justify-between">
                  <span>Amount Paid (Rs.)</span>
                  <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded text-xs">Net Total: Rs. {formatCurrency(finalAmount)}</span>
                </label>
                <input 
                  type="number" 
                  required 
                  min="0" 
                  value={paidAmount} 
                  onChange={e => setPaidAmount(e.target.value)} 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xl font-bold text-slate-800" 
                />
                
                {details.customer_id && udhaar > 0 && (
                  <p className="text-xs text-rose-600 font-medium mt-2 bg-rose-50 p-2 rounded-lg border border-rose-100">
                    Rs. {formatCurrency(udhaar)} will be added to {details.customer_name}'s Udhaar.
                  </p>
                )}
                {!details.customer_id && udhaar > 0 && (
                  <p className="text-xs text-amber-600 font-medium mt-2 bg-amber-50 p-2 rounded-lg border border-amber-100">
                    Warning: No customer selected. Balance of Rs. {formatCurrency(udhaar)} cannot be saved as Udhaar.
                  </p>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium flex items-center gap-2 shadow-sm"
                >
                  <CheckCircle2 size={18} /> Save Transaction
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Transaction Saved</h2>
            <p className="text-slate-500 mb-8">The bill has been recorded successfully.</p>
            
            <div className="flex gap-4 justify-center">
              <button 
                onClick={onClose} 
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-bold"
              >
                Close
              </button>
              <button 
                onClick={() => window.print()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-bold flex items-center gap-2 shadow-sm"
              >
                <Printer size={18} /> Print Receipt
              </button>
            </div>
          </div>
        )}
      </div>

      {transactionComplete && completedTxData && (
        <ReceiptPrint transaction={completedTxData} shopInfo={shopInfo} onClose={onClose} />
      )}
    </div>
  );
};

export default BillingModal;
