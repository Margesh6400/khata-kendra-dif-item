import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Phone, User, ChevronRight, FileStack, Loader2, X, CheckSquare, Square } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useSettings } from "../contexts/SettingsContext";
import { supabase } from "../utils/supabase";
import Navbar from "../components/Navbar";
import toast, { Toaster } from "react-hot-toast";
import { ClientFormData } from "../components/ClientForm";

interface ClientCardProps {
  client: ClientFormData;
  balance?: number;
  onClick: () => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, balance, onClick }) => {
  const { t } = useLanguage();
  return (
    <button
      onClick={onClick}
      className="p-3 text-left transition-all bg-white border border-gray-200 shadow-sm sm:p-4 lg:p-5 group rounded-lg sm:rounded-xl hover:shadow-md hover:border-blue-500 touch-manipulation active:scale-[0.98]"
    >
      <div className="flex items-center gap-2 mb-2 sm:gap-3 sm:mb-3">
        <div className="p-1.5 sm:p-2 transition-colors bg-blue-100 rounded-md sm:rounded-lg group-hover:bg-blue-200">
          <User className="w-4 h-4 text-blue-600 sm:w-5 sm:h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 truncate transition-colors sm:text-base lg:text-lg group-hover:text-blue-600">
            {client.client_nic_name}
            {client.is_hidden && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 bg-gray-100 rounded">
                Hidden
              </span>
            )}
          </h4>
          <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 truncate">{client.client_name}</p>
        </div>
        {balance !== undefined && balance > 0 && (
          <div className="text-right mr-2">
            <span className="block text-[10px] text-gray-400 font-medium uppercase tracking-wider">{t('payable')}</span>
            <span className="text-xs font-bold text-red-600 sm:text-sm">₹{balance.toLocaleString('en-IN')}</span>
          </div>
        )}
        <ChevronRight className="flex-shrink-0 w-4 h-4 text-gray-400 transition-transform sm:w-5 sm:h-5 group-hover:translate-x-1" />
      </div>
      <div className="pt-2 mt-2 space-y-1 border-t border-gray-100 sm:pt-3 sm:mt-3 sm:space-y-1.5 lg:space-y-2">
        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs lg:text-sm text-gray-600">
          <MapPin className="flex-shrink-0 w-3 h-3 text-gray-400 sm:w-3.5 sm:h-3.5" />
          <span className="truncate">{client.site}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs lg:text-sm text-gray-600">
          <Phone className="flex-shrink-0 w-3 h-3 text-gray-400 sm:w-3.5 sm:h-3.5" />
          <span className="truncate">{client.primary_phone_number}</span>
        </div>
      </div>
    </button>
  );
};

