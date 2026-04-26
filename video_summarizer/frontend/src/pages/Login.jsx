import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { ShieldAlert, ArrowRight, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLoginSuccess }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let userCredential;
            if (isRegistering) {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
            } else {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
            }
            onLoginSuccess(userCredential.user);
            navigate('/dashboard');
        } catch (err) {
            console.error("Firebase Auth Error:", err);
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError("Invalid email address or password.");
            } else if (err.code === 'auth/email-already-in-use') {
                setError("This email address is already registered.");
            } else if (err.code === 'auth/weak-password') {
                setError("Password must be at least 6 characters.");
            } else {
                setError("An error occurred during authentication. Please try again.");
            }
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-indigo-500/50 selection:text-white">
            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="bg-slate-800 rounded-3xl shadow-2xl p-10 border border-slate-700/50 relative overflow-hidden">
                    {/* Grid background effect */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                    <div className="text-center mb-10 relative z-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-500/10 mb-6 shadow-inner ring-1 ring-indigo-500/20">
                            <ShieldAlert className="w-10 h-10 text-indigo-400" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight mb-2">
                            {isRegistering ? 'Register Operator' : 'System Login'}
                        </h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-900/50 inline-block px-3 py-1 rounded-full border border-slate-700">
                            HomeShield AI Platform
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 text-red-400 p-4 rounded-xl text-sm font-bold mb-6 border border-red-500/20 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-300 relative z-10">
                            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-6 relative z-10">
                        <div>
                            <label className="block text-xs font-bold tracking-wider uppercase text-slate-400 mb-2">Operator Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-5 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-200 font-medium placeholder:text-slate-500"
                                placeholder="operator@security.local"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold tracking-wider uppercase text-slate-400 mb-2">Password Array</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-5 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-200 font-medium placeholder:text-slate-500"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 transition-all disabled:bg-slate-700 disabled:text-slate-500 disabled:transform-none flex items-center justify-center gap-2 group mt-8 relative overflow-hidden"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></span>
                                    Authenticating...
                                </span>
                            ) : (
                                <>
                                    {isRegistering ? 'Register & Access' : 'Access Dashboard'}
                                    <ArrowRight size={18} className="text-indigo-200 group-hover:text-white transition-colors group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-700/50 flex flex-col items-center gap-4 relative z-10">
                        <button
                            type="button"
                            onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                            className="text-sm font-bold text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-2"
                        >
                            {isRegistering ? (
                                "Already have an account? Sign In"
                            ) : (
                                <><UserPlus size={16} /> Create New Operator Account</>
                            )}
                        </button>
                    </div>
                </div>

                <p className="text-center text-xs font-bold text-slate-500 tracking-wider uppercase mt-8 opacity-50">
                    Authorized personnel only. All access attempts are logged.
                </p>
            </div>
        </div>
    );
};

export default Login;
