import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { FileText, ShieldAlert, Clock, Play, Calendar, Search, Trash2, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const History = ({ user }) => {
    const navigate = useNavigate();
    const [historyFiles, setHistoryFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAlerts, setFilterAlerts] = useState('All');
    const [visibleCount, setVisibleCount] = useState(6);

    // Fetch initial data
    const fetchHistory = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const q = query(
                collection(db, "summaries"),
                where("userId", "==", user.uid)
            );
            const querySnapshot = await getDocs(q);
            const histories = [];
            querySnapshot.forEach((d) => {
                histories.push({ id: d.id, ...d.data() });
            });

            histories.sort((a, b) => {
                if (!a.createdAt) return 1;
                if (!b.createdAt) return -1;
                return b.createdAt.toMillis() - a.createdAt.toMillis();
            });

            setHistoryFiles(histories);
        } catch (error) {
            console.error("Error fetching history: ", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchHistory();
    }, [user]);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to permanently delete this incident record?")) return;
        try {
            await deleteDoc(doc(db, "summaries", id));
            setHistoryFiles(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error("Error deleting document: ", error);
            alert("Failed to delete record.");
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return "Processing...";
        const date = timestamp.toDate();
        return date.toLocaleDateString() + " • " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleViewReport = (item) => {
        navigate('/analysis', {
            state: {
                results: {
                    summary_video: item.videoUrl,
                    text_summary: item.textSummary,
                    stats: item.stats,
                    events: item.events || [],
                },
                originalVideoUrl: item.videoUrl
            }
        });
    };

    // Client-side filtering
    const filteredHistory = useMemo(() => {
        return historyFiles.filter(item => {
            const textMatch = (item.textSummary || '').toLowerCase().includes(searchTerm.toLowerCase());
            const idMatch = item.id.toLowerCase().includes(searchTerm.toLowerCase());
            const alertsCount = item.stats?.suspicious_count || 0;

            let alertMatch = true;
            if (filterAlerts === 'High') alertMatch = alertsCount > 5;
            if (filterAlerts === 'Medium') alertMatch = alertsCount > 0 && alertsCount <= 5;
            if (filterAlerts === 'None') alertMatch = alertsCount === 0;

            return (textMatch || idMatch) && alertMatch;
        });
    }, [historyFiles, searchTerm, filterAlerts]);

    const displayedHistory = filteredHistory.slice(0, visibleCount);

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                    <Clock className="text-indigo-600" size={32} /> Security Archive
                </h2>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Review saved surveillance logs</p>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search narrative summary or ID..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setVisibleCount(6); }}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium outline-none text-sm placeholder:text-slate-400 text-slate-700"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter size={18} className="text-slate-400 shrink-0" />
                    <select
                        value={filterAlerts}
                        onChange={(e) => { setFilterAlerts(e.target.value); setVisibleCount(6); }}
                        className="w-full md:w-auto px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="All">All Threat Levels</option>
                        <option value="High">High Threats (&gt;5 alerts)</option>
                        <option value="Medium">Medium Threats (1-5 alerts)</option>
                        <option value="None">No Threats Found</option>
                    </select>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="w-full bg-white p-12 rounded-3xl border border-slate-200 flex flex-col items-center justify-center min-h-[400px]">
                    <span className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></span>
                    <p className="text-slate-500 font-bold tracking-wide">Retrieving secured archives...</p>
                </div>
            ) : filteredHistory.length === 0 ? (
                <div className="w-full bg-white p-12 rounded-3xl border border-slate-200 flex flex-col items-center justify-center min-h-[400px] text-center">
                    <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-6">
                        <FileText className="text-slate-300" size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-700 mb-2">No Records Found</h3>
                    <p className="text-slate-500 font-medium max-w-sm">
                        {historyFiles.length === 0
                            ? 'You have not saved any surveillance summaries to the cloud yet.'
                            : 'No records match your active search and filter criteria.'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayedHistory.map((item) => (
                            <div key={item.id} className="bg-slate-800 rounded-3xl border border-slate-700/50 shadow-sm overflow-hidden flex flex-col group transition-all hover:shadow-lg hover:border-indigo-500/50 hover:-translate-y-1 cursor-pointer" onClick={() => handleViewReport(item)}>
                                {/* Header / Video Status */}
                                <div className="h-32 bg-slate-900 shrink-0 relative flex items-center justify-center overflow-hidden">
                                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-slate-900 to-slate-900"></div>
                                    {item.videoUrl ? (
                                        <video
                                            src={item.videoUrl}
                                            controls={false}
                                            className="w-full h-full absolute object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                                        />
                                    ) : (
                                        <div className="text-slate-400 font-bold justify-center items-center flex flex-col gap-2 relative z-10 scale-90">
                                            <FileText size={32} className="text-slate-500" />
                                            <span className="text-[10px] uppercase tracking-widest text-slate-500">Text Log Only</span>
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3">
                                        <span className="bg-white/10 backdrop-blur border border-white/20 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1.5">
                                            <Play size={10} className="fill-white" /> Archived
                                        </span>
                                    </div>

                                    {/* Delete Action */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                        className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 shadow-md"
                                        title="Delete Record"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                {/* Details */}
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="mb-4">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                                            Ref: {item.id.slice(0, 8)}
                                        </h3>
                                        <p className="flex items-center gap-1.5 text-slate-800 font-black text-sm">
                                            <Calendar size={14} className="text-indigo-500" /> {formatDate(item.createdAt)}
                                        </p>
                                    </div>

                                    {/* Tags */}
                                    {item.stats && (
                                        <div className="flex gap-2 mb-4 shrink-0 overflow-x-auto custom-scrollbar pb-1">
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border flex items-center gap-1.5 whitespace-nowrap
                                                ${item.stats.suspicious_count > 0 ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}
                                            `}>
                                                <ShieldAlert size={10} className={item.stats.suspicious_count > 0 ? 'text-orange-500' : 'text-emerald-500'} />
                                                Threats: {item.stats.suspicious_count}
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-wider bg-slate-50 text-slate-600 px-2 py-1 rounded border border-slate-200 whitespace-nowrap">
                                                Frames: {item.stats.total_keyframes}
                                            </span>
                                        </div>
                                    )}

                                    {/* Narrative snippet */}
                                    <div className="mt-auto bg-slate-50 p-4 rounded-2xl border border-slate-100 relative">
                                        <div className="absolute top-0 left-4 w-6 h-1 bg-indigo-500 rounded-b-full"></div>
                                        <p className="text-xs text-slate-600 font-medium line-clamp-4 leading-relaxed mt-1">
                                            {item.textSummary || "No textual summary provided."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {visibleCount < filteredHistory.length && (
                        <div className="flex justify-center mt-10">
                            <button
                                onClick={() => setVisibleCount(prev => prev + 6)}
                                className="bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 font-bold px-8 py-3 rounded-xl shadow-sm transition-all"
                            >
                                Load More Records
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default History;