export default function Billing() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { enableCategorySeparation, activeCategory } = useSettings();
  const [clients, setClients] = useState<ClientFormData[]>([]);
  const [clientBalances, setClientBalances] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchClients();
  }, []);

  // Step 1: open the picker with every client pre-selected
  const openClientPicker = () => {
    if (isGeneratingAll) return;
    setSelectedClientIds(new Set(clients.map((c) => c.id || "").filter(Boolean)));
    setShowClientPicker(true);
  };

  const toggleClientSelection = (clientId: string) => {
    setSelectedClientIds((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  };

  // Step 2: trigger the same edge function the monthly cron runs, limited to
  // the checked clients. Idempotent: clients already billed through the
  // previous month are skipped, so extra clicks are harmless. Bills land as
  // drafts marked generated_by='manual'.
  const handleGenerateAllBills = async () => {
    if (isGeneratingAll || selectedClientIds.size === 0) return;

    setShowClientPicker(false);
    setIsGeneratingAll(true);
    const loadingToast = toast.loading(t("creatingBills"));
    try {
      const { data, error } = await supabase.functions.invoke("generate-monthly-bills", {
        body: { client_ids: Array.from(selectedClientIds) },
      });
      if (error) throw error;

      const createdCount = data?.created?.length || 0;
      const errorCount = data?.errors?.length || 0;
      toast.success(
        `${createdCount} bills created, ${data?.skipped?.length || 0} skipped` +
          (data?.continued ? " (still processing more…)" : ""),
        { duration: 6000 }
      );
      if (errorCount > 0) {
        console.error("Bill generation errors:", data.errors);
        toast.error(`${errorCount} clients failed — check console`, { duration: 8000 });
      }
      fetchClients(); // refresh balances shown on the cards
    } catch (error) {
      console.error("Error generating bills:", error);
      toast.error("Failed to generate bills");
    } finally {
      toast.dismiss(loadingToast);
      setIsGeneratingAll(false);
    }
  };

  const fetchClients = async () => {
    try {
      let clientsQuery = supabase.from("clients").select("*");
      let billsQuery = supabase.from("bills").select("client_id, due_payment, to_date, created_at");

      if (enableCategorySeparation && activeCategory) {
        billsQuery = billsQuery.eq('category', activeCategory);
      }

      const { data: clientsData, error } = await clientsQuery
        .order("client_nic_name", { ascending: true });

      if (error) throw error;
      setClients(clientsData || []);

      // Fetch latest balances from generated bills only
      const { data: bills, error: billsError } = await billsQuery
        .order('to_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (!billsError && bills) {
        const balanceMap: Record<string, number> = {};
        
        // Initialize balanceMap with each client's previous_pending_amount
        if (clientsData) {
          clientsData.forEach(client => {
            balanceMap[client.id] = client.previous_pending_amount || 0;
          });
        }

        const seenClients = new Set<string>();

        // Get the latest bill's due_payment for each client
        bills.forEach(bill => {
          if (bill.client_id && !seenClients.has(bill.client_id)) {
            balanceMap[bill.client_id] = bill.due_payment || 0;
            seenClients.add(bill.client_id);
          }
        });
        setClientBalances(balanceMap);
      }
    } catch (error) {
      toast.error("Error fetching clients");
      console.error("Error fetching clients:", error);
    }
  };

  const handleClientSelect = (clientId: string) => {
    navigate(`/billing/create/${clientId}`);
  };

  const filteredClients = clients.filter((client) =>
    client.client_nic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.primary_phone_number.includes(searchQuery)
  ).sort((a, b) => {
    if (!searchQuery.trim()) return 0; // Keep original order if no search

    const query = searchQuery.toLowerCase().trim();
    const aNic = a.client_nic_name.toLowerCase();
    const bNic = b.client_nic_name.toLowerCase();

    // Helper to extract numeric ID
    const getID = (str: string) => {
      const m = str.match(/^(\d+)/);
      return m ? m[1] : '';
    };

    const aId = getID(aNic);
    const bId = getID(bNic);

    // EXACT ID MATCH PRIORITY
    const aExactId = aId === query;
    const bExactId = bId === query;

    if (aExactId && !bExactId) return -1;
    if (bExactId && !aExactId) return 1;

    // STARTS WITH PRIORITY
    const aStarts = aNic.startsWith(query);
    const bStarts = bNic.startsWith(query);

    if (aStarts && !bStarts) return -1;
    if (bStarts && !aStarts) return 1;

    return 0;
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1 w-full ml-0 overflow-y-auto pt-[72px] lg:pt-0 lg:ml-64 h-[100dvh]">
        <div className="container max-w-6xl px-4 py-4 mx-auto sm:px-6 lg:px-8 sm:py-6 lg:py-8">
          <div className="items-center justify-between hidden p-4 mb-4 bg-white border border-gray-200 sm:flex rounded-xl">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 lg:text-xl">{t("selectClient")}</h3>
              <p className="mt-0.5 text-xs text-gray-500 lg:text-sm">{t('billingSubtitle')}</p>
            </div>
            <button
              onClick={openClientPicker}
              disabled={isGeneratingAll}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation active:scale-95"
            >
              {isGeneratingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileStack className="w-4 h-4" />}
              {isGeneratingAll ? t("creatingBills") : t("createAllBills")}
            </button>
          </div>

          <div className="space-y-3 sm:space-y-4 lg:space-y-6">
            <button
              onClick={openClientPicker}
              disabled={isGeneratingAll}
              className="flex items-center justify-center w-full gap-2 px-4 py-2.5 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg sm:hidden hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation active:scale-95"
            >
              {isGeneratingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileStack className="w-4 h-4" />}
              {isGeneratingAll ? t("creatingBills") : t("createAllBills")}
            </button>
            <div className="relative">
              <Search className="absolute text-gray-400 transform -translate-y-1/2 left-2.5 sm:left-3 top-1/2 w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchClients") || "Search clients..."}
                className="w-full py-2 sm:py-2.5 lg:py-3 pl-8 sm:pl-10 pr-3 sm:pr-4 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
              />
            </div>

            {searchQuery && (
              <div className="px-3 py-1.5 sm:px-4 sm:py-2 border border-blue-200 rounded-lg bg-blue-50">
                <p className="text-[10px] sm:text-xs lg:text-sm text-blue-700">
                  {t('clientsFound')}: <span className="font-semibold">{filteredClients.length}</span>
                </p>
              </div>
            )}

            {filteredClients.length === 0 ? (
              <div className="p-8 text-center bg-white border border-gray-200 rounded-lg shadow-sm sm:p-12 lg:p-16 sm:rounded-xl">
                <div className="inline-flex items-center justify-center w-12 h-12 mb-3 bg-gray-100 rounded-full sm:w-14 sm:h-14 sm:mb-4 lg:w-16 lg:h-16">
                  <User className="w-6 h-6 text-gray-400 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-gray-900 sm:text-base lg:text-lg">{t('noClientsFound')}</h3>
                <p className="mb-3 text-[10px] sm:text-xs lg:text-sm text-gray-500 sm:mb-4">
                  {t('tryAdjustingSearch')}
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-blue-600 transition-colors rounded-lg hover:text-blue-700 hover:bg-blue-50 touch-manipulation active:scale-95"
                >
                  {t('clearSearch')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-2 lg:grid-cols-3 lg:gap-4">
                {filteredClients.map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    balance={clientBalances[client.id || '']}
                    onClick={() => handleClientSelect(client.id || "")}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Client picker for bulk bill generation */}
      {showClientPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={() => setShowClientPicker(false)}>
          <div
            className="flex flex-col w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl max-h-[85dvh] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="text-base font-semibold text-gray-900 sm:text-lg">{t("selectClientsForBilling") || "Select clients for billing"}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedClientIds.size} / {clients.length}
                </p>
              </div>
              <button
                onClick={() => setShowClientPicker(false)}
                className="p-2 text-gray-400 rounded-lg hover:bg-gray-100 hover:text-gray-600 touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 px-4 py-2 border-b border-gray-100">
              <button
                onClick={() => setSelectedClientIds(new Set(clients.map((c) => c.id || "").filter(Boolean)))}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 rounded-lg hover:bg-blue-50 touch-manipulation"
              >
                <CheckSquare className="w-3.5 h-3.5" /> {t("selectAllClients") || "Select all"}
              </button>
              <button
                onClick={() => setSelectedClientIds(new Set())}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 rounded-lg hover:bg-gray-100 touch-manipulation"
              >
                <Square className="w-3.5 h-3.5" /> {t("deselectAllClients") || "Deselect all"}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {clients.map((client) => {
                const id = client.id || "";
                const checked = selectedClientIds.has(id);
                return (
                  <label
                    key={id}
                    className={`flex items-center gap-3 p-3 mb-1 rounded-lg cursor-pointer transition-colors touch-manipulation ${checked ? "bg-blue-50" : "hover:bg-gray-50"}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleClientSelection(id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-gray-900 truncate">
                        {client.client_nic_name}
                        {client.is_hidden && (
                          <span className="ml-2 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 bg-gray-100 rounded">Hidden</span>
                        )}
                      </span>
                      <span className="block text-xs text-gray-500 truncate">{client.client_name} · {client.site}</span>
                    </div>
                    {clientBalances[id] > 0 && (
                      <span className="text-xs font-bold text-red-600">₹{clientBalances[id].toLocaleString("en-IN")}</span>
                    )}
                  </label>
                );
              })}
            </div>

            <div className="flex gap-2 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowClientPicker(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 touch-manipulation active:scale-95"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleGenerateAllBills}
                disabled={selectedClientIds.size === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation active:scale-95"
              >
                <FileStack className="w-4 h-4" />
                {t("createAllBills")} ({selectedClientIds.size})
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  );
}
