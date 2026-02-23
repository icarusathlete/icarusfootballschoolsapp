import React, { useState } from 'react';
import { AuthService } from '../services/authService';
import { loginPlayer } from '../services/userService';
import { StorageService } from '../services/storageService';
import { Trophy, Lock, User as UserIcon, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
    onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isResetting, setIsResetting] = useState(false);

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Ensure data is initialized before attempting login (for local fallback if needed)
        StorageService.init();

        // Use Firebase Login
        const result = await loginPlayer(username, password);

        if (result.success && result.user) {
            onLogin(result.user as User);
        } else {
            setError(result.message || 'Invalid username or password. Please try again.');
        }
        setLoading(false);
    };

    const handleReset = () => {
        if (window.confirm("This will clear all local data and restore defaults. Proceed?")) {
            setIsResetting(true);
            StorageService.clearData();
            setTimeout(() => {
                setIsResetting(false);
                window.location.reload();
            }, 1000);
        }
    };

    return (
        <div className="min-h-screen bg-icarus-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-icarus-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />

            <div className="mb-8 text-center text-white relative z-10">
                <div className="p-4 bg-white/10 backdrop-blur-xl rounded-3xl inline-block border border-white/20 mb-6 shadow-2xl">
                    <Trophy className="w-16 h-16 text-yellow-400" />
                </div>
                <h1 className="text-5xl font-black tracking-tighter italic" style={{ fontFamily: 'Orbitron' }}>
                    ICARUS <span className="text-icarus-500 font-normal">SCHOOLS</span>
                </h1>
                <p className="text-icarus-100 uppercase tracking-[0.4em] text-[10px] font-bold mt-2 opacity-70">Football Management Portal</p>
            </div>

            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 border border-white/20">
                <div className="p-10">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
                    <p className="text-gray-400 text-sm mb-8">Sign in to access your dashboard.</p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in">
                            <AlertTriangle size={18} />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Username</label>
                            <div className="relative">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-icarus-500 focus:ring-4 focus:ring-icarus-500/10 outline-none transition-all font-medium"
                                    placeholder="Username"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-icarus-500 focus:ring-4 focus:ring-icarus-500/10 outline-none transition-all font-medium"
                                    placeholder="Password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-icarus-600 hover:bg-icarus-700 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center space-x-3 mt-8 shadow-xl shadow-icarus-600/20 active:scale-95 italic"
                            style={{ fontFamily: 'Orbitron' }}
                        >
                            <span>SIGN IN</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </form>
                </div>

                <div className="bg-gray-50/50 p-6 flex flex-col items-center border-t border-gray-100">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Demo Access</div>
                    <div className="flex flex-wrap justify-center gap-3">
                        <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-[10px] font-mono text-gray-600 shadow-sm">admin / admin</span>
                        <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-[10px] font-mono text-gray-600 shadow-sm">coach / coach</span>
                        <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-[10px] font-mono text-gray-600 shadow-sm">leo / leo</span>
                    </div>

                    <button
                        onClick={handleReset}
                        disabled={isResetting}
                        className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-icarus-600 transition-colors"
                    >
                        <RefreshCw size={12} className={isResetting ? 'animate-spin' : ''} />
                        {isResetting ? 'RESETTING...' : 'RESET APP DATABASE'}
                    </button>
                </div>
            </div>

            <p className="mt-8 text-white/30 text-[10px] font-bold uppercase tracking-[0.3em] relative z-10">
                &copy; 2025 ICARUS ATHLETIC SYSTEMS
            </p>
        </div>
    );
};