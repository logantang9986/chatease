import React, { useEffect, useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { X, Check, User, Users, Clock } from 'lucide-react';

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
    const {
        friendRequests,
        groupRequests,
        fetchFriendRequests,
        fetchGroupRequests,
        processApplyRequest
    } = useChatStore();

    const [activeTab, setActiveTab] = useState<'friend' | 'group'>('friend');

    useEffect(() => {
        if (isOpen) {
            fetchFriendRequests();
            fetchGroupRequests();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Determine which list to show based on active tab
    const list = activeTab === 'friend' ? friendRequests : groupRequests;

    const handleProcess = async (id: number, status: number) => {
        await processApplyRequest(id, status);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col h-[600px]">

                {/* Header */}
                <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                    <h2 className="font-bold text-stone-700 text-lg">Notifications</h2>
                    <button onClick={onClose} className="p-2 bg-stone-200 rounded-full hover:bg-stone-300 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 gap-2 bg-white">
                    <button
                        onClick={() => setActiveTab('friend')}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'friend' ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-stone-50 text-stone-500'}`}
                    >
                        <User size={16} /> Friend Requests
                        {friendRequests.filter(r => r.status === 0).length > 0 &&
                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{friendRequests.filter(r => r.status === 0).length}</span>
                        }
                    </button>
                    <button
                        onClick={() => setActiveTab('group')}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'group' ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-stone-50 text-stone-500'}`}
                    >
                        <Users size={16} /> Group Invites
                        {groupRequests.filter(r => r.status === 0).length > 0 &&
                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{groupRequests.filter(r => r.status === 0).length}</span>
                        }
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3 bg-stone-50/50">
                    {list.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-stone-400 opacity-60">
                            <Clock size={48} className="mb-2" />
                            <p>No requests yet</p>
                        </div>
                    ) : (
                        list.map((item) => (
                            <div key={item.applyId} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={item.applicantAvatar || `https://ui-avatars.com/api/?name=${item.applicantName}`}
                                        className="w-10 h-10 rounded-full bg-stone-200"
                                        alt={item.applicantName}
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <h3 className="font-bold text-stone-800">{item.applicantName}</h3>
                                            <span className="text-[10px] text-stone-400">{new Date(item.createTime).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-stone-500">
                                            {activeTab === 'group' ? `Apply to join: ${item.targetName}` : 'Wants to be friends'}
                                        </p>
                                        <p className="text-xs bg-stone-50 p-1.5 rounded mt-1 text-stone-600 italic">
                                            "{item.applyInfo || 'Hi, please add me!'}"
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                {item.status === 0 ? (
                                    <div className="flex gap-2 mt-1">
                                        <button
                                            onClick={() => handleProcess(item.applyId, 2)}
                                            className="flex-1 py-2 bg-stone-100 text-stone-600 rounded-xl text-xs font-bold hover:bg-stone-200 transition-colors"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleProcess(item.applyId, 1)}
                                            className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Check size={14} /> Accept
                                        </button>
                                    </div>
                                ) : (
                                    <div className={`text-center text-xs font-bold py-1.5 rounded-lg ${item.status === 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                        {item.status === 1 ? 'Accepted' : 'Rejected'}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationModal;