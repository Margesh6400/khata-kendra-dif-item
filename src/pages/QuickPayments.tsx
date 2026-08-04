import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Search, 
  Plus, 
  CheckCircle, 
  Clock, 
  Calendar, 
  Wallet, 
  ArrowUpRight, 
  TrendingUp, 
  X, 
  Download, 
  Filter, 
  Send, 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  Trash2, 
  Building2, 
  DollarSign, 
  Check, 
  RefreshCw 
} from 'lucide-react';
import { supabase } from '../utils/supabase';
import Navbar from '../components/Navbar';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import toast, { Toaster } from 'react-hot-toast';
import { formatLocalDate } from '../utils/dateUtils';

interface ClientPaymentCardData {
  id: string;
  client_nic_name: string;
  client_name: string;
  site: string;
  primary_phone_number: string;
  due_payment: number;
  total_payment: number;
  latest_bill_number?: string;
  category?: string;
}

interface PaymentRecord {
  id: string;
  bill_number: string;
  date: string;
  note: string;
  amount: number;
  payment_method: string;
  client_name?: string;
  client_nic_name?: string;
  site?: string;
  phone?: string;
}

export default function QuickPayments() {
  const { t, language } = useLanguage();
  const { enableCategorySeparation, enableCategoryClientSeparation, activeCategory } = useSettings();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'cards' | 'ledger'>('cards');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'settled'>('all');

  // Payment Ledger State
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerMethodFilter, setLedgerMethodFilter] = useState<string>('all');
  const [ledgerDateFilter, setLedgerDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('month');

  // Client Cards State
  const [clients, setClients] = useState<ClientPaymentCardData[]>([]);
  const [stats, setStats] = useState({
    todayCollected: 0,
    monthCollected: 0,
    totalOutstanding: 0,
  });

  // Modal State for Quick Payment Entry
  const [selectedClient, setSelectedClient] = useState<ClientPaymentCardData | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'upi' | 'cheque' | 'card' | 'other'>('cash');
  const [paymentNote, setPaymentNote] = useState<string>('');
  const [savingPayment, setSavingPayment] = useState<boolean>(false);
  const [showPayModal, setShowPayModal] = useState<boolean>(false);

  const isGu = language === 'gu';

  // Load clients and their outstanding balances
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Clients
      let clientQuery = supabase
        .from('clients')
        .select('*')
        .order('client_name', { ascending: true });

      const { data: rawClientsData, error: clientError } = await clientQuery;
      if (clientError) throw clientError;

      let clientsData = (rawClientsData || []).filter((c: any) => c.is_hidden !== true);

      if ((enableCategoryClientSeparation || enableCategorySeparation) && activeCategory) {
        clientsData = clientsData.filter((c: any) =>
          activeCategory === 'shuttering' ? (!c.category || c.category === 'shuttering') : c.category === activeCategory
        );
      }

      // 2. Fetch Latest Bills for calculations
      let billQuery = supabase
        .from('bills')
        .select(`
          id,
          bill_number,
          client_id,
          due_payment,
          total_payment,
          billing_date,
          created_at,
          category
        `);

      if (enableCategorySeparation && activeCategory) {
        billQuery = billQuery.eq('category', activeCategory);
      }

      const { data: billsData, error: billError } = await billQuery;
      if (billError) throw billError;

      const allBills = billsData || [];

      // 3. Fetch Payments History (resilient lookup)
      let paymentsData: any[] = [];
      try {
        const { data: rawPayments, error: pErr } = await supabase
          .from('bill_payments')
          .select('*')
          .order('date', { ascending: false });
        if (!pErr && rawPayments) {
          paymentsData = rawPayments;
        }
      } catch (e) {
        console.warn('Notice loading bill_payments:', e);
      }

      const mappedPayments: PaymentRecord[] = paymentsData.map((p: any) => {
        const bill = allBills.find((b: any) => b.bill_number === p.bill_number);
        const client = clientsData.find((c: any) => c.id === bill?.client_id);
        return {
          id: p.id,
          bill_number: p.bill_number,
          date: p.date,
          note: p.note || '',
          amount: Number(p.amount || 0),
          payment_method: p.payment_method || 'cash',
          client_name: client?.client_name || (isGu ? 'અજ્ઞાત ગ્રાહક' : 'Unknown Client'),
          client_nic_name: client?.client_nic_name || '',
          site: client?.site || '',
          phone: client?.primary_phone_number || '',
        };
      });

      setPaymentRecords(mappedPayments);

      // 4. Calculate client-level summaries
      const clientCards: ClientPaymentCardData[] = (clientsData || []).map((c: any) => {
        const clientBills = allBills.filter((b: any) => b.client_id === c.id);
        const totalDue = clientBills.reduce((sum: number, b: any) => sum + (Number(b.due_payment) || 0), 0);
        const totalPaid = clientBills.reduce((sum: number, b: any) => sum + (Number(b.total_payment) || 0), 0);
        
        // Sort by date to get latest bill number
        const latestBill = [...clientBills].sort((a: any, b: any) => 
          new Date(b.created_at || b.billing_date).getTime() - new Date(a.created_at || a.billing_date).getTime()
        )[0];

        return {
          id: c.id,
          client_nic_name: c.client_nic_name,
          client_name: c.client_name,
          site: c.site || '',
          primary_phone_number: c.primary_phone_number || '',
          due_payment: totalDue,
          total_payment: totalPaid,
          latest_bill_number: latestBill?.bill_number,
        };
      });

      setClients(clientCards);

      // 5. Calculate Metrics
      const todayStr = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const todayCollected = mappedPayments
        .filter((p) => p.date === todayStr)
        .reduce((sum, p) => sum + p.amount, 0);

      const monthCollected = mappedPayments
        .filter((p) => {
          const d = new Date(p.date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + p.amount, 0);

      const totalOutstanding = clientCards.reduce((sum, c) => sum + (c.due_payment || 0), 0);

      setStats({
        todayCollected,
        monthCollected,
        totalOutstanding,
      });

    } catch (err: any) {
      console.error('Error loading quick payments data:', err);
      toast.error(isGu ? 'ડેટા લોડ કરવામાં નિષ્ફળતા' : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [enableCategorySeparation, enableCategoryClientSeparation, activeCategory]);

  // Open Pay Modal for a Client
  const handleOpenPayModal = (clientCard: ClientPaymentCardData) => {
    setSelectedClient(clientCard);
    setPaymentAmount('');
    setPaymentNote('');
    setPaymentMethod('cash');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setShowPayModal(true);
  };

  // Submit Quick Payment
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    const amountNum = parseFloat(paymentAmount);
    if (!amountNum || amountNum <= 0) {
      toast.error(isGu ? 'કૃપા કરીને માન્ય રકમ દાખલ કરો' : 'Please enter a valid amount');
      return;
    }

    setSavingPayment(true);
    const toastId = toast.loading(isGu ? 'ચૂકવણી જમા થઈ રહી છે...' : 'Recording payment...');

    try {
      // Find open bill or recent bill for this client
      let targetBillNumber = selectedClient.latest_bill_number;

      if (!targetBillNumber) {
        // Fetch or find any bill for client
        const { data: clientBills } = await supabase
          .from('bills')
          .select('bill_number, due_payment, total_payment')
          .eq('client_id', selectedClient.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (clientBills && clientBills.length > 0) {
          targetBillNumber = clientBills[0].bill_number;
        }
      }

      if (!targetBillNumber) {
        toast.error(isGu ? 'આ ગ્રાહક માટે કોઈ બિલ મળ્યું નથી. પ્રથમ બિલ બનાવો.' : 'No bill found for this client. Please create a bill first.', { id: toastId });
        setSavingPayment(false);
        return;
      }

      // 1. Insert into bill_payments table
      try {
        await supabase.from('bill_payments').insert({
          bill_number: targetBillNumber,
          date: paymentDate,
          note: paymentNote || (isGu ? 'ઝડપી ચૂકવણી' : 'Quick Payment'),
          amount: amountNum,
          payment_method: paymentMethod,
        });
      } catch (e) {
        console.warn('bill_payments table insert warning:', e);
      }

      // 2. Fetch current bill values and update bills table
      const { data: currentBill } = await supabase
        .from('bills')
        .select('total_payment, due_payment')
        .eq('bill_number', targetBillNumber)
        .single();

      if (currentBill) {
        const newPaid = Number(currentBill.total_payment || 0) + amountNum;
        const newDue = Math.max(0, Number(currentBill.due_payment || 0) - amountNum);

        await supabase
          .from('bills')
          .update({
            total_payment: newPaid,
            due_payment: newDue,
          })
          .eq('bill_number', targetBillNumber);
      }

      toast.success(isGu ? 'ચૂકવણી સફળતાપૂર્વક જમા થઈ ગઈ!' : 'Payment recorded successfully!', { id: toastId });

      // Offer WhatsApp Receipt
      const phone = selectedClient.primary_phone_number;
      if (phone && window.confirm(isGu ? 'શું તમે વોટ્સએપ પર ચૂકવણીની રસીદ મોકલવા માંગો છો?' : 'Do you want to send WhatsApp payment receipt to customer?')) {
        const cleanPhone = phone.replace(/\D/g, "");
        const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        const formattedDate = formatLocalDate(paymentDate, 'dd/MM/yyyy');

        const message = isGu
          ? `પ્રિય ${selectedClient.client_name},
આપની ચૂકવણી સફળતાપૂર્વક જમા થયેલ છે:

ચૂકવેલ રકમ: ₹${amountNum.toLocaleString('en-IN')}
તારીખ: ${formattedDate}
મેથડ: ${paymentMethod.toUpperCase()}
બિલ નંબર: #${targetBillNumber}
બાકી રકમ: ₹${Math.max(0, selectedClient.due_payment - amountNum).toLocaleString('en-IN')}

આભાર,
ખાતા કેન્દ્ર`
          : `Dear ${selectedClient.client_name},
We have received your payment:

Amount Paid: ₹${amountNum.toLocaleString('en-IN')}
Date: ${formattedDate}
Method: ${paymentMethod.toUpperCase()}
Bill #: #${targetBillNumber}
Remaining Balance: ₹${Math.max(0, selectedClient.due_payment - amountNum).toLocaleString('en-IN')}

Thank you,
Khata Kendra`;

        window.open(`https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(message)}`, "_blank");
      }

      setShowPayModal(false);
      loadData(); // Refresh UI
    } catch (err: any) {
      console.error('Error saving payment:', err);
      toast.error(isGu ? 'ચૂકવણી જમા કરવામાં ભૂલ આવી' : 'Failed to record payment', { id: toastId });
    } finally {
      setSavingPayment(false);
    }
  };

  // Delete Payment Record from Ledger
  const handleDeletePayment = async (rec: PaymentRecord) => {
    if (!window.confirm(isGu ? `શું તમે ₹${rec.amount} ની ચૂકવણી એન્ટ્રી રદ કરવા માંગો છો?` : `Are you sure you want to delete this payment of ₹${rec.amount}?`)) {
      return;
    }

    try {
      const { error } = await supabase.from('bill_payments').delete().eq('id', rec.id);
      if (error) throw error;

      // Re-adjust bill due payment
      const { data: bill } = await supabase.from('bills').select('total_payment, due_payment').eq('bill_number', rec.bill_number).single();
      if (bill) {
        await supabase.from('bills').update({
          total_payment: Math.max(0, Number(bill.total_payment || 0) - rec.amount),
          due_payment: Number(bill.due_payment || 0) + rec.amount,
        }).eq('bill_number', rec.bill_number);
      }

      toast.success(isGu ? 'ચૂકવણી એન્ટ્રી રદ કરી દીધી' : 'Payment record deleted');
      loadData();
    } catch (e) {
      console.error(e);
      toast.error(isGu ? 'રદ કરવામાં નિષ્ફળતા' : 'Failed to delete payment record');
    }
  };

  // Export Payment Ledger CSV
  const handleExportLedger = () => {
    if (filteredLedger.length === 0) {
      toast.error(isGu ? 'ડાઉનલોડ કરવા માટે કોઈ ડેટા નથી' : 'No data to export');
      return;
    }

    const headers = isGu
      ? 'તારીખ,ગ્રાહક નામ,આઈડી,સાઈટ,બિલ નંબર,મેથડ,નોંધ,રકમ'
      : 'Date,Client Name,Client ID,Site,Bill Number,Method,Note,Amount';

    const rows = filteredLedger.map((p) => {
      const esc = (str: any) => `"${String(str || '').replace(/"/g, '""')}"`;
      return [
        esc(formatLocalDate(p.date, 'dd/MM/yyyy')),
        esc(p.client_name),
        esc(p.client_nic_name),
        esc(p.site),
        esc(p.bill_number),
        esc(p.payment_method.toUpperCase()),
        esc(p.note),
        p.amount,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', isGu ? `ચૂકવણી_લેજર_${new Date().toISOString().split('T')[0]}.csv` : `payment_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(isGu ? 'લેજર CSV ડાઉનલોડ થઈ ગયું!' : 'Payment ledger CSV downloaded!');
  };

  // Filtered Client Cards
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.client_nic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.primary_phone_number.includes(searchQuery);

    if (!matchesSearch) return false;
    if (statusFilter === 'due') return client.due_payment > 0;
    if (statusFilter === 'settled') return client.due_payment <= 0;
    return true;
  });

  // Filtered Payment Ledger Records
  const filteredLedger = paymentRecords.filter((rec) => {
    const matchesSearch =
      (rec.client_name || '').toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      (rec.client_nic_name || '').toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      (rec.bill_number || '').toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      (rec.note || '').toLowerCase().includes(ledgerSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (ledgerMethodFilter !== 'all' && rec.payment_method !== ledgerMethodFilter) {
      return false;
    }

    if (ledgerDateFilter !== 'all') {
      const pDate = new Date(rec.date);
      const today = new Date();

      if (ledgerDateFilter === 'today') {
        if (rec.date !== today.toISOString().split('T')[0]) return false;
      } else if (ledgerDateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        if (pDate < weekAgo) return false;
      } else if (ledgerDateFilter === 'month') {
        if (pDate.getMonth() !== today.getMonth() || pDate.getFullYear() !== today.getFullYear()) return false;
      }
    }

    return true;
  });

  const totalLedgerAmount = filteredLedger.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar />
      <Toaster position="top-right" />

      <main className="flex-1 w-full ml-0 overflow-y-auto lg:ml-64 min-h-screen pt-16 lg:pt-4">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4">
        
        {/* Page Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {isGu ? 'ચૂકવણી કલેક્શન & લેજર' : 'Quick Payment Collection'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  {isGu ? 'ગ્રાહક પાસેથી રકમ ઝડપથી જમા કરો અને ચૂકવણી લેજર હિસાબ જુઓ' : 'Instantly record customer payments & view transaction ledger'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Top Summary Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          
          <div className="p-4 bg-white border border-emerald-100 rounded-xl shadow-sm bg-gradient-to-br from-emerald-50/50 to-white">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                {isGu ? 'આજના જમા કલેક્શન' : "Today's Collection"}
              </span>
              <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-emerald-950">
              ₹{stats.todayCollected.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-4 bg-white border border-blue-100 rounded-xl shadow-sm bg-gradient-to-br from-blue-50/50 to-white">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
                {isGu ? 'ચાલુ મહિનાના કલેક્શન' : 'This Month Collection'}
              </span>
              <div className="p-1.5 bg-blue-100 text-blue-700 rounded-md">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-blue-950">
              ₹{stats.monthCollected.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-4 bg-white border border-amber-100 rounded-xl shadow-sm bg-gradient-to-br from-amber-50/50 to-white">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                {isGu ? 'કુલ બાકી લેણી રકમ' : 'Total Pending Due'}
              </span>
              <div className="p-1.5 bg-amber-100 text-amber-700 rounded-md">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-amber-950">
              ₹{stats.totalOutstanding.toLocaleString('en-IN')}
            </p>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-xl p-1.5 shadow-sm">
          <button
            onClick={() => setActiveTab('cards')}
            className={`flex-1 py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'cards'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            {isGu ? '💳 ગ્રાહક ચૂકવણી કાર્ડ્સ' : '💳 Client Payment Cards'}
          </button>
          
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex-1 py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'ledger'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            {isGu ? '📜 ચૂકવણી લેજર (ઈતિહાસ)' : '📜 Payment Ledger History'}
          </button>
        </div>

        {/* TAB 1: CLIENT CARDS FOR QUICK PAYMENTS */}
        {activeTab === 'cards' && (
          <div>
            {/* Search & Filter Bar */}
            <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
              
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isGu ? 'ગ્રાહક શોધો (નામ, આઈડી, સાઈટ, મોબાઈલ)...' : 'Search client (name, ID, site, mobile)...'}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isGu ? `બધા ગ્રાહકો (${clients.length})` : `All Clients (${clients.length})`}
                </button>
                <button
                  onClick={() => setStatusFilter('due')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                    statusFilter === 'due'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  {isGu ? `બાકી વાળા (${clients.filter(c => c.due_payment > 0).length})` : `Pending Only (${clients.filter(c => c.due_payment > 0).length})`}
                </button>
                <button
                  onClick={() => setStatusFilter('settled')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                    statusFilter === 'settled'
                      ? 'bg-green-600 text-white'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {isGu ? `ચૂકવાયેલા (${clients.filter(c => c.due_payment <= 0).length})` : `Settled (${clients.filter(c => c.due_payment <= 0).length})`}
                </button>
              </div>

            </div>

            {/* Client Cards Grid */}
            {loading ? (
              <div className="py-12 text-center text-gray-500">
                <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                {isGu ? 'લોડ થઈ રહ્યું છે...' : 'Loading clients...'}
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="p-12 text-center bg-white border border-gray-200 rounded-xl shadow-sm">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-900">
                  {isGu ? 'કોઈ ગ્રાહક મળ્યો નથી' : 'No Clients Found'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {isGu ? 'તમારા શોધ અથવા ફિલ્ટર્સ બદલીને પ્રયાસ કરો.' : 'Try adjusting your search query or filters.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClients.map((c) => {
                  const hasDue = c.due_payment > 0;

                  return (
                    <div
                      key={c.id}
                      className={`bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col justify-between ${
                        hasDue ? 'border-amber-200' : 'border-gray-200'
                      }`}
                    >
                      <div>
                        {/* Header: Name + ID */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                              hasDue ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {c.client_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 leading-tight">
                                {c.client_name}
                              </h3>
                              <span className="inline-block px-1.5 py-0.5 mt-0.5 text-[10px] font-semibold bg-gray-100 text-gray-700 rounded">
                                ID: {c.client_nic_name}
                              </span>
                            </div>
                          </div>

                          {/* Phone Badge */}
                          {c.primary_phone_number && (
                            <a
                              href={`tel:${c.primary_phone_number}`}
                              className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Call Client"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          )}
                        </div>

                        {/* Details */}
                        <div className="space-y-1.5 text-xs text-gray-600 mb-4 border-t border-gray-100 pt-3">
                          {c.site && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="truncate">{c.site}</span>
                            </div>
                          )}
                          {c.primary_phone_number && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span>{c.primary_phone_number}</span>
                            </div>
                          )}
                        </div>

                        {/* Balance Due Display */}
                        <div className={`p-3 rounded-lg flex items-center justify-between mb-4 ${
                          hasDue ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'
                        }`}>
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-600">
                              {isGu ? 'બાકી રકમ (Balance Due)' : 'Pending Balance'}
                            </p>
                            <p className={`text-base font-extrabold ${hasDue ? 'text-amber-950' : 'text-emerald-950'}`}>
                              ₹{c.due_payment.toLocaleString('en-IN')}
                            </p>
                          </div>
                          {hasDue ? (
                            <span className="px-2 py-1 bg-amber-200/80 text-amber-900 text-[10px] font-bold rounded">
                              {isGu ? 'બાકી' : 'Due'}
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-emerald-200/80 text-emerald-900 text-[10px] font-bold rounded flex items-center gap-1">
                              <Check className="w-3 h-3" /> {isGu ? 'ચૂકવાયેલ' : 'Paid'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Action Button */}
                      <button
                        onClick={() => handleOpenPayModal(c)}
                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        {isGu ? 'ચૂકવણી જમા કરો (Add Payment)' : 'Record Payment'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PAYMENT LEDGER */}
        {activeTab === 'ledger' && (
          <div>
            {/* Filter Bar */}
            <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm mb-6 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
              
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  placeholder={isGu ? 'લેજર માં શોધો (ગ્રાહક, બિલ નંબર, નોંધ)...' : 'Search ledger (client, bill #, note)...'}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Method Filter */}
                <select
                  value={ledgerMethodFilter}
                  onChange={(e) => setLedgerMethodFilter(e.target.value)}
                  className="px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg bg-white font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">{isGu ? 'બધી મેથડ (All Methods)' : 'All Payment Methods'}</option>
                  <option value="cash">{isGu ? 'રોકડ (Cash)' : 'Cash'}</option>
                  <option value="bank">{isGu ? 'બેંક (Bank)' : 'Bank Transfer'}</option>
                  <option value="upi">{isGu ? 'UPI' : 'UPI'}</option>
                  <option value="cheque">{isGu ? 'ચેક (Cheque)' : 'Cheque'}</option>
                  <option value="card">{isGu ? 'કાર્ડ (Card)' : 'Card'}</option>
                  <option value="other">{isGu ? 'અન્ય (Other)' : 'Other'}</option>
                </select>

                {/* Date Filter */}
                <select
                  value={ledgerDateFilter}
                  onChange={(e) => setLedgerDateFilter(e.target.value as any)}
                  className="px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg bg-white font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="today">{isGu ? 'આજે (Today)' : 'Today'}</option>
                  <option value="week">{isGu ? 'આ અઠવાડિયે (This Week)' : 'This Week'}</option>
                  <option value="month">{isGu ? 'આ મહિને (This Month)' : 'This Month'}</option>
                  <option value="all">{isGu ? 'બધો ઈતિહાસ (All Time)' : 'All Time'}</option>
                </select>

                {/* Export CSV Button */}
                <button
                  onClick={handleExportLedger}
                  className="px-3 py-2 text-xs sm:text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  {isGu ? 'CSV ડાઉનલોડ' : 'Export CSV'}
                </button>
              </div>

            </div>

            {/* Ledger Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-700">{isGu ? 'તારીખ' : 'Date'}</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">{isGu ? 'ગ્રાહક વિગત' : 'Client'}</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">{isGu ? 'બિલ નંબર' : 'Bill #'}</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">{isGu ? 'મેથડ' : 'Method'}</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">{isGu ? 'નોંધ' : 'Note'}</th>
                      <th className="px-4 py-3 font-semibold text-right text-emerald-800">{isGu ? 'રકમ' : 'Amount'}</th>
                      <th className="px-4 py-3 font-semibold text-center text-gray-700">{isGu ? 'એક્શન' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredLedger.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                          {isGu ? 'કોઈ ચૂકવણી હિસાબ મળ્યો નથી' : 'No payment records found'}
                        </td>
                      </tr>
                    ) : (
                      filteredLedger.map((rec) => (
                        <tr key={rec.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                            {formatLocalDate(rec.date, 'dd/MM/yyyy')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-gray-900">{rec.client_name}</div>
                            <div className="text-[11px] text-gray-500">ID: {rec.client_nic_name} {rec.site ? `• ${rec.site}` : ''}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800 rounded">
                              #{rec.bill_number}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-800 rounded uppercase">
                              {rec.payment_method}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">
                            {rec.note || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right font-extrabold text-emerald-700 text-base">
                            +₹{rec.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleDeletePayment(rec)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {filteredLedger.length > 0 && (
                    <tfoot className="bg-emerald-50/80 border-t-2 border-emerald-200 font-extrabold text-emerald-950">
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-right">
                          {isGu ? 'કુલ કલેક્શન રકમ:' : 'Total Filtered Amount:'}
                        </td>
                        <td className="px-4 py-3 text-right text-lg text-emerald-900">
                          ₹{totalLedgerAmount.toLocaleString('en-IN')}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}

        </div>
      </main>

      {/* QUICK PAYMENT ENTRY MODAL */}
      {showPayModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
            
            {/* Modal Header */}
            <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                <h3 className="text-base font-bold">
                  {isGu ? 'ચૂકવણી જમા કરો' : 'Record Payment'}
                </h3>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="p-1 text-emerald-100 hover:text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSavePayment} className="p-4 space-y-4">
              
              {/* Client Info Summary */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                <p className="text-sm font-bold text-gray-900">{selectedClient.client_name}</p>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>ID: {selectedClient.client_nic_name}</span>
                  <span className="font-semibold text-amber-700">
                    {isGu ? 'હાલની બાકી:' : 'Current Due:'} ₹{selectedClient.due_payment.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block mb-1 text-xs font-bold text-gray-700">
                  {isGu ? 'ચૂકવેલ રકમ (Amount ₹) *' : 'Amount Paid (₹) *'}
                </label>
                <div className="relative">
                  <span className="absolute text-gray-500 font-bold transform -translate-y-1/2 left-3.5 top-1/2 text-lg">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    autoFocus
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full py-2.5 pl-9 pr-3 text-lg font-bold border-2 border-emerald-500 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block mb-1 text-xs font-semibold text-gray-700">
                  {isGu ? 'ચૂકવણી તારીખ *' : 'Payment Date *'}
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full py-2 px-3 text-xs sm:text-sm border border-gray-300 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>

              {/* Method */}
              <div>
                <label className="block mb-1 text-xs font-semibold text-gray-700">
                  {isGu ? 'ચૂકવણી મેથડ *' : 'Payment Method *'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cash', label: isGu ? 'રોકડ' : 'Cash' },
                    { id: 'bank', label: isGu ? 'બેંક' : 'Bank' },
                    { id: 'upi', label: 'UPI' },
                    { id: 'cheque', label: isGu ? 'ચેક' : 'Cheque' },
                    { id: 'card', label: isGu ? 'કાર્ડ' : 'Card' },
                    { id: 'other', label: isGu ? 'અન્ય' : 'Other' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`py-2 px-2 text-xs font-bold rounded-lg border transition-all ${
                        paymentMethod === m.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note / Ref */}
              <div>
                <label className="block mb-1 text-xs font-semibold text-gray-700">
                  {isGu ? 'નોંધ / રેફરન્સ (અન્ય વિગત)' : 'Note / Reference (Optional)'}
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder={isGu ? 'ઉદા. યુપીઆઈ લિંક, ચેક નંબર, રોકડ જમા...' : 'e.g. UPI Ref #, Cheque No...'}
                  className="w-full py-2 px-3 text-xs sm:text-sm border border-gray-300 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs sm:text-sm rounded-xl transition-colors"
                >
                  {isGu ? 'રદ કરો' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={savingPayment}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-[0.98]"
                >
                  {savingPayment ? (isGu ? 'જમા થઈ રહ્યું છે...' : 'Saving...') : (isGu ? 'ચૂકવણી જમા કરો' : 'Confirm Payment')}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
