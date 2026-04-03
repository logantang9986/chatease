import React, { useState, useEffect } from 'react';
import { X, Ban, Trash2, MessageSquare, User, MapPin, AlignLeft, UserPlus, Send, Copy, Bot, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import api from '../api/axios';
import { toast } from 'sonner';

interface ContactInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    contactId: string;
    name?: string;
    avatar?: string;
    // Callback to notify parent component that chat has started
    onChatStarted?: () => void;
}

interface UserDetail {
    userId: string;
    nickName: string;
    avatar: string;
    sex?: number; // 0: Female, 1: Male
    personalSignature?: string;
    areaName?: string;
    isFriend?: boolean;
    isRobot?: boolean;
    contactStatus?: number; // 0:Not Friend 1:Friend 2:Deleted 3:Blocked
}

const ContactInfoModal: React.FC<ContactInfoModalProps> = ({ isOpen, onClose, contactId, onChatStarted }) => {
    const { selectSession, sendApplyRequest, currentUser, fetchContacts, fetchSessions } = useChatStore();

    const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Add Friend State
    const [isAdding, setIsAdding] = useState(false);
    const [applyMsg, setApplyMsg] = useState('');

    // Confirmation Overlay States
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showBlockConfirm, setShowBlockConfirm] = useState(false);

    useEffect(() => {
        if (isOpen && contactId) {
            // Clear old data to prevent flashing previous user info
            setUserDetail(null);
            setIsAdding(false);
            setApplyMsg('');
            setShowDeleteConfirm(false);
            setShowBlockConfirm(false);
            fetchDetail();
        }
    }, [isOpen, contactId]);

    const fetchDetail = async () => {
        // Special handling for Robot ID
        if (contactId === 'UID_ROBOT_001') {
            setUserDetail({
                userId: 'UID_ROBOT_001',
                nickName: 'ChatEase',
                avatar: 'https://robohash.org/ChatEaseHelper.png?size=200x200',
                personalSignature: 'Official AI Assistant',
                areaName: 'System',
                sex: 1,
                isFriend: true,
                isRobot: true,
                contactStatus: 1
            });
            return;
        }

        setIsLoading(true);
        try {
            const res = await api.get(`/user-contact/contact-detail?contactId=${contactId}`);
            if (res.data.success) {
                setUserDetail(res.data.data);
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to load user info");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = () => {
        if (!userDetail) return;

        // Construct a temporary Session object for navigation
        const tempSession = {
            sessionId: '',
            contactId: userDetail.userId,
            contactName: userDetail.nickName,
            contactAvatar: userDetail.avatar,
            lastMessage: '',
            lastReceiveTime: Date.now(),
            unreadCount: 0,
            contactType: 0 // 0 means private chat
        };

        selectSession(tempSession);
        onClose(); // Close current modal

        // Notify parent if callback provided
        if (onChatStarted) {
            onChatStarted();
        }
    };

    const handleSendApply = async () => {
        if (!userDetail) return;
        await sendApplyRequest(userDetail.userId, applyMsg);
        setIsAdding(false);
        onClose();
    };

    // Execute Delete Contact
    const executeDeleteContact = async () => {
        try {
            const res = await api.delete(`/user-contact/delete-contact?contactId=${contactId}`);
            if (res.data.success) {
                toast.success('Contact deleted');
                fetchContacts(0); // Refresh friend list
                fetchSessions();  // Refresh session list
                onClose();
            } else {
                toast.error(res.data.errorMsg || 'Failed to delete');
            }
        } catch (error) {
            toast.error('Error deleting contact');
        }
    };

    // Execute Block Contact
    const executeBlockContact = async () => {
        try {
            const res = await api.post(`/user-contact/block-contact?contactId=${contactId}`);
            if (res.data.success) {
                toast.success('Contact blocked');
                fetchDetail(); // Refresh detail to update button state
                fetchContacts(0);
                setShowBlockConfirm(false); // Close overlay
            } else {
                toast.error(res.data.errorMsg || 'Failed to block');
            }
        } catch (error) {
            toast.error('Error blocking contact');
        }
    };

    // Execute Unblock Contact
    const handleUnblockContact = async () => {
        try {
            const res = await api.post(`/user-contact/unblock-contact?contactId=${contactId}`);
            if (res.data.success) {
                toast.success('Contact unblocked');
                fetchDetail(); // Refresh detail to update button state
                fetchContacts(0);
            } else {
                toast.error(res.data.errorMsg || 'Failed to unblock');
            }
        } catch (error) {
            toast.error('Error unblocking contact');
        }
    };

    if (!isOpen) return null;

    if (isLoading && !userDetail) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <div className="bg-white p-6 rounded-2xl shadow-xl">
                    <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
                </div>
            </div>
        );
    }

    if (!userDetail) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">

                {/* ========================================================================
                   DELETE CONFIRMATION OVERLAY 
                   ========================================================================
                */}
                {showDeleteConfirm && (
                    <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-fade-in text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Contact?</h3>
                        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                            Are you sure you want to delete this contact? Chat history will be cleared.
                        </p>
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeDeleteContact}
                                className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 transition-all text-sm"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                )}

                {/* ========================================================================
                   BLOCK CONFIRMATION OVERLAY 
                   ========================================================================
                */}
                {showBlockConfirm && (
                    <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-fade-in text-center">
                        <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <ShieldAlert size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Block User?</h3>
                        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                            They will not be able to send you messages. You can unblock them later.
                        </p>
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setShowBlockConfirm(false)}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeBlockContact}
                                className="flex-1 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all text-sm"
                            >
                                Block
                            </button>
                        </div>
                    </div>
                )}


                {/* Header Background */}
                <div className="h-24 bg-gradient-to-r from-emerald-400 to-teal-500 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 text-white rounded-full transition-all backdrop-blur-md">
                        <X size={20} />
                    </button>
                </div>

                {/* Avatar & Basic Info */}
                <div className="px-6 pb-6 -mt-12 flex flex-col items-center">
                    <div className="relative">
                        <img
                            src={userDetail.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userDetail.nickName)}`}
                            alt={userDetail.nickName}
                            className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover bg-white"
                        />
                        {/* Gender Icon / Robot Icon */}
                        {userDetail.isRobot ? (
                            <div className="absolute bottom-1 right-1 p-1.5 rounded-full text-white border-2 border-white shadow-sm flex items-center justify-center bg-indigo-500">
                                <Bot size={12} fill="currentColor" />
                            </div>
                        ) : (userDetail.sex !== undefined && (
                            <div className={`absolute bottom-1 right-1 p-1.5 rounded-full text-white border-2 border-white shadow-sm flex items-center justify-center ${userDetail.sex === 1 ? 'bg-blue-500' : 'bg-pink-500'}`}>
                                <User size={12} fill="currentColor" />
                            </div>
                        ))}
                    </div>

                    <h2 className="mt-3 text-xl font-bold text-slate-800 flex items-center gap-2">
                        {userDetail.nickName}
                    </h2>

                    {/* User ID Copy */}
                    <div
                        className="mt-1 flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors group"
                        onClick={() => {
                            navigator.clipboard.writeText(userDetail.userId);
                            toast.success('ID copied');
                        }}
                    >
                        <span className="text-xs font-mono text-slate-500">ID: {userDetail.userId}</span>
                        <Copy size={10} className="text-slate-400 group-hover:text-slate-600" />
                    </div>

                    {/* Details Grid */}
                    <div className="w-full mt-6 space-y-4">
                        {/* Signature */}
                        <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                            <AlignLeft size={18} className="text-emerald-500 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Signature</p>
                                <p className="text-sm text-slate-600 leading-relaxed italic">
                                    {userDetail.personalSignature || "No signature set."}
                                </p>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                            <MapPin size={18} className="text-emerald-500" />
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Location</p>
                                <p className="text-sm text-slate-600 font-medium">
                                    {userDetail.areaName || "Unknown"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions Area */}
                    <div className="w-full mt-8">
                        {/* Logic: Is it me? */}
                        {userDetail.userId === currentUser?.userId ? (
                            <button disabled className="w-full py-3 bg-slate-100 text-slate-400 rounded-xl font-bold text-sm">
                                This is you
                            </button>
                        ) : userDetail.isFriend ? (
                            // Logic: Is Friend -> Show Send Message AND Delete/Block
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleSendMessage}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <MessageSquare size={18} /> Send Message
                                </button>

                                {/* Only show Block/Delete if not a Robot */}
                                {!userDetail.isRobot && (
                                    <div className="flex gap-3">
                                        {/* Status Check: If Blocked (Status 3), Show Unblock */}
                                        {userDetail.contactStatus === 3 ? (
                                            <button
                                                onClick={handleUnblockContact}
                                                className="flex-1 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                                                title="Unblock User"
                                            >
                                                <ShieldCheck size={16} /> Unblock
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setShowBlockConfirm(true)} // Trigger Overlay
                                                className="flex-1 py-2.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                                                title="Block User"
                                            >
                                                <Ban size={16} /> Block
                                            </button>
                                        )}

                                        <button
                                            onClick={() => setShowDeleteConfirm(true)} // Trigger Overlay
                                            className="flex-1 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                                            title="Delete Contact"
                                        >
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Logic: Not Friend -> Show Add Contact
                            !isAdding ? (
                                <button
                                    onClick={() => setIsAdding(true)}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <UserPlus size={18} /> Add Contact
                                </button>
                            ) : (
                                <div className="animate-fade-in">
                                    <div className="relative mb-3">
                                        <input
                                            type="text"
                                            value={applyMsg}
                                            onChange={(e) => setApplyMsg(e.target.value)}
                                            placeholder="Say hello..."
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleSendApply}
                                            className="absolute right-1 top-1 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                        >
                                            <Send size={14} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setIsAdding(false)}
                                        className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ContactInfoModal;