import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';
import { MessageCircle, Loader2, Leaf, ArrowLeft, KeyRound, Mail } from 'lucide-react';
import { toast } from 'sonner';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [step, setStep] = useState<1 | 2>(1); // 1: Send Code, 2: Reset Password
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const { sendVerificationCode, resetPassword } = useChatStore();

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter your email');
            return;
        }

        setIsLoading(true);
        // Type 1 for Forgot Password
        const success = await sendVerificationCode(email, 1);
        setIsLoading(false);

        if (success) {
            setStep(2);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || !newPassword) {
            toast.error('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        const success = await resetPassword({ email, code, newPassword });
        setIsLoading(false);

        if (success) {
            setTimeout(() => {
                navigate('/login');
            }, 1500);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-stone-50">

            {/* Background Effects (Consistent with Login) */}
            <div className="absolute inset-0 w-full h-full">
                <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-emerald-400/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] bg-teal-600/20 rounded-full blur-[120px]"></div>
                <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] bg-white/40 rounded-full blur-[100px]"></div>
            </div>

            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 z-50 bg-stone-50/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <div className="bg-white p-4 rounded-full shadow-xl mb-4">
                        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                    </div>
                    <p className="text-xl font-bold text-emerald-800 tracking-tight">Processing...</p>
                </div>
            )}

            {/* Main Card */}
            <div className="max-w-md w-full space-y-8 bg-white/60 backdrop-blur-2xl border border-white/60 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative z-10 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                <div className="flex flex-col items-center">
                    <div className="h-14 w-14 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 mb-5 transform -rotate-6">
                        <MessageCircle size={28} />
                    </div>
                    <h2 className="text-center text-3xl font-bold text-stone-800 tracking-tight">
                        Reset Password
                    </h2>
                    <p className="mt-2 text-center text-sm text-stone-500 font-medium flex items-center gap-2">
                        Recover your account <Leaf size={14} className="text-emerald-500" />
                    </p>
                </div>

                {step === 1 ? (
                    // Step 1: Input Email
                    <form className="mt-8 space-y-6" onSubmit={handleSendCode}>
                        <div>
                            <label htmlFor="email" className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 ml-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    className="block w-full px-4 py-3.5 pl-11 bg-white/50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all duration-200"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <Mail className="absolute left-4 top-3.5 text-stone-400" size={18} />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-stone-900 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-900 shadow-lg transition-all duration-300 hover:shadow-emerald-500/30 hover:-translate-y-0.5"
                        >
                            Send Verification Code
                        </button>
                    </form>
                ) : (
                    // Step 2: Input Code & New Password
                    <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="code" className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 ml-1">
                                    Verification Code
                                </label>
                                <input
                                    id="code"
                                    type="text"
                                    required
                                    className="block w-full px-4 py-3.5 bg-white/50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all duration-200"
                                    placeholder="Enter 6-digit code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="new-password" className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 ml-1">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="new-password"
                                        type="password"
                                        required
                                        className="block w-full px-4 py-3.5 pl-11 bg-white/50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all duration-200"
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                    <KeyRound className="absolute left-4 top-3.5 text-stone-400" size={18} />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-stone-900 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-900 shadow-lg transition-all duration-300 hover:shadow-emerald-500/30 hover:-translate-y-0.5"
                        >
                            Reset Password
                        </button>
                    </form>
                )}

                <div className="text-center pt-2">
                    <Link to="/login" className="inline-flex items-center text-sm font-bold text-stone-500 hover:text-stone-800 transition-colors">
                        <ArrowLeft size={16} className="mr-1" /> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;