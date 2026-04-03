import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { MessageCircle, Loader2, Leaf } from 'lucide-react';
import { toast } from 'sonner';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post('/user-info/login', { email, password });
            if (response.data.success) {
                localStorage.setItem('token', response.data.data.token);
                setIsLoading(true);
                // Delay to show the success state
                setTimeout(() => {
                    navigate('/');
                }, 1500);
            } else {
                toast.error(response.data.errorMsg || 'Login failed');
            }
        } catch (error: any) {
            console.error('Login error:', error);
            toast.error(error.response?.data?.errorMsg || 'An error occurred during login');
        }
    };

    return (
        // MODIFICATION: Changed min-h-screen to h-full to fit within parent container
        <div className="h-full w-full flex items-center justify-center relative overflow-hidden bg-stone-50">

            {/* 👇👇👇 Pure CSS Nature Background (No Images) 👇👇👇 */}
            <div className="absolute inset-0 w-full h-full">
                {/* Deep Forest Green Blob (Top Left) */}
                <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-emerald-400/20 rounded-full blur-[120px] animate-pulse"></div>
                {/* Warm Sunlight Blob (Bottom Right) */}
                <div className="absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] bg-teal-600/20 rounded-full blur-[120px]"></div>
                {/* Subtle Mist (Center) */}
                <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] bg-white/40 rounded-full blur-[100px]"></div>
            </div>

            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 z-50 bg-stone-50/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <div className="bg-white p-4 rounded-full shadow-xl mb-4">
                        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                    </div>
                    <p className="text-xl font-bold text-emerald-800 tracking-tight">Welcome back!</p>
                </div>
            )}

            {/* Login Card */}
            <div className="max-w-md w-full space-y-8 bg-white/60 backdrop-blur-2xl border border-white/60 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative z-10 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                <div className="flex flex-col items-center">
                    <div className="h-14 w-14 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 mb-5 transform -rotate-6">
                        <MessageCircle size={28} />
                    </div>
                    <h2 className="text-center text-3xl font-bold text-stone-800 tracking-tight">
                        ChatEase
                    </h2>
                    <p className="mt-2 text-center text-sm text-stone-500 font-medium flex items-center gap-2">
                        Connect naturally <Leaf size={14} className="text-emerald-500" />
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email-address" className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 ml-1">
                                Email
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="block w-full px-4 py-3.5 bg-white/50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all duration-200"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 ml-1">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="block w-full px-4 py-3.5 bg-white/50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all duration-200"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Link
                            to="/forgot-password"
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-500 transition-colors"
                        >
                            Forgot Password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-stone-900 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-900 shadow-lg transition-all duration-300 hover:shadow-emerald-500/30 hover:-translate-y-0.5"
                    >
                        Sign In
                    </button>

                    <div className="text-sm text-center pt-2">
                        <span className="text-stone-500">New to ChatEase? </span>
                        <Link to="/register" className="font-bold text-emerald-600 hover:text-emerald-500 transition-colors">
                            Create an account
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
