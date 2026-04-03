import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';
import type { ChatSessionVO, MessageVO } from '../store/chatStore';
import {
    MessageSquare, Users, LogOut, Send, Paperclip, Smile,
    Leaf, Flower, Sprout, Cloud, Wind, Search, Settings, Bell,
    FileText, Download, CircleAlert, Lock, X, Loader2
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import ProfileModal from '../components/ProfileModal';
import GroupCreateModal from '../components/GroupCreateModal';
import GroupInfoModal from '../components/GroupInfoModal';
import SearchAddModal from '../components/SearchAddModal';
import NotificationModal from '../components/NotificationModal';
import ImagePreviewModal from '../components/ImagePreviewModal';
import ContactInfoModal from '../components/ContactInfoModal';
import AboutModal from '../components/AboutModal';

import { toast } from 'sonner';

import EmojiPicker from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const {
        sessions,
        contacts,
        messages,
        currentSession,
        currentUser,
        currentGroupInfo,
        onlineNotification,
        friendRequests,
        groupRequests,
        hasMoreMessages,
        isLoadingHistory,
        fetchSessions,
        fetchContacts,
        fetchCurrentUser,
        fetchFriendRequests,
        fetchGroupRequests,
        fetchGroupInfo,
        selectSession,
        loadMoreMessages,
        connectWebSocket,
        disconnectWebSocket,
        logout,
        uploadFile,
        socket
    } = useChatStore();

    // Helper to send mixed messages via WebSocket
    const sendMixedMessage = (content: string, filePath: string | null, type: number) => {
        if (!socket || socket.readyState !== WebSocket.OPEN || !currentSession || !currentUser) return;

        const msg = {
            contactId: currentSession.contactId,
            contactType: currentSession.contactType,
            content: content,
            filePath: filePath, // File/Image URL
            messageType: type,  // 6 = Mixed, 1 = Image, 0 = Text
            sendUserId: currentUser.userId,
            sendUserAvatar: currentUser.avatar,
            sendTime: Date.now()
        };

        socket.send(JSON.stringify(msg));

        // Optimistic update
        useChatStore.getState().addMessage(msg as any);
    };

    const [activeTab, setActiveTab] = useState<'chats' | 'contacts'>('chats');
    const [contactTypeTab, setContactTypeTab] = useState<'friends' | 'groups'>('friends');
    const [inputValue, setInputValue] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    // Pending file state for preview
    const [pendingFile, setPendingFile] = useState<{ file: File; previewUrl: string; isImage: boolean } | null>(null);

    // Modals State
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isGroupCreateModalOpen, setIsGroupCreateModalOpen] = useState(false);
    const [isGroupInfoModalOpen, setIsGroupInfoModalOpen] = useState(false);
    const [isSearchAddModalOpen, setIsSearchAddModalOpen] = useState(false);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

    // Image Preview State
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [isContactInfoModalOpen, setIsContactInfoModalOpen] = useState(false);

    // State to track which user avatar was clicked in the chat
    const [selectedAvatarUserId, setSelectedAvatarUserId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Scroll handling refs
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const isHistoryLoadingRef = useRef(false);
    const prevScrollHeightRef = useRef(0);

    // Init
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchCurrentUser();
        fetchSessions();
        fetchContacts(0);

        fetchFriendRequests();
        fetchGroupRequests();

        connectWebSocket();

        // FIX for Red Bell Notification Issue:
        const intervalId = setInterval(() => {
            fetchFriendRequests();
            fetchGroupRequests();
        }, 15000);

        return () => {
            disconnectWebSocket();
            clearInterval(intervalId);
        };
    }, []);

    // Fetch Group Info when switching to a group session
    useEffect(() => {
        if (currentSession && currentSession.contactType === 1) {
            fetchGroupInfo(currentSession.contactId);
        }
    }, [currentSession]);

    // Tab Switching
    useEffect(() => {
        if (activeTab === 'contacts') {
            fetchContacts(contactTypeTab === 'friends' ? 0 : 1);
        }
    }, [activeTab, contactTypeTab]);

    // Scroll to bottom logic
    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
    };

    // Handle Infinite Scroll
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        if (target.scrollTop === 0 && hasMoreMessages && !isLoadingHistory) {
            // User reached top, trigger load
            isHistoryLoadingRef.current = true;
            prevScrollHeightRef.current = target.scrollHeight;
            loadMoreMessages();
        }
    };

    // Smart Scroll Effect (Restores position on history load, scrolls to bottom on new msg)
    useLayoutEffect(() => {
        if (isHistoryLoadingRef.current) {
            // Restore scroll position to prevent jumping
            if (chatContainerRef.current) {
                const newScrollHeight = chatContainerRef.current.scrollHeight;
                const diff = newScrollHeight - prevScrollHeightRef.current;
                chatContainerRef.current.scrollTop = diff;
            }
            isHistoryLoadingRef.current = false;
        } else {
            // Normal behavior (New message or session switch) -> Scroll to bottom
            scrollToBottom();
        }
    }, [messages, currentSession, pendingFile]);

    // Handlers
    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();

        if (!inputValue.trim() && !pendingFile) return;
        if (!currentSession) return;

        let finalType = 0; // Default text
        let finalUrl: string | null = null;

        // 1. Upload file if exists
        if (pendingFile) {
            const toastId = toast.loading('Uploading...');
            try {
                const url = await uploadFile(pendingFile.file);
                if (url) {
                    finalUrl = url;
                    finalType = 6;
                } else {
                    toast.error('Failed to upload file');
                    return;
                }
            } catch (error) {
                toast.error('Error sending file');
                return;
            } finally {
                toast.dismiss(toastId);
                // Clean up object URL
                if (pendingFile.isImage) {
                    URL.revokeObjectURL(pendingFile.previewUrl);
                }
                setPendingFile(null);
            }
        }

        // 2. Send Message
        if (finalType === 6) {
            sendMixedMessage(inputValue, finalUrl, 6);
        } else {
            // Pure text
            sendMixedMessage(inputValue, null, 0);
        }

        setInputValue('');
        setShowEmojiPicker(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleLogout = () => {
        toast.success('Logging out...');
        setTimeout(() => {
            logout();
            localStorage.removeItem('token');
            navigate('/login');
        }, 1500);
    };

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        setInputValue((prev) => prev + emojiData.emoji);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isImage = file.type.startsWith('image/');
        const previewUrl = isImage ? URL.createObjectURL(file) : '';

        setPendingFile({ file, previewUrl, isImage });

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoveFile = () => {
        if (pendingFile) {
            if (pendingFile.isImage) {
                URL.revokeObjectURL(pendingFile.previewUrl);
            }
            setPendingFile(null);
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const handleImageClick = (url: string) => {
        setPreviewImageUrl(url);
        setIsImagePreviewOpen(true);
    };

    const handleHeaderClick = () => {
        if (currentSession && currentSession.contactType === 0) {
            setIsContactInfoModalOpen(true);
        } else if (currentSession && currentSession.contactType === 1) {
            setIsGroupInfoModalOpen(true);
        }
    };

    const pendingCount = (friendRequests?.filter(r => r.status === 0).length || 0) +
        (groupRequests?.filter(r => r.status === 0).length || 0);

    const isImageUrl = (url: string | null | undefined) => {
        if (!url) return false;
        const ext = url.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext || '');
    };

    const getHeaderStatus = () => {
        if (!currentSession) return null;

        if (currentSession.contactType === 0) {
            const contact = contacts.find(c => c.userContact.contactId === currentSession.contactId);
            const isOnline = contact?.isOnline;

            return (
                <p className={`text-xs font-medium flex items-center gap-1 ${isOnline ? 'text-emerald-600' : 'text-stone-400'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                </p>
            );
        } else {
            const status = currentGroupInfo?.groupInfo?.status;
            if (status === 0) {
                return <p className="text-xs text-red-500 font-medium flex items-center gap-1">Disbanded</p>;
            }
            return <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">Active</p>;
        }
    };

    const isGroupDisbanded = currentSession?.contactType === 1 && currentGroupInfo?.groupInfo?.status === 0;

    const renderSidebarContent = () => {
        if (activeTab === 'chats') {
            return (
                <div className="space-y-2">
                    {sessions.map((session) => (
                        <div
                            key={session.sessionId}
                            onClick={() => selectSession(session)}
                            className={twMerge(
                                "flex items-center p-3.5 rounded-2xl cursor-pointer transition-all duration-300",
                                currentSession?.contactId === session.contactId
                                    ? "bg-emerald-50/80 shadow-sm border border-emerald-100/50"
                                    : "hover:bg-stone-50"
                            )}
                        >
                            <img
                                src={session.contactAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.contactName)}&background=random`}
                                alt={session.contactName}
                                className="w-12 h-12 rounded-full object-cover bg-stone-200 ring-2 ring-white shadow-sm"
                                onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(session.contactName)}&background=random`; }}
                            />
                            <div className="ml-3 flex-1 overflow-hidden">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-stone-700 text-sm truncate">{session.contactName}</span>
                                    <span className="text-[10px] text-stone-400 font-medium">
                                        {new Date(session.lastReceiveTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-stone-500 truncate max-w-[140px]">
                                        {session.lastMessage}
                                    </p>
                                    {session.unreadCount > 0 && (
                                        <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm shadow-emerald-200">
                                            {session.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {sessions.length === 0 && (
                        <div className="p-10 text-center text-stone-400 text-sm flex flex-col items-center">
                            <Wind size={32} className="mb-2 opacity-30" />
                            <p>Quiet breeze...<br />No chats yet.</p>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="space-y-3">
                <div className="flex p-1.5 bg-stone-100 rounded-xl">
                    <button onClick={() => setContactTypeTab('friends')} className={twMerge("flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-300", contactTypeTab === 'friends' ? "bg-white text-emerald-700 shadow-sm" : "text-stone-500 hover:text-stone-700")}>Friends</button>
                    <button onClick={() => setContactTypeTab('groups')} className={twMerge("flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-300", contactTypeTab === 'groups' ? "bg-white text-emerald-700 shadow-sm" : "text-stone-500 hover:text-stone-700")}>Groups</button>
                </div>
                <div className="space-y-2">
                    {contacts.map((contact, idx) => (
                        <div
                            key={idx}
                            onClick={() => {
                                const tempSession: ChatSessionVO = {
                                    sessionId: '',
                                    contactId: contact.userContact.contactId,
                                    contactName: contact.nickName || contact.groupName || 'Unknown',
                                    contactAvatar: contact.avatar || contact.groupAvatar || '',
                                    lastMessage: '',
                                    lastReceiveTime: Date.now(),
                                    unreadCount: 0,
                                    contactType: contact.groupName ? 1 : 0
                                };
                                selectSession(tempSession);
                            }}
                            className="flex items-center p-3 rounded-xl cursor-pointer hover:bg-stone-50 transition-all duration-200 group"
                        >
                            <div className="relative">
                                <img src={contact.avatar || contact.groupAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.nickName || contact.groupName || 'User')}&background=random`} className="w-10 h-10 rounded-full object-cover bg-stone-200 ring-2 ring-white shadow-sm group-hover:scale-105 transition-transform" alt="avatar" onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.nickName || contact.groupName || 'User')}&background=random`; }} />

                                {contact.isOnline && (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                                )}
                            </div>
                            <span className="ml-3 font-semibold text-stone-700 text-sm group-hover:text-emerald-700 transition-colors">{contact.nickName || contact.groupName}</span>
                        </div>
                    ))}
                    {contacts.length === 0 && <div className="p-8 text-center text-stone-400 text-sm">No contacts found</div>}
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-full w-screen overflow-hidden bg-[#FDFCF8] font-sans selection:bg-emerald-100 selection:text-emerald-900">

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
            />

            {/* Sidebar */}
            <div className="w-80 h-full flex flex-col border-r border-stone-100 bg-white/60 backdrop-blur-xl z-20 shadow-[4px_0_24px_rgba(0,0,0,0.01)]">
                <div className="p-6 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setIsProfileModalOpen(true)}>
                        <div className="relative">
                            <img src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.nickName || 'Me')}&background=random`} className="w-11 h-11 rounded-full bg-stone-200 ring-2 ring-white shadow-md group-hover:ring-emerald-200 transition-all" alt="Me" onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.nickName || 'Me')}&background=random`; }} />
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                        </div>
                        <div>
                            <div className="flex items-center gap-1">
                                <h2 className="font-bold text-stone-800 text-sm">{currentUser?.nickName || 'User'}</h2>
                                <Leaf size={12} className="text-emerald-500 fill-emerald-500" />
                            </div>
                            <p className="text-[10px] text-stone-400 font-medium">Online</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsNotificationModalOpen(true)}
                            className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all relative"
                            title="Notifications"
                        >
                            <Bell size={18} />
                            {pendingCount > 0 && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                            )}
                        </button>
                        <button onClick={() => setIsGroupCreateModalOpen(true)} className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><Users size={18} /></button>
                        <button onClick={handleLogout} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-xl transition-all"><LogOut size={18} /></button>
                    </div>
                </div>

                <div className="px-6 py-2 flex-shrink-0">
                    <div className="relative group cursor-pointer" onClick={() => setIsSearchAddModalOpen(true)}>
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 group-hover:text-emerald-500 transition-colors" size={18} />
                        <div className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-transparent group-hover:bg-white group-hover:border-emerald-200 rounded-xl text-sm text-stone-400 transition-all select-none">Search to add friends...</div>
                    </div>
                </div>

                <div className="px-6 py-4 flex gap-2 flex-shrink-0">
                    <button onClick={() => setActiveTab('chats')} className={twMerge("flex-1 py-2 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2", activeTab === 'chats' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "text-stone-500 hover:bg-stone-50")}><MessageSquare size={16} /> Chats</button>
                    <button onClick={() => setActiveTab('contacts')} className={twMerge("flex-1 py-2 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2", activeTab === 'contacts' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "text-stone-500 hover:bg-stone-50")}><Users size={16} /> Contacts</button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar">{renderSidebarContent()}</div>

                <div className="p-4 border-t border-stone-100 flex-shrink-0 flex items-center">
                    <button
                        onClick={() => setIsAboutModalOpen(true)}
                        className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Settings & Updates"
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            {/* CHAT AREA */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#FAFAFA]">
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-gradient-to-br from-emerald-50/40 to-teal-50/40 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-gradient-to-tr from-stone-100/50 to-orange-50/30 rounded-full blur-3xl"></div>
                </div>

                {onlineNotification && (
                    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="bg-stone-800 text-white px-4 py-1.5 rounded-full text-xs font-medium shadow-lg border border-stone-700/50">
                            {onlineNotification.text}
                        </div>
                    </div>
                )}

                {currentSession ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-20 px-8 bg-white/70 backdrop-blur-lg border-b border-stone-100 flex items-center justify-between z-10 relative">
                            <div
                                className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={handleHeaderClick}
                            >
                                <img src={currentSession.contactAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentSession.contactName)}&background=random`} className="w-10 h-10 rounded-full shadow-sm bg-stone-200" alt="" onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentSession.contactName)}&background=random`; }} />
                                <div>
                                    <h3 className="font-bold text-stone-800 text-base flex items-center gap-2">
                                        {currentSession.contactName}
                                    </h3>
                                    {getHeaderStatus()}
                                </div>
                            </div>
                            {currentSession.contactType === 1 && <button onClick={() => setIsGroupInfoModalOpen(true)} className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><Settings size={20} /></button>}
                        </div>

                        {/* Messages List - Updated with Ref and Scroll Event */}
                        <div
                            className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 relative z-0"
                            ref={chatContainerRef}
                            onScroll={handleScroll}
                        >
                            {/* Loading Indicator at Top */}
                            {isLoadingHistory && (
                                <div className="flex justify-center py-2 animate-fade-in">
                                    <Loader2 className="animate-spin text-emerald-500 w-5 h-5" />
                                </div>
                            )}

                            {messages.map((msg: MessageVO, idx) => {
                                const isMe = msg.sendUserId === currentUser?.userId;
                                const isFailed = msg.status === 2;
                                const fileUrl = msg.filePath || (msg.messageType === 1 ? msg.content : null);
                                const isImg = isImageUrl(fileUrl);
                                const textContent = msg.content;
                                const displayContent = (textContent === '[Image]' && isImg) ? '' : textContent;

                                return (
                                    // CRITICAL FIX: Use msg.messageId as key to maintain stability when prepending items. 
                                    // Fallback to idx only for pending messages.
                                    <div key={msg.messageId || idx} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                                        <div className={`flex max-w-[65%] gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <img
                                                src={isMe ? (currentUser?.avatar || '') : (msg.sendUserAvatar || currentSession?.contactAvatar)}
                                                className="w-9 h-9 rounded-full bg-stone-200 self-end mb-1 shadow-sm border border-white cursor-pointer hover:opacity-80 transition-opacity"
                                                alt=""
                                                onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=U&background=random`; }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedAvatarUserId(msg.sendUserId);
                                                }}
                                            />

                                            <div className="flex flex-col gap-1">
                                                <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm flex flex-col gap-2 ${isMe
                                                    ? 'bg-emerald-600 text-white rounded-tr-none'
                                                    : 'bg-white text-stone-700 border border-stone-100 rounded-tl-none'
                                                    }`}>

                                                    {fileUrl && (
                                                        <>
                                                            {isImg ? (
                                                                <img
                                                                    src={fileUrl}
                                                                    alt="Shared"
                                                                    className="max-w-[280px] max-h-[280px] rounded-xl object-cover border border-stone-200 cursor-pointer hover:opacity-95 transition-opacity"
                                                                    onClick={() => handleImageClick(fileUrl)}
                                                                // CRITICAL FIX: Removed onLoad={scrollToBottom} to prevent scroll jumping when loading history
                                                                />
                                                            ) : (
                                                                <div
                                                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isMe ? 'bg-emerald-700/50 hover:bg-emerald-700' : 'bg-stone-100 hover:bg-stone-200'}`}
                                                                    onClick={() => window.open(fileUrl, '_blank')}
                                                                >
                                                                    <div className={`p-2 rounded-lg ${isMe ? 'bg-emerald-800' : 'bg-white shadow-sm'}`}>
                                                                        <FileText size={24} className={isMe ? 'text-emerald-100' : 'text-stone-500'} />
                                                                    </div>
                                                                    <div className="flex flex-col overflow-hidden">
                                                                        <span className={`font-semibold truncate max-w-[150px] ${isMe ? 'text-white' : 'text-stone-800'}`}>
                                                                            {fileUrl.split('/').pop() || 'Attachment'}
                                                                        </span>
                                                                        <span className={`text-[10px] uppercase flex items-center gap-1 ${isMe ? 'text-emerald-200' : 'text-stone-400'}`}>
                                                                            {fileUrl.split('.').pop() || 'FILE'} <Download size={10} />
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}

                                                    {displayContent && (
                                                        <span className="whitespace-pre-wrap break-words">{displayContent}</span>
                                                    )}
                                                </div>
                                                <span className={`text-[10px] text-stone-400 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                                                    {new Date(msg.sendTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            {isFailed && (
                                                <div className="self-center text-red-500 animate-pulse ml-2" title="Message failed to send">
                                                    <CircleAlert size={20} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-white/60 backdrop-blur-md border-t border-stone-100 flex-shrink-0 z-10 relative flex flex-col gap-2">
                            {isGroupDisbanded ? (
                                <div className="w-full h-[56px] bg-stone-50/80 rounded-2xl border border-stone-200 text-center flex items-center justify-center gap-2 text-stone-500">
                                    <Lock size={18} />
                                    <span className="font-medium text-sm">This group has been disbanded</span>
                                </div>
                            ) : (
                                <>
                                    {showEmojiPicker && <div className="absolute bottom-24 right-8 z-50 shadow-2xl rounded-2xl"><EmojiPicker onEmojiClick={handleEmojiClick} /></div>}

                                    {pendingFile && (
                                        <div className="absolute bottom-[84px] left-6 z-20 animate-fade-in-up">
                                            <div className="relative inline-block">
                                                <div className="p-2 bg-white rounded-xl shadow-lg border border-stone-100 flex items-center gap-2">
                                                    {pendingFile.isImage ? (
                                                        <img src={pendingFile.previewUrl} alt="Preview" className="h-24 w-auto rounded-lg object-cover" />
                                                    ) : (
                                                        <div className="h-24 w-24 bg-stone-50 rounded-lg flex flex-col items-center justify-center text-stone-400 gap-1 border border-stone-100">
                                                            <FileText size={32} />
                                                            <span className="text-[10px] font-bold uppercase truncate max-w-[80px]">{pendingFile.file.name.split('.').pop()}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <button onClick={handleRemoveFile} className="absolute -top-2 -right-2 bg-stone-800 text-white p-1 rounded-full shadow-md hover:bg-red-500 transition-colors"><X size={12} /></button>

                                                {!pendingFile.isImage && (
                                                    <span className="absolute -bottom-6 left-1 text-[10px] font-medium text-stone-500 bg-white/80 px-2 py-0.5 rounded-full shadow-sm border border-stone-100 truncate max-w-[120px]">
                                                        {pendingFile.file.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {currentSession.contactId === 'UID_ROBOT_001' ? (
                                        <div className="w-full h-[56px] bg-stone-50/80 rounded-2xl border border-stone-200 text-center flex items-center justify-center gap-2">
                                            <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span></span>
                                            <p className="text-stone-500 text-xs font-medium tracking-wide">System Notifications Only</p>
                                        </div>
                                    ) : (
                                        <div className="bg-white border border-stone-200 rounded-2xl p-2 flex items-end gap-2 focus-within:ring-2 focus-within:ring-emerald-100 focus-within:border-emerald-300 transition-all duration-300 shadow-sm h-[56px]">
                                            <button onClick={triggerFileUpload} className={`p-2.5 rounded-xl transition-all ${pendingFile ? 'text-emerald-600 bg-emerald-50' : 'text-stone-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title="Attach File"><Paperclip size={20} /></button>
                                            <textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder="Write a message..." className="flex-1 bg-transparent border-none outline-none resize-none py-2.5 text-stone-700 placeholder-stone-400 text-sm max-h-32 min-h-[40px] leading-relaxed custom-scrollbar" rows={1} />
                                            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2.5 text-stone-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-xl transition-all"><Smile size={20} /></button>
                                            <button onClick={() => handleSendMessage()} disabled={!inputValue.trim() && !pendingFile} className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md hover:bg-emerald-700 hover:shadow-lg disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"><Send size={18} /></button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                        <Leaf className="absolute top-[20%] left-[15%] text-emerald-300/40 w-12 h-12 -rotate-12 animate-float" />
                        <Sprout className="absolute bottom-[20%] right-[15%] text-teal-300/40 w-16 h-16 rotate-12 animate-float-delayed" />
                        <Flower className="absolute top-[25%] right-[20%] text-rose-300/30 w-10 h-10 rotate-45 animate-sway" />
                        <Cloud className="absolute top-[10%] left-[35%] text-stone-200 w-32 h-32 opacity-60 animate-float" />

                        <div className="w-72 h-72 mb-6 z-10 opacity-90 hover:scale-105 transition-transform duration-700">
                            <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl">
                                <defs>
                                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" style={{ stopColor: '#a7f3d0', stopOpacity: 1 }} />
                                        <stop offset="100%" style={{ stopColor: '#34d399', stopOpacity: 1 }} />
                                    </linearGradient>
                                </defs>
                                <path d="M260 400 L260 200 Q260 150 220 120" stroke="#78350f" strokeWidth="12" fill="none" strokeLinecap="round" />
                                <circle cx="200" cy="150" r="60" fill="url(#grad1)" opacity="0.8" />
                                <circle cx="260" cy="120" r="70" fill="url(#grad1)" opacity="0.9" />
                                <circle cx="310" cy="160" r="50" fill="url(#grad1)" opacity="0.8" />
                                <ellipse cx="250" cy="420" rx="180" ry="20" fill="#ecfccb" />
                                <g transform="translate(180, 330)">
                                    <path d="M40 80 Q20 80 20 60 L30 30 Q40 10 60 30 L50 60 Q50 80 40 80" fill="#1e293b" />
                                    <circle cx="55" cy="25" r="15" fill="#fcd34d" />
                                    <rect x="30" y="50" width="30" height="20" fill="#ffffff" rx="2" transform="rotate(-10)" />
                                </g>
                                <circle cx="220" cy="200" r="3" fill="#10b981" className="animate-ping" style={{ animationDuration: '3s' }} />
                                <circle cx="280" cy="240" r="2" fill="#10b981" className="animate-ping" style={{ animationDuration: '4s' }} />
                            </svg>
                        </div>
                        <h3 className="text-3xl font-bold text-emerald-900 mb-3 tracking-tight z-10 font-serif">Find your peace.</h3>
                        <p className="text-emerald-800/60 text-lg max-w-md text-center leading-relaxed font-medium z-10 px-4">
                            Connect with friends, share moments,<br />and let the conversation grow naturally.
                        </p>
                    </div>
                )}
            </div>

            <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
            <GroupCreateModal isOpen={isGroupCreateModalOpen} onClose={() => setIsGroupCreateModalOpen(false)} />
            <GroupInfoModal isOpen={isGroupInfoModalOpen} onClose={() => setIsGroupInfoModalOpen(false)} />
            <SearchAddModal isOpen={isSearchAddModalOpen} onClose={() => setIsSearchAddModalOpen(false)} />
            <NotificationModal isOpen={isNotificationModalOpen} onClose={() => setIsNotificationModalOpen(false)} />
            <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />

            <ImagePreviewModal
                isOpen={isImagePreviewOpen}
                imageUrl={previewImageUrl}
                onClose={() => setIsImagePreviewOpen(false)}
            />
            {currentSession && (
                <ContactInfoModal
                    isOpen={isContactInfoModalOpen}
                    onClose={() => setIsContactInfoModalOpen(false)}
                    contactId={currentSession.contactId}
                    name={currentSession.contactName}
                    avatar={currentSession.contactAvatar || ''}
                />
            )}

            {selectedAvatarUserId && (
                <ContactInfoModal
                    isOpen={!!selectedAvatarUserId}
                    onClose={() => setSelectedAvatarUserId(null)}
                    contactId={selectedAvatarUserId}
                />
            )}

        </div>
    );
};

export default Home;