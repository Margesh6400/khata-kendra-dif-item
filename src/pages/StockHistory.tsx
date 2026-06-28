import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Search, Trash2 } from "lucide-react";
import { PLATE_SIZES } from "../components/ItemsTable";
import Navbar from "../components/Navbar";
import { supabase } from "../utils/supabase";
import toast, { Toaster } from "react-hot-toast";

import { useLanguage } from "../contexts/LanguageContext";

interface StockHistoryItem {
    id: string;
    date: string;
    type: "add" | "remove";
    party_name: string;
    note: string;
    amount: number;
    items: { [key: number]: number };
}

const StockHistory: React.FC = () => {
    const { t } = useLanguage();
    const [history, setHistory] = useState<StockHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<"all" | "add" | "remove">("all");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchHistory = async () => {
        setLoading(true);
        let query = supabase
            .from("stock_history")
            .select("*")
            .order("date", { ascending: false });

        if (filterType !== "all") {
            query = query.eq("type", filterType);
        }

        if (searchQuery) {
            // ILIKE filter for party_name or note
            query = query.or(`party_name.ilike.%${searchQuery}%,note.ilike.%${searchQuery}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching stock history:", error);
            toast.error("Failed to fetch history");
        } else {
            setHistory(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchHistory();
    }, [filterType, searchQuery]);

    const handleDelete = async (item: StockHistoryItem) => {
        if (!window.confirm(t("confirmDeleteStockHistory"))) return;

        try {
            setLoading(true);
            const loadingToast = toast.loading(t("reversingStock"));

            // 1. Revert stock changes
            // Iterate sequentially to avoid race conditions on DB if any, though parallel is likely fine here.
            // Using Promise.all for speed.
            const updates = Object.entries(item.items).map(async ([sizeStr, qty]) => {
                const size = parseInt(sizeStr);
                const quantity = qty as number;

                if (quantity <= 0) return;

                // Fetch current stock
                const { data: currentStock, error: fetchError } = await supabase
                    .from("stock")
                    .select("total_stock")
                    .eq("size", size)
                    .single();

                if (fetchError) throw fetchError;

                const currentTotal = currentStock.total_stock;
                // Reverse logic:
                // If deleted item was 'add', we subtract.
                // If deleted item was 'remove', we add.
                const newTotal = item.type === 'add'
                    ? Math.max(0, currentTotal - quantity)
                    : currentTotal + quantity;

                const { error: updateError } = await supabase
                    .from("stock")
                    .update({ total_stock: newTotal })
                    .eq("size", size);

                if (updateError) throw updateError;
            });

            await Promise.all(updates);

            // 2. Delete history entry
            const { error: deleteError } = await supabase
                .from("stock_history")
                .delete()
                .eq("id", item.id);

            if (deleteError) throw deleteError;

            toast.dismiss(loadingToast);
            toast.success(t("entryDeletedStockReversed"));
            fetchHistory(); // Refresh list

        } catch (error) {
            console.error("Error deleting stock history:", error);
            toast.error(t("failedToDeleteEntry"));
            setLoading(false); // Ensure loading is off if error
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Toaster position="top-center" />
            <Navbar />
            <main className="flex-1 w-full ml-0 overflow-auto pt-14 pb-20 sm:pt-0 sm:pb-0 lg:ml-64">
                <div className="p-4 sm:p-6 lg:p-8">
                    <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="hidden sm:block">
                            <div className="flex items-center gap-2 mb-1">
                                <Link to="/stock" className="text-gray-500 hover:text-gray-700 transition-colors">
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                                <h2 className="text-2xl font-bold text-gray-900">{t("stockHistory")}</h2>
                            </div>
                            <p className="text-sm text-gray-600 pl-7">{t("trackStockAdjustments")}</p>
                        </div>

                        <div className="hidden sm:flex flex-col sm:flex-row gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={t("searchPartyOrNote")}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
                                />
                            </div>
                            <div className="flex items-center bg-white border border-gray-300 rounded-lg p-1">
                                <button
                                    onClick={() => setFilterType("all")}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filterType === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {t("all")}
                                </button>
                                <button
                                    onClick={() => setFilterType("add")}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filterType === 'add' ? 'bg-green-100 text-green-800' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {t("added")}
                                </button>
                                <button
                                    onClick={() => setFilterType("remove")}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filterType === 'remove' ? 'bg-red-100 text-red-800' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {t("removed")}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">{t("loadingHistory")}</div>
                        ) : history.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">{t("noRecordsFound")}</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">{t("date")}</th>
                                            <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">{t("total")}</th>
                                            {PLATE_SIZES.map((size) => (
                                                <th key={size} className="px-2 py-3 font-medium text-gray-500 text-center whitespace-nowrap min-w-[60px]">
                                                    {size}
                                                </th>
                                            ))}
                                            <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">{t("partyOrReason")}</th>
                                            <th className="px-4 py-3 font-medium text-gray-500 text-right whitespace-nowrap">{t("amount")}</th>
                                            <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">{t("note")}</th>
                                            <th className="px-4 py-3 font-medium text-gray-500 text-center whitespace-nowrap">{t("action")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {history.map((item) => {
                                            const totalQty = Object.values(item.items).reduce((sum, qty) => sum + (qty || 0), 0);
                                            const isAdd = item.type === 'add';

                                            return (
                                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-4 text-gray-600 whitespace-nowrap">
                                                        {format(new Date(item.date), "dd MMM yyyy")}
                                                    </td>
                                                    <td className={`px-4 py-4 font-bold whitespace-nowrap ${isAdd ? 'text-green-600' : 'text-red-600'}`}>
                                                        {isAdd ? '+' : '-'}{totalQty}
                                                    </td>
                                                    {PLATE_SIZES.map((_, index) => {
                                                        const qty = item.items[index + 1];
                                                        return (
                                                            <td key={index} className="px-2 py-4 text-center text-gray-600 font-medium">
                                                                {qty ? qty : ""}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="px-4 py-4 text-gray-900 font-medium whitespace-nowrap">
                                                        {item.party_name}
                                                    </td>
                                                    <td className="px-4 py-4 text-right font-medium text-gray-900 whitespace-nowrap">
                                                        {item.amount && item.amount > 0 ? `₹${item.amount.toLocaleString()}` : '-'}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-500 max-w-[200px] truncate">
                                                        {item.note || '-'}
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <button
                                                            onClick={() => handleDelete(item)}
                                                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title={t("deleteAndReverseStock")}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StockHistory;
