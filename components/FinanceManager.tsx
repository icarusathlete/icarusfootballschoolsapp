
import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../services/storageService';
import { Player, FeeRecord, AcademySettings } from '../types';
import { Check, X, AlertCircle, DollarSign, Search, Calendar, ChevronRight, User as UserIcon, FileText, Download, Loader2, Send, Phone, MapPin, Mail, Globe, Trophy } from 'lucide-react';
import html2canvas from 'html2canvas';

// Helper to convert number to words (Simplified for demo)
const numberToWords = (num: number): string => {
    const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
    const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];

    if ((num = num.toString().length > 9 ? parseFloat(num.toString().slice(0, 9)) : num) === 0) return 'Zero';
    
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';

    let str = '';
    str += (parseInt(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (parseInt(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (parseInt(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (parseInt(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (parseInt(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';

    return str + 'Only';
};

export const FinanceManager: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [searchTerm, setSearchTerm] = useState('');
  const [settings, setSettings] = useState<AcademySettings>(StorageService.getSettings());

  // Invoice State
  const [isInvoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedPlayerForInvoice, setSelectedPlayerForInvoice] = useState<Player | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [invoiceForm, setInvoiceForm] = useState({
      invoiceNo: '',
      date: new Date().toISOString().split('T')[0],
      amount: 2400, // Default amount in Rupees
      paymentMode: 'UPI' as 'Cash' | 'UPI' | 'Bank Transfer' | 'Card',
      validTill: '',
  });

  const loadData = () => {
    setPlayers(StorageService.getPlayers());
    setFees(StorageService.getFees());
    setSettings(StorageService.getSettings());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('icarus_data_update', loadData);
    return () => window.removeEventListener('icarus_data_update', loadData);
  }, []);

  const getStatus = (playerId: string) => {
    return fees.find(f => f.playerId === playerId && f.month === month);
  };

  const updateStatus = (playerId: string, status: FeeRecord['status']) => {
    const existing = getStatus(playerId);
    const record: FeeRecord = {
        id: existing ? existing.id : Math.random().toString(36).substr(2, 9),
        playerId,
        month,
        status,
        amount: existing ? existing.amount : 2400,
        datePaid: status === 'PAID' ? new Date().toISOString() : undefined
    };
    StorageService.updateFee(record);
  };

  // --- Invoice Logic ---
  const openInvoiceGenerator = (player: Player) => {
      setSelectedPlayerForInvoice(player);
      const existing = getStatus(player.id);
      
      const nextId = existing?.invoice?.invoiceNo || StorageService.getNextInvoiceId();
      
      // Calculate 'Valid Till'
      const [y, m] = month.split('-');
      const lastDay = new Date(parseInt(y), parseInt(m), 0).toISOString().split('T')[0];

      setInvoiceForm({
          invoiceNo: nextId,
          date: existing?.invoice?.date || new Date().toISOString().split('T')[0],
          amount: existing?.amount || 2400,
          paymentMode: (existing?.invoice?.paymentMode as any) || 'UPI',
          validTill: existing?.invoice?.validTill || lastDay
      });
      setInvoiceModalOpen(true);
  };

  const handleSubmitInvoice = async () => {
      if (!selectedPlayerForInvoice) return;
      setIsSubmitting(true);

      await new Promise(resolve => setTimeout(resolve, 800));

      const existingRecord = getStatus(selectedPlayerForInvoice.id);
      
      const updatedFee: FeeRecord = {
          id: existingRecord ? existingRecord.id : Math.random().toString(36).substr(2, 9),
          playerId: selectedPlayerForInvoice.id,
          month: month,
          status: 'PAID',
          amount: invoiceForm.amount,
          datePaid: new Date().toISOString(),
          invoice: invoiceForm
      };

      StorageService.updateFee(updatedFee);
      
      if (!existingRecord?.invoice) {
        StorageService.saveLastInvoiceId(invoiceForm.invoiceNo);
      }
      
      setIsSubmitting(false);
      setInvoiceModalOpen(false);
  };

  // Tax Calculation Logic (18% GST included in Total)
  const calculateTaxes = (total: number) => {
      const base = total / 1.18;
      const cgst = base * 0.09;
      const sgst = base * 0.09;
      return {
          base: Math.round(base),
          cgst: Math.round(cgst),
          sgst: Math.round(sgst),
          total: total
      };
  };

  const filteredPlayers = players.filter(p => p.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalDue = filteredPlayers.length * 2400;
  const totalCollected = filteredPlayers.reduce((sum, p) => {
      const rec = getStatus(p.id);
      return sum + (rec?.status === 'PAID' ? (rec.amount || 2400) : 0);
  }, 0);

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'PAID': return 'bg-green-100 text-green-700 border-green-200';
          case 'OVERDUE': return 'bg-red-100 text-red-700 border-red-200';
          default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      }
  };

  const taxes = calculateTaxes(invoiceForm.amount);

  return (
    <div className="space-y-6">
       {/* Header Section */}
       <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <div>
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Finance & Fees</h2>
              <p className="text-gray-500 text-sm mt-1">Track monthly payments and generate invoices</p>
           </div>
           <div className="flex flex-col sm:flex-row gap-3">
               <div className="relative">
                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                   <input 
                     type="month" 
                     value={month} 
                     onChange={e => setMonth(e.target.value)} 
                     className="w-full sm:w-auto pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:ring-4 focus:ring-icarus-500/10 focus:border-icarus-500 outline-none font-medium"
                   />
               </div>
               <div className="bg-icarus-50/50 px-5 py-2.5 rounded-xl border border-icarus-100 flex items-center justify-between sm:justify-start gap-4">
                  <span className="text-xs font-black text-icarus-600 uppercase tracking-wider">Collected</span>
                  <span className="font-mono font-bold text-icarus-900 text-lg tracking-tight">₹{totalCollected} <span className="text-gray-400 text-sm">/ ₹{totalDue}</span></span>
               </div>
           </div>
       </div>

       {/* Search Bar */}
       <div className="relative">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
           <input 
             placeholder="Search player name or member ID..." 
             className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-icarus-500/10 focus:border-icarus-500 outline-none transition-all font-medium"
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
       </div>

       {/* Mobile Card View (Hidden on MD+) */}
       <div className="md:hidden grid gap-4">
          {filteredPlayers.map(p => {
              const status = getStatus(p.id);
              const statusVal = status?.status || 'PENDING';
              return (
                  <div key={p.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group">
                      <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-black tracking-wider uppercase border-b border-l ${getStatusColor(statusVal)}`}>
                          {statusVal}
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                          <img src={p.photoUrl} className="w-14 h-14 rounded-2xl bg-gray-100 object-cover border" />
                          <div>
                              <h3 className="font-bold text-gray-900">{p.fullName}</h3>
                              <p className="text-[10px] text-gray-400 font-mono tracking-wider">{p.memberId}</p>
                              {status?.datePaid && (
                                <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1 font-medium bg-green-50 px-2 py-0.5 rounded-full w-fit">
                                    <Check size={10} /> {new Date(status.datePaid).toLocaleDateString()}
                                </p>
                              )}
                          </div>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                          <div className="font-mono font-bold text-gray-700 text-lg">₹2400</div>
                          <div className="flex gap-1.5">
                              <button onClick={() => openInvoiceGenerator(p)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Generate Invoice">
                                   <FileText size={20} />
                              </button>
                              {statusVal !== 'PAID' && (
                                  <button onClick={() => updateStatus(p.id, 'PAID')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"><Check size={20} /></button>
                              )}
                              {statusVal !== 'OVERDUE' && (
                                  <button onClick={() => updateStatus(p.id, 'OVERDUE')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"><AlertCircle size={20} /></button>
                              )}
                              {statusVal !== 'PENDING' && (
                                  <button onClick={() => updateStatus(p.id, 'PENDING')} className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors"><X size={20} /></button>
                              )}
                          </div>
                      </div>
                  </div>
              )
          })}
          {filteredPlayers.length === 0 && <div className="text-center text-gray-400 py-10">No players found.</div>}
       </div>
       
       {/* Desktop Table View (Hidden on Mobile) */}
       <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
           <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                   <thead className="bg-gray-50/50 border-b border-gray-200">
                       <tr>
                           <th className="px-6 py-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Player</th>
                           <th className="px-6 py-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Member ID</th>
                           <th className="px-6 py-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Fee Amount</th>
                           <th className="px-6 py-4 font-bold text-gray-400 uppercase text-xs tracking-wider text-center">Status</th>
                           <th className="px-6 py-4 font-bold text-gray-400 uppercase text-xs tracking-wider text-right">Action</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                       {filteredPlayers.map(p => {
                           const status = getStatus(p.id);
                           const statusVal = status?.status || 'PENDING';
                           
                           return (
                               <tr key={p.id} className="group hover:bg-gray-50 transition-colors">
                                   <td className="px-6 py-4 font-medium flex items-center gap-4">
                                       <img src={p.photoUrl} className="w-10 h-10 rounded-xl bg-gray-200 object-cover border shadow-sm" />
                                       <div className="flex flex-col">
                                          <span className="font-bold text-gray-900">{p.fullName}</span>
                                          {status?.datePaid && (
                                              <span className="text-[10px] text-green-600 font-medium">Paid: {new Date(status.datePaid).toLocaleDateString()}</span>
                                          )}
                                       </div>
                                   </td>
                                   <td className="px-6 py-4 text-gray-500 font-mono text-xs">{p.memberId}</td>
                                   <td className="px-6 py-4 font-mono font-bold text-gray-700">₹2400</td>
                                   <td className="px-6 py-4 text-center">
                                       <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(statusVal)}`}>
                                           {statusVal}
                                       </span>
                                   </td>
                                   <td className="px-6 py-4 text-right">
                                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                           <button 
                                                onClick={() => openInvoiceGenerator(p)} 
                                                className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" 
                                                title="Generate Invoice"
                                           >
                                                <FileText size={18} />
                                           </button>
                                           {statusVal !== 'PAID' && (
                                               <button onClick={() => updateStatus(p.id, 'PAID')} className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors" title="Mark Paid">
                                                   <Check size={18} />
                                               </button>
                                           )}
                                           {statusVal !== 'OVERDUE' && (
                                               <button onClick={() => updateStatus(p.id, 'OVERDUE')} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Mark Overdue">
                                                   <AlertCircle size={18} />
                                               </button>
                                           )}
                                            {statusVal !== 'PENDING' && (
                                               <button onClick={() => updateStatus(p.id, 'PENDING')} className="p-1.5 bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors" title="Reset">
                                                   <X size={18} />
                                               </button>
                                           )}
                                       </div>
                                   </td>
                               </tr>
                           );
                       })}
                       {filteredPlayers.length === 0 && (
                           <tr>
                               <td colSpan={5} className="text-center py-10 text-gray-400">No players found matching your search.</td>
                           </tr>
                       )}
                   </tbody>
               </table>
           </div>
       </div>

       {/* Invoice Generator Modal */}
       {isInvoiceModalOpen && selectedPlayerForInvoice && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in">
               <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col md:flex-row overflow-hidden">
                   
                   {/* Left Panel: Controls */}
                   <div className="w-full md:w-1/3 bg-gray-50 p-8 border-r border-gray-200 overflow-y-auto">
                       <div className="flex items-center justify-between mb-8">
                           <h3 className="text-xl font-bold text-gray-900">Invoice Details</h3>
                           <button onClick={() => setInvoiceModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><X size={20} /></button>
                       </div>
                       
                       <div className="space-y-6">
                           <div className="space-y-1.5">
                               <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Invoice Number</label>
                               <input 
                                   type="text" 
                                   value={invoiceForm.invoiceNo} 
                                   onChange={e => setInvoiceForm({...invoiceForm, invoiceNo: e.target.value})}
                                   className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-icarus-500 outline-none font-mono text-sm"
                               />
                           </div>

                           <div className="space-y-1.5">
                               <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Date Issued</label>
                               <input 
                                   type="date" 
                                   value={invoiceForm.date} 
                                   onChange={e => setInvoiceForm({...invoiceForm, date: e.target.value})}
                                   className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-icarus-500 outline-none text-sm font-medium"
                               />
                           </div>

                           <div className="space-y-1.5">
                               <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Fee Valid Till</label>
                               <input 
                                   type="date" 
                                   value={invoiceForm.validTill} 
                                   onChange={e => setInvoiceForm({...invoiceForm, validTill: e.target.value})}
                                   className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-icarus-500 outline-none text-sm font-medium"
                               />
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Amount (₹)</label>
                                    <input 
                                        type="number" 
                                        value={invoiceForm.amount} 
                                        onChange={e => setInvoiceForm({...invoiceForm, amount: parseInt(e.target.value)})}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-icarus-500 outline-none text-sm font-bold"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Mode</label>
                                    <select 
                                        value={invoiceForm.paymentMode} 
                                        onChange={e => setInvoiceForm({...invoiceForm, paymentMode: e.target.value as any})}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-icarus-500 outline-none text-sm bg-white"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Card">Credit/Debit Card</option>
                                    </select>
                                </div>
                           </div>
                       </div>

                       <div className="mt-12">
                           <button 
                                onClick={handleSubmitInvoice}
                                disabled={isSubmitting}
                                className="w-full py-4 bg-icarus-900 text-white font-bold rounded-xl shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                           >
                               {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                               {isSubmitting ? 'Submitting...' : 'Submit & Send to Player'}
                           </button>
                           <p className="text-xs text-center text-gray-400 mt-3">This will mark fees as PAID and make the invoice available in the player's portal.</p>
                       </div>
                   </div>

                   {/* Right Panel: Live Preview */}
                   <div className="w-full md:w-2/3 bg-gray-100 p-8 overflow-y-auto flex items-center justify-center">
                       <div ref={invoiceRef} className="bg-white w-full max-w-[700px] min-h-[900px] shadow-2xl relative text-gray-900 overflow-hidden">
                           
                           {/* HEADER WITH SLANTED BLACK SHAPE */}
                           <div className="relative h-40 w-full bg-gray-200">
                                {/* Left Side: Logo */}
                                <div className="absolute top-0 left-0 h-full w-2/5 pl-8 flex items-center z-10">
                                    <div className="flex flex-col">
                                        {settings.logoUrl && <img src={settings.logoUrl} className="h-16 object-contain mb-2" />}
                                        <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900 leading-none" style={{ fontFamily: 'Orbitron' }}>
                                            ICARUS <br/> <span className="text-xl tracking-tight font-bold">FOOTBALL SCHOOLS</span>
                                        </h1>
                                    </div>
                                </div>

                                {/* Right Side: Slanted Black Background */}
                                <div className="absolute top-0 right-0 h-full w-[65%] bg-black text-white" style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)' }}>
                                    <div className="h-full flex flex-col justify-center items-start pl-24 space-y-2 text-[11px] font-medium">
                                        <div className="flex items-center gap-3">
                                            <Phone size={14} className="text-white" />
                                            <span>+91 9259418625</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <MapPin size={14} className="text-white" />
                                            <span className="max-w-[200px] leading-tight">Sector 13/868, Vasundhara, Ghaziabad, Uttar Pradesh - 201012</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Mail size={14} className="text-white" />
                                            <span>hello@icarusfootballschools.com</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Globe size={14} className="text-white" />
                                            <span>www.icarusfootballschools.com</span>
                                        </div>
                                    </div>
                                </div>
                           </div>

                           <div className="px-10 py-8">
                                {/* TITLE ROW */}
                                <div className="flex justify-between items-start mb-8">
                                    <h2 className="text-2xl font-bold uppercase tracking-wide text-gray-800">Payment Receipt</h2>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-800">GSTIN : 09AAHCI6679R1ZD</p>
                                        <p className="text-sm text-gray-600 mt-1">Invoice Number: {invoiceForm.invoiceNo.replace('INV-', '')}</p>
                                        <p className="text-sm text-gray-600">Date: {new Date(invoiceForm.date).toLocaleDateString('en-GB')}</p>
                                    </div>
                                </div>

                                {/* DIVIDER */}
                                <div className="h-1.5 bg-gray-400 w-full mb-6"></div>

                                {/* BILLED TO */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Billed To:</h3>
                                    <ul className="text-sm text-gray-800 space-y-1 ml-4 list-disc pl-2">
                                        <li><span className="font-bold">Name:</span> {selectedPlayerForInvoice.parentName}</li>
                                        <li><span className="font-bold">Player Name:</span> {selectedPlayerForInvoice.fullName}</li>
                                        <li><span className="font-bold">Phone Number:</span> {selectedPlayerForInvoice.contactNumber}</li>
                                        {selectedPlayerForInvoice.address && (
                                            <li><span className="font-bold">Address:</span> {selectedPlayerForInvoice.address}</li>
                                        )}
                                    </ul>
                                </div>

                                {/* DIVIDER */}
                                <div className="h-1.5 bg-gray-400 w-full mb-6"></div>

                                {/* PROGRAM DETAILS */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Program Details:</h3>
                                    <ul className="text-sm text-gray-800 space-y-1 ml-4 list-disc pl-2">
                                        <li><span className="font-bold">Program Enrolled:</span> Monthly Elite Training</li>
                                        <li><span className="font-bold">Training Location:</span> Playall, Gaur City Sports Complex, Noida</li>
                                        <li><span className="font-bold">Training Days:</span> Monday To Friday</li>
                                        <li><span className="font-bold">Coach:</span> Aditya Anand</li>
                                    </ul>
                                </div>

                                {/* DIVIDER */}
                                <div className="h-1.5 bg-gray-400 w-full mb-6"></div>

                                {/* PAYMENT INFO TABLE */}
                                <h3 className="text-lg font-bold text-gray-900 mb-3">Payment Information</h3>
                                <div className="mb-6 border-2 border-black">
                                    <div className="flex border-b border-black">
                                        <div className="w-1/2 p-2 font-bold border-r border-black pl-4">COACHING FEE</div>
                                        <div className="w-1/2 p-2 font-bold text-center">₹ {taxes.base}</div>
                                    </div>
                                    <div className="flex border-b border-black">
                                        <div className="w-1/2 p-2 font-bold border-r border-black pl-4">CGST @ 9%</div>
                                        <div className="w-1/2 p-2 font-bold text-center">₹ {taxes.cgst}</div>
                                    </div>
                                    <div className="flex border-b border-black">
                                        <div className="w-1/2 p-2 font-bold border-r border-black pl-4">SGST @ 9%</div>
                                        <div className="w-1/2 p-2 font-bold text-center">₹ {taxes.sgst}</div>
                                    </div>
                                    <div className="flex bg-white">
                                        <div className="w-1/2 p-3 font-bold border-r border-black pl-4 text-lg">TOTAL AMOUNT</div>
                                        <div className="w-1/2 p-3 font-bold text-center text-lg">₹ {taxes.total}</div>
                                    </div>
                                </div>

                                <div className="text-sm font-bold text-gray-800 mb-4 ml-2">
                                    <p>• Payment Mode: {invoiceForm.paymentMode}</p>
                                    <p>• Payment Date: {new Date(invoiceForm.date).toLocaleDateString('en-GB')}</p>
                                    <p>• Fee Valid Until: {new Date(invoiceForm.validTill).toLocaleDateString('en-GB')}</p>
                                </div>

                                <div className="mb-8">
                                    <p className="font-bold text-gray-900 border-b-2 border-gray-400 pb-1 text-sm">
                                        Total Amount Received: <span className="font-normal">{numberToWords(taxes.total)}</span>
                                    </p>
                                </div>

                                <div className="mb-12">
                                    <p className="font-bold text-sm text-gray-800">Thank You For Choosing Icarus Football Schools. We look forward to helping you achieve your football goals!</p>
                                </div>

                                {/* SIGNATURE */}
                                <div className="text-sm font-bold text-gray-900">
                                    <p>Authorized By:</p>
                                    <p>Abhishek Begal</p>
                                    <p>Icarus Football Schools</p>
                                    <div className="mt-2 w-48 border-b border-black">
                                         <div className="h-10">
                                             <span className="font-calendary text-3xl ml-4 opacity-70" style={{fontFamily: 'cursive'}}>AbhiB</span>
                                         </div>
                                    </div>
                                    <p className="mt-1">Signature:</p>
                                </div>
                           </div>

                           {/* BOTTOM CURVE */}
                           <div className="absolute bottom-0 left-0 w-full h-12 bg-gray-300" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0)' }}></div>
                       </div>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};
