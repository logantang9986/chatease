import React, { useState } from 'react';
import { X, Search, UserPlus, Users, User } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { toast } from 'sonner';

interface SearchAddModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SearchAddModal: React.FC<SearchAddModalProps> = ({ isOpen, onClose }) => {
    const { searchUserOrGroup, sendApplyRequest, currentUser } = useChatStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [applyMessage, setApplyMessage] = useState('');
    const [showApplyInput, setShowApplyInput] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setSearchResult(null);
        setShowApplyInput(false);

        try {
            const result = await searchUserOrGroup(searchQuery);
            if (result) {
                setSearchResult(result);
            } else {
                toast.error('User or Group not found');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendRequest = async () => {
        if (!searchResult) return;

        // Final safety check
        if (searchResult.userId === currentUser?.userId) {
            toast.error("You cannot add yourself");
            return;
        }

        const targetId = searchResult.userId || searchResult.groupId;
        // Default message if empty
        const msg = applyMessage.trim() || `Hi, I'm ${currentUser?.nickName}`;

        await sendApplyRequest(targetId, msg);
        onClose();
        setSearchQuery('');
        setSearchResult(null);
        setApplyMessage('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-800">Add Friend / Group</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSearch} className="relative mb-6">
                        <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Enter User ID or Group ID..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !searchQuery.trim()}
                            className="absolute right-2 top-2 px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? 'Searching...' : 'Search'}
                        </button>
                    </form>

                    {searchResult && (
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 animate-fade-in">
                            <div className="flex items-center gap-4">
                                <img
                                    src={searchResult.avatar || searchResult.groupAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(searchResult.nickName || searchResult.groupName)}&background=random`}
                                    alt="Avatar"
                                    className="w-14 h-14 rounded-full bg-white shadow-sm object-cover"
                                />
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-800">{searchResult.nickName || searchResult.groupName}</h3>
                                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                                        ID: {searchResult.userId || searchResult.groupId}
                                    </p>

                                    {/* Badges */}
                                    <div className="flex gap-2 mt-2">
                                        {searchResult.userId ? (
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded-full flex items-center gap-1">
                                                <User size={10} /> User
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-[10px] font-bold rounded-full flex items-center gap-1">
                                                <Users size={10} /> Group
                                            </span>
                                        )}

                                        {/* 👇 Handle isMe / isFriend / isMember Status 👇 */}
                                        {searchResult.isMe && (
                                            <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-bold rounded-full">
                                                You
                                            </span>
                                        )}
                                        {!searchResult.isMe && (searchResult.isFriend || searchResult.isMember) && (
                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] font-bold rounded-full">
                                                Already Added
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Button Logic */}
                            {!searchResult.isMe && !searchResult.isFriend && !searchResult.isMember && (
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    {!showApplyInput ? (
                                        <button
                                            onClick={() => setShowApplyInput(true)}
                                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
                                        >
                                            <UserPlus size={18} />
                                            Add {searchResult.userId ? 'Friend' : 'Group'}
                                        </button>
                                    ) : (
                                        <div className="space-y-3">
                                            <textarea
                                                value={applyMessage}
                                                onChange={(e) => setApplyMessage(e.target.value)}
                                                placeholder="Type a greeting message..."
                                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
                                                rows={2}
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setShowApplyInput(false)}
                                                    className="flex-1 py-2 bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-300 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSendRequest}
                                                    className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                                                >
                                                    Send Request
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchAddModal;