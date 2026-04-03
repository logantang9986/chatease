import React, { useState, useEffect } from 'react';
import { X, User, Lock, Camera, Save, Loader2, Copy, Check } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { toast } from 'sonner';

// US States Data
const US_STATES = [
    { code: '', name: 'Select State' },
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' }
];

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { currentUser, updateCurrentUser, updatePassword, uploadFile } = useChatStore();
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
    const [isLoading, setIsLoading] = useState(false);

    // State for copy feedback
    const [isCopied, setIsCopied] = useState(false);

    // Profile State
    const [nickName, setNickName] = useState('');
    const [avatar, setAvatar] = useState('');
    const [personalSignature, setPersonalSignature] = useState('');
    const [sex, setSex] = useState(0);
    const [areaName, setAreaName] = useState('');

    // Password State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Sync state when modal opens or user updates
    useEffect(() => {
        if (isOpen && currentUser) {
            setNickName(currentUser.nickName || '');
            setAvatar(currentUser.avatar || '');
            setPersonalSignature(currentUser.personalSignature || '');
            // Ensure sex is set correctly (default to 0 if undefined)
            setSex(currentUser.sex !== undefined ? currentUser.sex : 0);
            setAreaName(currentUser.areaName || '');
        }
    }, [isOpen, currentUser]);

    // Handle file upload for avatar
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const toastId = toast.loading('Uploading avatar...');
        try {
            const url = await uploadFile(file);
            if (url) {
                setAvatar(url);
                toast.success('Avatar uploaded successfully');
            } else {
                toast.error('Failed to upload avatar');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error uploading avatar');
        } finally {
            toast.dismiss(toastId);
        }
    };

    // Handle Profile Update
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const success = await updateCurrentUser({
                nickName,
                avatar,
                personalSignature,
                sex,
                areaName
            });
            if (success) {
                onClose();
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Password Update
    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);
        try {
            const success = await updatePassword(newPassword);
            if (success) {
                setNewPassword('');
                setConfirmPassword('');
                onClose();
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Copy User ID to clipboard
    const handleCopyId = () => {
        if (currentUser?.userId) {
            navigator.clipboard.writeText(currentUser.userId);
            setIsCopied(true);
            toast.success('User ID copied to clipboard');
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

            {/* Fixed: Added max-h-[80vh] and overflow-y-auto to fix height issue */}
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up max-h-[80vh] overflow-y-auto custom-scrollbar flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0 sticky top-0 z-20 backdrop-blur-md">
                    <h2 className="text-lg font-bold text-slate-800">Settings</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 gap-2 border-b border-slate-100 flex-shrink-0">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'profile'
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        <User size={18} />
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'security'
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        <Lock size={18} />
                        Security
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'profile' ? (
                        <form onSubmit={handleUpdateProfile} className="space-y-5">
                            {/* Avatar Section */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative group">
                                    <img
                                        src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(nickName || 'User')}&background=random`}
                                        alt="Avatar"
                                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg group-hover:opacity-90 transition-opacity"
                                    />
                                    <label className="absolute inset-0 flex items-center justify-center bg-black/30 text-white opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity backdrop-blur-[2px]">
                                        <Camera size={24} />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                    </label>
                                </div>

                                {/* User ID Display */}
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full cursor-pointer hover:bg-slate-200 transition-colors" onClick={handleCopyId}>
                                    <span className="text-xs font-mono text-slate-500 font-medium">ID: {currentUser?.userId}</span>
                                    {isCopied ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-slate-400" />}
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nickname</label>
                                    <input
                                        type="text"
                                        value={nickName}
                                        onChange={(e) => setNickName(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm"
                                        placeholder="Your nickname"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                                    <div className="flex gap-3">
                                        {[0, 1].map((option) => (
                                            <button
                                                key={option}
                                                type="button"
                                                onClick={() => setSex(option)}
                                                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${sex === option
                                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {option === 1 ? 'Male' : 'Female'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* NEW: Area Selector */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Location (State)</label>
                                    <select
                                        value={areaName}
                                        onChange={(e) => setAreaName(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm appearance-none"
                                    >
                                        {US_STATES.map((state) => (
                                            <option key={state.name} value={state.name}>
                                                {state.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Signature</label>
                                    <textarea
                                        value={personalSignature}
                                        onChange={(e) => setPersonalSignature(e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm resize-none"
                                        placeholder="What's on your mind?"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full mt-2 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                Save Changes
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleUpdatePassword} className="space-y-5">
                            <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                                <p className="text-xs text-orange-600 leading-relaxed">
                                    Make sure your new password is at least 6 characters long.
                                    You will need to login again after changing your password.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm"
                                    placeholder="Enter new password"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm"
                                    placeholder="Confirm new password"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full mt-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                Update Password
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
