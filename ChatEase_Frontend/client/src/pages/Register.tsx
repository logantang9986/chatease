import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { MessageCircle, Leaf } from 'lucide-react';
import { toast } from 'sonner';

const Register: React.FC = () => {
    const [email, setEmail] = useState('');
    const [nickName, setNickName] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [countdown, setCountdown] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        let timer: any;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleSendCode = async () => {
        if (!email) {
            toast.error('Please enter your email first');
            return;
        }
        try {
            await api.post(`/user-info/sendCode?email=${email}`);
            setCountdown(60);
            toast.success('Verification code sent!');
        } catch (error: any) {
            console.error('Send code error:', error);
            toast.error(error.response?.data?.errorMsg || 'Failed to send verification code');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post('/user-info/register', {
                email,
                nickName,
                password,
                code,
            });
            if (response.data.success) {
                toast.success('Registration successful! Please login.');
                navigate('/login');
            } else {
                toast.error(response.data.errorMsg || 'Registration failed');
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            toast.error(error.response?.data?.errorMsg || 'An error occurred during registration');
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-stone-50">
            
            {/* 👇 Same Nature Background as Login 👇 */}
            <div className="absolute inset-0 w-full h-full">
                <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-emerald-400/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] bg-teal-600/20 rounded-full blur-[120px]"></div>
                <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] bg-white/40 rounded-full blur-[100px]"></div>
            </div>

            <div className="max-w-md w-full space-y-6 bg-white/60 backdrop-blur-2xl border border-white/60 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative z-10">
                <div className="flex flex-col items-center">
                    <div className="h-14 w-14 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 mb-4 transform -rotate-6">
                        <MessageCircle size={28} />
                    </div>
                    <h2 className="text-center text-3xl font-bold text-stone-800 tracking-tight">
                        Join ChatEase
                    </h2>
                    <p className="mt-2 text-center text-sm text-stone-500 font-medium flex items-center gap-2">
                        Start your natural conversation <Leaf size={14} className="text-emerald-500" />
                    </p>
                </div>

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                required
                                className="block w-full px-4 py-3 bg-white/50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                id="nickname"
                                name="nickname"
                                type="text"
                                required
                                className="block w-full px-4 py-3 bg-white/50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                                placeholder="Nickname"
                                value={nickName}
                                onChange={(e) => setNickName(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="block w-full px-4 py-3 bg-white/50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <input
                                id="code"
                                name="code"
                                type="text"
                                required
                                className="block w-full px-4 py-3 bg-white/50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                                placeholder="Code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={handleSendCode}
                                disabled={countdown > 0}
                                className={`whitespace-nowrap px-4 py-3 border border-transparent text-sm font-bold rounded-xl text-white ${countdown > 0
                                    ? 'bg-stone-400 cursor-not-allowed'
                                    : 'bg-stone-800 hover:bg-emerald-600'
                                    } transition-all duration-200`}
                            >
                                {countdown > 0 ? `${countdown}s` : 'Get Code'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-stone-900 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-900 shadow-lg transition-all duration-300 hover:shadow-emerald-500/30 hover:-translate-y-0.5"
                    >
                        Create Account
                    </button>

                    <div className="text-sm text-center">
                        <span className="text-stone-500">Already have an account? </span>
                        <Link to="/login" className="font-bold text-emerald-600 hover:text-emerald-500 transition-colors">
                            Sign in
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;