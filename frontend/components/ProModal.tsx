import React, { useState, useEffect } from 'react';
import { X, Check, Zap, ChevronLeft, CreditCard, Smartphone, Wallet, Loader2, AlertCircle } from 'lucide-react';

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProModal: React.FC<ProModalProps> = ({ isOpen, onClose }) => {
  const [view, setView] = useState<'marketing' | 'payment'>('marketing');
  const [method, setMethod] = useState<'card' | 'upi' | 'apps'>('card');
  const [walletApp, setWalletApp] = useState('Google Pay');
  const [isProcessing, setIsProcessing] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState<{
    name: string;
    price: number;
    interval: string;
  }>({ name: 'Pro Monthly', price: 300, interval: 'mo' });

  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: ''
  });
  
  const [upiId, setUpiId] = useState('');
  
  const [formErrors, setFormErrors] = useState({
    number: '',
    expiry: '',
    cvv: '',
    upi: ''
  });

  useEffect(() => {
    if (isOpen) {
      setView('marketing');
      setMethod('card');
      setIsProcessing(false);
      setCardData({ number: '', expiry: '', cvv: '' });
      setUpiId('');
      setFormErrors({ number: '', expiry: '', cvv: '', upi: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (value.length > 16) value = value.slice(0, 16);
    setCardData(prev => ({ ...prev, number: value }));
    if (formErrors.number) setFormErrors(prev => ({ ...prev, number: '' }));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/\D/g, '');
    let formatted = clean;
    if (clean.length >= 2) {
        formatted = clean.substring(0, 2) + (clean.length > 2 ? '/' + clean.substring(2, 4) : '');
    }
    if (formatted.length > 5) return;
    setCardData(prev => ({ ...prev, expiry: formatted }));
    if (formErrors.expiry) setFormErrors(prev => ({ ...prev, expiry: '' }));
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardData(prev => ({ ...prev, cvv: value }));
    if (formErrors.cvv) setFormErrors(prev => ({ ...prev, cvv: '' }));
  };

  const handleUpiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUpiId(e.target.value);
    setFormErrors(prev => ({ ...prev, upi: '' }));
  };

  const validatePaymentForm = () => {
    const errors = { number: '', expiry: '', cvv: '', upi: '' };
    let isValid = true;

    if (method === 'card') {
        if (!cardData.number || cardData.number.length !== 16) {
            errors.number = 'Invalid card number';
            isValid = false;
        }
        if (!cardData.expiry || cardData.expiry.length !== 5) {
            errors.expiry = 'Invalid expiry';
            isValid = false;
        }
        if (!cardData.cvv || cardData.cvv.length < 3) {
            errors.cvv = 'Invalid CVV';
            isValid = false;
        }
    } else if (method === 'upi') {
        if (!upiId || !upiId.includes('@')) {
            errors.upi = 'Invalid UPI ID';
            isValid = false;
        }
    }

    setFormErrors(errors);
    return isValid;
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePaymentForm()) return;

    setIsProcessing(true);
    setTimeout(() => {
        setIsProcessing(false);
        setCardData({ number: '', expiry: '', cvv: '' });
        setUpiId('');
        alert(`Payment successful via ${method.toUpperCase()} for ${selectedPlan.name}!`);
        onClose();
    }, 2000);
  };

  const selectPlan = (name: string, price: number, interval: string) => {
      if (price === 0) {
          alert("Free Trial activated!");
          onClose();
          return;
      }
      setSelectedPlan({ name, price, interval });
      setView('payment');
  };

  // Payment View
  if (view === 'payment') {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in font-sans">
            <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden relative flex flex-col transition-all w-[400px] h-[520px]">
                 
                 {/* Header */}
                 <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/5">
                    <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setView('marketing')}
                          className="p-1.5 -ml-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="font-semibold text-gray-900 dark:text-white">Checkout</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">₹{selectedPlan.price}</div>
                 </div>

                 <div className="flex-1 flex flex-col p-6">
                    <div className="flex p-1 bg-gray-100 dark:bg-[#2c2c2e] rounded-xl mb-6">
                        {['card', 'upi', 'apps'].map((m) => (
                           <button 
                             key={m}
                             onClick={() => { setMethod(m as any); setFormErrors({ number: '', expiry: '', cvv: '', upi: '' }); }}
                             className={`flex-1 flex items-center justify-center py-2 rounded-lg text-xs font-medium transition-all capitalize ${method === m ? 'bg-white dark:bg-[#1c1c1e] text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                           >
                             {m === 'card' && <CreditCard className="w-3.5 h-3.5 mr-1.5" />}
                             {m === 'upi' && <Smartphone className="w-3.5 h-3.5 mr-1.5" />}
                             {m === 'apps' && <Wallet className="w-3.5 h-3.5 mr-1.5" />}
                             {m}
                           </button>
                        ))}
                    </div>

                    <form onSubmit={handlePayment} className="flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                            {method === 'card' && (
                                <div className="space-y-4 animate-fade-in">
                                    <div>
                                        <input 
                                          type="text" 
                                          value={cardData.number}
                                          onChange={handleCardNumberChange}
                                          placeholder="Card Number" 
                                          className={`w-full px-4 py-3 bg-gray-50 dark:bg-[#161618] border rounded-xl text-sm outline-none focus:ring-1 transition-colors dark:text-white ${formErrors.number ? 'border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-blue-500'}`} 
                                          maxLength={16}
                                        />
                                        {formErrors.number && <p className="text-[10px] text-red-500 mt-1 ml-1">{formErrors.number}</p>}
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="w-1/2">
                                            <input 
                                              type="text" 
                                              value={cardData.expiry}
                                              onChange={handleExpiryChange}
                                              placeholder="MM/YY" 
                                              className={`w-full px-4 py-3 bg-gray-50 dark:bg-[#161618] border rounded-xl text-sm outline-none focus:ring-1 transition-colors dark:text-white ${formErrors.expiry ? 'border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-blue-500'}`} 
                                              maxLength={5}
                                            />
                                        </div>
                                        <div className="w-1/2">
                                            <input 
                                              type="text" 
                                              value={cardData.cvv}
                                              onChange={handleCvvChange}
                                              placeholder="CVV" 
                                              className={`w-full px-4 py-3 bg-gray-50 dark:bg-[#161618] border rounded-xl text-sm outline-none focus:ring-1 transition-colors dark:text-white ${formErrors.cvv ? 'border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-blue-500'}`} 
                                              maxLength={4}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {method === 'upi' && (
                                <div className="space-y-4 animate-fade-in">
                                    <input 
                                      type="text" 
                                      value={upiId}
                                      onChange={handleUpiChange}
                                      placeholder="username@bank" 
                                      className={`w-full px-4 py-3 bg-gray-50 dark:bg-[#161618] border rounded-xl text-sm outline-none focus:ring-1 transition-colors dark:text-white ${formErrors.upi ? 'border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-blue-500'}`}
                                    />
                                    {formErrors.upi && <p className="text-[10px] text-red-500 ml-1">{formErrors.upi}</p>}
                                </div>
                            )}

                            {method === 'apps' && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="relative">
                                        <select 
                                            value={walletApp}
                                            onChange={(e) => setWalletApp(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#161618] border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer dark:text-white"
                                        >
                                            <option>Google Pay</option>
                                            <option>PhonePe</option>
                                            <option>Paytm</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            disabled={isProcessing}
                            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 mt-6"
                        >
                            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <><span>Pay ₹{selectedPlan.price}</span><Zap className="w-4 h-4 fill-current" /></>
                            )}
                        </button>
                    </form>
                 </div>
            </div>
        </div>
      );
  }

  // Marketing View
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl w-full max-w-5xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden relative flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full z-10 transition-colors">
            <X className="w-5 h-5 text-gray-700 dark:text-white" />
        </button>

        <div className="p-8 pb-6 text-center bg-[#f9fafb] dark:bg-[#1c1c1e] border-b border-gray-100 dark:border-white/5">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Upgrade your workspace</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Choose the plan that fits your workflow.</p>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-[#0f0f10] overflow-y-auto">
            {/* Free */}
            <div className="rounded-2xl p-6 border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] flex flex-col hover:border-gray-300 dark:hover:border-white/20 transition-all">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Free Trial</h3>
                    <div className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">₹0 <span className="text-sm font-normal text-gray-500">/ 7 days</span></div>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                    {['Gemini Flash Model', '50 Queries / Day', 'Standard Speed'].map((feat, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>{feat}</span>
                        </li>
                    ))}
                </ul>
                <button 
                    onClick={() => selectPlan('Free Trial', 0, '7 days')}
                    className="w-full py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white font-medium rounded-xl transition-colors"
                >
                    Start Trial
                </button>
            </div>

            {/* Pro */}
            <div className="rounded-2xl p-6 border-2 border-blue-600 dark:border-blue-500 bg-white dark:bg-[#1c1c1e] flex flex-col relative shadow-xl shadow-blue-500/10 transform md:-translate-y-2">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                    Popular
                </div>
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        Pro Monthly <Zap className="w-4 h-4 text-yellow-500 fill-current" />
                    </h3>
                    <div className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">₹300 <span className="text-sm font-normal text-gray-500">/ mo</span></div>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                    {['Gemini 1.5 Pro', 'Unlimited Queries', 'Priority Support', 'Early Access'].map((feat, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                            <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <span className="font-medium">{feat}</span>
                        </li>
                    ))}
                </ul>
                <button 
                    onClick={() => selectPlan('Pro Monthly', 300, 'mo')}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/25"
                >
                    Upgrade Monthly
                </button>
            </div>

            {/* Yearly */}
            <div className="rounded-2xl p-6 border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] flex flex-col hover:border-purple-500 dark:hover:border-purple-400 transition-all">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pro Yearly</h3>
                    <div className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">₹3000 <span className="text-sm font-normal text-gray-500">/ yr</span></div>
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 mt-2 bg-green-50 dark:bg-green-900/20 inline-block px-2 py-1 rounded">Save ₹600/yr</p>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                    {['All Pro Features', '2 Months Free', 'Higher Usage Limits', 'Profile Badge'].map((feat, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                            <Check className="w-4 h-4 text-purple-500 flex-shrink-0" />
                            <span>{feat}</span>
                        </li>
                    ))}
                </ul>
                <button 
                    onClick={() => selectPlan('Pro Yearly', 3000, 'yr')}
                    className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-black font-medium rounded-xl transition-colors"
                >
                    Upgrade Yearly
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};