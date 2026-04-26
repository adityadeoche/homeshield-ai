import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Analysis from './pages/Analysis';
import History from './pages/History';

function App() {
    const [user, setUser] = useState(null);
    const [authChecking, setAuthChecking] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthChecking(false);
        });
        return () => unsubscribe();
    }, []);

    if (authChecking) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-bold flex-col gap-4">
                <span className="w-12 h-12 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></span>
                <p className="tracking-widest uppercase text-sm">Initializing Security Protocol...</p>
            </div>
        );
    }

    return (
        <Router>
            <Routes>
                {!user ? (
                    <>
                        <Route path="/login" element={<Login onLoginSuccess={setUser} />} />
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </>
                ) : (
                    <Route element={<MainLayout user={user} />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/analysis" element={<Analysis user={user} />} />
                        <Route path="/history" element={<History user={user} />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Route>
                )}
            </Routes>
        </Router>
    );
}

export default App;
