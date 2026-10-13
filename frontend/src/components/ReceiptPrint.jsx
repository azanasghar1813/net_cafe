import React, { useEffect } from 'react';

const ReceiptPrint = ({ transaction, shopInfo, onClose }) => {
  if (!transaction) return null;

  const invoiceId = String(transaction.id).padStart(6, '0');
  const dateStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
  const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

  const total = transaction.total || transaction.amount || 0;
  const paid = transaction.paid_amount || 0;
  const discount = transaction.discount || 0;
  const remaining = Math.max(0, total - paid - discount);

  return (
    <div className="fixed inset-0 z-50 bg-white sm:bg-slate-900/80 sm:backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white animate-in fade-in zoom-in duration-200">
      
      {/* Container simulating thermal paper on screen */}
      <div className="bg-white text-black font-sans text-[11px] leading-tight w-full max-w-[320px] print:max-w-none print:w-full mx-auto relative shadow-2xl p-4 sm:rounded-lg print:rounded-none">
        
        {/* Print Controls (Hidden when printing) */}
        <div className="absolute -top-12 left-0 right-0 flex justify-between print:hidden">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold text-sm">Close</button>
          <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm">Print Receipt</button>
        </div>

        <div className="border border-slate-300 rounded-md p-2 print:border-none print:p-0">
          
          {/* Header Row */}
          <div className="flex items-center gap-2 mb-2">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
            <div className="text-center flex-1">
              <h1 className="font-extrabold text-[13px] uppercase tracking-wide">{shopInfo.shop_name || 'GREEN WAY NET ZONE'}</h1>
              <p className="text-[9px] uppercase leading-tight mt-0.5">{shopInfo.address || 'SHOP NO. 07 WAHLA MARKET LAYYAH RD. CHOWK AZAM'}</p>
              <p className="text-[9px] font-semibold tracking-tighter mt-0.5">{shopInfo.phone || '0349 1726553 / 0302 2080486 / 0606 381963'}</p>
            </div>
          </div>

          <div className="text-center font-bold text-[13px] mb-3">
            Invoice # {invoiceId}
          </div>

          {/* Customer Details */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-end">
              <span className="w-20">Date & Time</span>
              <span className="flex-1 border-b border-dashed border-black ml-1 text-center font-semibold">{dateStr} {timeStr}</span>
            </div>
            <div className="flex items-end">
              <span className="w-20">Name :</span>
              <span className="flex-1 border-b border-dashed border-black ml-1 text-center font-semibold">{transaction.customer_name || 'Guest'}</span>
            </div>
            <div className="flex items-end">
              <span className="w-20">Ph#</span>
              <span className="flex-1 border-b border-dashed border-black ml-1 text-center font-semibold">{transaction.customer_phone || ''}</span>
            </div>
          </div>

          {/* Table */}
          <div className="w-full text-center border-t border-b border-dashed border-black py-1 mb-2">
            <div className="flex font-semibold">
              <div className="flex-[2] text-left border-r border-dashed border-black pr-1">Description</div>
              <div className="flex-1 border-r border-dashed border-black">Qty</div>
              <div className="flex-1 text-right">Amount</div>
            </div>
          </div>
          
          <div className="w-full text-center border-b border-dashed border-black pb-2 mb-3 min-h-[60px]">
            {transaction.items && transaction.items.length > 0 ? (
              transaction.items.map((item, idx) => (
                <div key={idx} className="flex items-start mb-1">
                  <div className="flex-[2] text-left border-r border-dashed border-black pr-1 whitespace-pre-wrap">{item.name}</div>
                  <div className="flex-1 border-r border-dashed border-black">{item.qty || '1'}</div>
                  <div className="flex-1 text-right font-semibold">{item.price}</div>
                </div>
              ))
            ) : (
              <div className="flex items-start">
                <div className="flex-[2] text-left border-r border-dashed border-black pr-1 min-h-[60px] whitespace-pre-wrap">{transaction.description || transaction.category}</div>
                <div className="flex-1 border-r border-dashed border-black min-h-[60px]">{transaction.qty || '1'}</div>
                <div className="flex-1 text-right min-h-[60px] font-semibold">{total}</div>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="space-y-1.5 mb-4 w-4/5">
            <div className="flex items-end">
              <span className="w-28">Total Amount :</span>
              <span className="flex-1 border-b border-solid border-black ml-1 text-right font-bold">{total}</span>
            </div>
            <div className="flex items-end">
              <span className="w-28">Paid Amount :</span>
              <span className="flex-1 border-b border-solid border-black ml-1 text-right font-bold">{paid}</span>
            </div>
            <div className="flex items-end">
              <span className="w-28">Remaining Amount</span>
              <span className="flex-1 border-b border-solid border-black ml-1 text-right font-bold">{remaining}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mb-1">
            <p className="font-extrabold italic text-sm">THANK YOU!</p>
            <p className="text-[10px] uppercase font-semibold mt-0.5">
              {shopInfo.receipt_footer ? shopInfo.receipt_footer.split('\\n')[0] : 'FOR VISITING OUR GREEN WAY NET ZONE'}
            </p>
          </div>

          {/* Decorative Barcode */}
          <div className="text-center mt-2 flex flex-col items-center justify-center">
            <span style={{ fontFamily: "'Libre Barcode 39', cursive", fontSize: '36px', lineHeight: '30px' }}>
              *{invoiceId}*
            </span>
            <p className="text-[10px] font-semibold mt-1">
              {shopInfo.receipt_footer && shopInfo.receipt_footer.includes('\\n') 
                ? shopInfo.receipt_footer.split('\\n')[1] 
                : 'www.travelwithsohail.site'}
            </p>
          </div>

        </div>
      </div>
      
      {/* Global Print Styles & Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap');
        
        @media print {
          @page {
            margin: 0;
            size: 58mm auto; /* Typical 58mm thermal printer size */
          }
          body {
            background: white;
            color: black;
          }
          body * {
            visibility: hidden;
          }
          .print\\:bg-white, .print\\:bg-white * {
            visibility: visible;
          }
          .print\\:bg-white {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 2mm;
            width: 58mm; /* Adjust width to thermal paper */
          }
        }
      `}</style>
    </div>
  );
};

export default ReceiptPrint;
