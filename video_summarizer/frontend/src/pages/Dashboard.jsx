import React, { useState } from 'react';
import { UploadCloud, FileVideo, Settings2, Activity } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const [file, setFile] = useState(null);
    const [fileUrl, setFileUrl] = useState(null);
    const [loading, setLoading] = useState(false);

    // Configurations
    const [confidence, setConfidence] = useState(0.20);
    const [fpsMode, setFpsMode] = useState(1);
    const [summaryLength, setSummaryLength] = useState("Medium");
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setFileUrl(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleUpload = async () => {
        if (!file) return alert("Please select a valid surveillance video file first!");

        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("confidence", confidence);
        formData.append("fps_sample", fpsMode);
        formData.append("summary_length", summaryLength);

        try {
            // Append missing zone_limit
            formData.append("zone_limit", 0.3);

            // Reverted back to localhost:8001 to resolve cross-origin preflight locks on user's current session
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8001";
            const res = await axios.post(`${apiUrl}/api/upload`, formData);
            // Navigate to Analysis page with results
            navigate('/analysis', { state: { results: res.data, originalVideoUrl: fileUrl } });
        } catch (err) {
            console.error(err);
            alert("Error processing video. Is the uvicorn backend running on port 8001?");
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-100 tracking-tight">Deploy Analysis</h1>
                <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest">Select footage & configure model parameters</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Upload Dropzone */}
                <div className="lg:col-span-8 bg-slate-800 border border-slate-700/50 rounded-3xl p-8 shadow-lg flex flex-col items-center justify-center text-center relative overflow-hidden group min-h-[400px]">
                    <div className="absolute top-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_auto] animate-gradient"></div>

                    <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300">
                        <UploadCloud size={48} className="text-indigo-400" />
                    </div>

                    <h2 className="text-2xl font-black text-slate-100 tracking-tight mb-2">Initialize Inference Pipeline</h2>
                    <p className="text-slate-400 font-medium max-w-md mb-8">
                        Upload surveillance footage to run YOLOv11m weapon detection and MOHASA-optimized behavioral analysis.
                    </p>

                    <label className="relative cursor-pointer group/btn">
                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className={`px-8 py-4 rounded-xl border-2 border-dashed font-bold transition-all text-sm uppercase tracking-wide
                            ${file ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-slate-900/50 border-slate-600 text-slate-400 group-hover/btn:bg-slate-700 group-hover/btn:border-slate-500 group-hover/btn:text-slate-300'}
                        `}>
                            {file ? `File: ${file.name}` : 'Browse Files to Upload'}
                        </div>
                    </label>

                    {file && (
                        <button
                            onClick={handleUpload}
                            disabled={loading}
                            className="mt-8 px-10 py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 hover:shadow-indigo-500/30 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:transform-none disabled:shadow-none flex items-center gap-3 w-full max-w-xs justify-center uppercase tracking-widest text-sm"
                        >
                            {loading ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></span>
                                    Processing Feed...
                                </>
                            ) : (
                                <>
                                    <FileVideo size={20} /> Execute Analysis
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Configuration Sidebar */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="bg-slate-800 p-8 rounded-3xl shadow-lg border border-slate-700/50 sticky top-6">
                        <h3 className="text-xl font-black text-slate-100 mb-6 flex items-center gap-3 tracking-tight">
                            <Settings2 className="text-indigo-400" /> Model Hyperparameters
                        </h3>

                        <div className="space-y-8">
                            {/* Confidence Slider */}
                            <div className="group">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                        Confidence Target
                                        <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-slate-300 cursor-help" title="Minimum certainty required for object detection. Set higher to reduce false positives.">?</div>
                                    </label>
                                    <span className="text-xs font-black text-indigo-300 bg-indigo-500/20 px-2 py-1 rounded border border-indigo-500/30">{confidence.toFixed(2)}</span>
                                </div>
                                <input
                                    type="range" min="0.1" max="0.9" step="0.1" value={confidence}
                                    onChange={e => setConfidence(parseFloat(e.target.value))}
                                    className="w-full accent-indigo-500 h-2 bg-slate-700 rounded-lg appearance-none outline-none cursor-pointer"
                                />
                            </div>

                            {/* FPS Select */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                                    Inference Rate (FPS)
                                    <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-slate-300 cursor-help" title="Number of frames sampled per second. 1 FPS is recommended for standard tasks.">?</div>
                                </label>
                                <select
                                    value={fpsMode} onChange={e => setFpsMode(parseInt(e.target.value))}
                                    className="w-full bg-slate-900 border border-slate-600 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 block p-3.5 font-bold transition-all outline-none"
                                >
                                    <option value={1}>1 FPS (Optimized Default)</option>
                                    <option value={2}>2 FPS (Dense Action)</option>
                                    <option value={5}>5 FPS (Heavy Compute)</option>
                                </select>
                            </div>

                            {/* Summary Length */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                                    Context Depth
                                    <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-slate-300 cursor-help" title="Determines how many surrounding frames are included around an event.">?</div>
                                </label>
                                <select
                                    value={summaryLength} onChange={e => setSummaryLength(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 block p-3.5 font-bold transition-all outline-none"
                                >
                                    <option value="Short">Brief / Aggressive (~30%)</option>
                                    <option value="Medium">Standard / Optimal (~50%)</option>
                                    <option value="Long">Extended Context (~70%)</option>
                                </select>
                            </div>
                        </div>

                        {/* Status Panel Indicator */}
                        <div className="mt-8 pt-6 border-t border-slate-700/50 flex items-start gap-4">
                            <div className="bg-blue-500/10 text-blue-400 p-2.5 rounded-xl border border-blue-500/30 shrink-0">
                                <Activity strokeWidth={2.5} size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-200">MOHASA Enabled</h4>
                                <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">
                                    Motion Optimization & Heuristics applied. Skips static frames automatically.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
