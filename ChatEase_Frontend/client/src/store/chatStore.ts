import { create } from 'zustand';
import api from '../api/axios';
import { toast } from 'sonner';

// ==========================================
// Types Definition
// ==========================================

export interface MessageVO {
    messageId?: number;
    sendUserId: string;
    contactId: string;
    contactType: number;
    content: string;
    messageType: number;
    filePath?: string;
    sendUserAvatar?: string;
    fileSize?: number;
    fileName?: string;
    sendTime: number;
    status: number; // 0: Sending, 1: Success, 2: Fail
    errorMsg?: string; // Optional error message from backend
}

export interface ContactVO {
    userContact: {
        userId: string;
        contactId: string;
        contactType: number;
        createTime: number;
    };
    nickName?: string;
    avatar?: string;
    groupName?: string;
    groupAvatar?: string;
    isOnline?: boolean;
}

export interface ChatSessionVO {
    sessionId: string;
    contactId: string;
    contactName: string;
    contactAvatar: string;
    lastMessage: string;
    lastReceiveTime: number;
    unreadCount: number;
    contactType: number;
}

export interface GroupMember {
    userId: string;
    nickName: string;
    avatar: string;
    role: number; // 0-Owner, 1-Admin, 3-Member
}

export interface GroupInfoVO {
    groupId: string;
    groupName: string;
    groupAvatar: string;
    groupNotice?: string;
    createTime?: number;
    ownerId?: string;
    joinType?: number; // 0: Direct, 1: Approval
    groupInfo?: {
        groupId: string;
        groupName: string;
        groupOwnerId: string;
        joinType: number;
        status: number; // 1: Active, 0: Disbanded
    };
}

export interface GroupInfoDTO {
    groupId: string;
    groupName?: string;
    groupAvatar?: string;
    groupNotice?: string;
    joinType?: number;
}

export interface ApplyVO {
    applyId: number;
    type: number; // 1: User, 2: Group
    applicantId: string;
    applicantName: string;
    applicantAvatar: string;
    targetId: string;
    targetName?: string;
    applyInfo?: string;
    status: number; // 0: Pending, 1: Accepted, 2: Rejected
    createTime: number;
}

export interface UserPasswordResetDTO {
    email: string;
    code: string;
    newPassword: string;
}

interface ChatState {
    // State Variables
    currentUser: any | null;
    sessions: ChatSessionVO[];
    contacts: ContactVO[];
    messages: MessageVO[];
    currentSession: ChatSessionVO | null;

    // Pagination State
    hasMoreMessages: boolean;
    isLoadingHistory: boolean;

    currentGroupMembers: GroupMember[];
    currentGroupInfo: GroupInfoVO | null;

    // Notification State
    onlineNotification: { userId: string; text: string } | null;

    // Request Lists
    friendRequests: ApplyVO[];
    groupRequests: ApplyVO[];

    socket: WebSocket | null;
    isConnected: boolean;

    // Actions
    fetchCurrentUser: () => Promise<void>;
    fetchSessions: () => Promise<void>;
    fetchContacts: (type: number) => Promise<void>;

    selectSession: (session: ChatSessionVO | null) => void;
    loadMoreMessages: () => Promise<boolean>;

    connectWebSocket: () => void;
    disconnectWebSocket: () => void;

    sendMessage: (content: string, type: number) => void;
    addMessage: (msg: MessageVO) => void;
    uploadFile: (file: File) => Promise<string | null>;

    createGroup: (groupName: string, groupNotice: string, userIds: string[]) => Promise<boolean>;
    updateGroup: (info: GroupInfoDTO) => Promise<boolean>;

    fetchGroupInfo: (groupId: string) => Promise<void>;
    fetchGroupMembers: (groupId: string) => Promise<void>;

    kickGroupMember: (groupId: string, userId: string) => Promise<void>;
    inviteGroupMember: (groupId: string, userId: string) => Promise<boolean>;

    quitGroup: (groupId: string) => Promise<boolean>;
    disbandGroup: (groupId: string) => Promise<boolean>;

    fetchFriendRequests: () => Promise<void>;
    fetchGroupRequests: () => Promise<void>;
    processApplyRequest: (applyId: number, status: number) => Promise<boolean>;

    searchUserOrGroup: (query: string) => Promise<any>;
    sendApplyRequest: (targetId: string, applyInfo: string) => Promise<void>;

    updateCurrentUser: (userInfo: any) => Promise<boolean>;
    updatePassword: (password: string) => Promise<boolean>;
    logout: () => Promise<void>;

    sendVerificationCode: (email: string, type: number) => Promise<boolean>;
    resetPassword: (data: UserPasswordResetDTO) => Promise<boolean>;
}

// ==========================================
// Store Implementation
// ==========================================

export const useChatStore = create<ChatState>((set, get) => ({
    currentUser: null,
    sessions: [],
    contacts: [],
    messages: [],
    currentSession: null,
    hasMoreMessages: true,
    isLoadingHistory: false,
    currentGroupMembers: [],
    currentGroupInfo: null,
    onlineNotification: null,
    friendRequests: [],
    groupRequests: [],
    socket: null,
    isConnected: false,

    fetchCurrentUser: async () => {
        try {
            const res = await api.get('/user-info/current');
            set({ currentUser: res.data.data });
        } catch (e) { console.error(e); }
    },

    fetchSessions: async () => {
        try {
            const res = await api.get('/chat/sessions');
            set({ sessions: res.data.data });
        } catch (e) { console.error(e); }
    },

    fetchContacts: async (type: number) => {
        try {
            const res = await api.get(`/user-contact/list?contactType=${type}`);
            set({ contacts: res.data.data });
        } catch (e) { console.error(e); }
    },

    selectSession: async (session) => {
        set({ currentSession: session });
        // Reset pagination state for new session
        set({ messages: [], hasMoreMessages: true, isLoadingHistory: false });

        if (!session) return;

        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.sessionId === session.sessionId ? { ...s, unreadCount: 0 } : s
            ),
        }));

        try {
            // Initial load - first page (15 messages)
            const res = await api.get(
                `/chat/history?contactId=${session.contactId}&contactType=${session.contactType}`
            );
            const newMessages = res.data.data;
            set({
                messages: newMessages,
                // Check if we reached the end (less than 15 messages returned)
                hasMoreMessages: newMessages.length >= 15
            });
            await api.post(`/chat/read?contactId=${session.contactId}`);
        } catch (e) { console.error(e); }
    },

    loadMoreMessages: async () => {
        const { currentSession, messages, hasMoreMessages, isLoadingHistory } = get();
        if (!currentSession || !hasMoreMessages || isLoadingHistory || messages.length === 0) {
            return false;
        }

        set({ isLoadingHistory: true });

        // Get the oldest message ID (first in the list)
        const oldestMessage = messages[0];
        const lastMessageId = oldestMessage.messageId;

        try {
            const res = await api.get(
                `/chat/history?contactId=${currentSession.contactId}&contactType=${currentSession.contactType}&lastMessageId=${lastMessageId}`
            );
            const olderMessages = res.data.data;

            if (olderMessages && olderMessages.length > 0) {
                set((state) => ({
                    // Prepend older messages to the list
                    messages: [...olderMessages, ...state.messages],
                    hasMoreMessages: olderMessages.length >= 15,
                    isLoadingHistory: false
                }));
                return true;
            } else {
                set({ hasMoreMessages: false, isLoadingHistory: false });
                return false;
            }
        } catch (e) {
            console.error(e);
            set({ isLoadingHistory: false });
            return false;
        }
    },

    connectWebSocket: () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        if (get().isConnected) return;

        const socketUrl = `ws://localhost:8081/ws?token=${token}`;
        const ws = new WebSocket(socketUrl);

        ws.onopen = () => { set({ isConnected: true, socket: ws }); };
        ws.onmessage = async (event) => {
            const msg: MessageVO = JSON.parse(event.data);

            if (msg.messageType === 20 && msg.content === 'SESSION_REMOVED') {
                const targetGroupId = msg.contactId;
                set((state) => ({
                    sessions: state.sessions.filter(s => s.contactId !== targetGroupId)
                }));
                const { currentSession } = get();
                if (currentSession && currentSession.contactId === targetGroupId) {
                    set({ currentSession: null, messages: [] });
                    toast.info('You have been removed from the group');
                }
                return;
            }

            if (msg.messageType === 9) {
                const onlineUserId = msg.contactId;
                const contact = get().contacts.find(c => c.userContact.contactId === onlineUserId);
                if (contact) {
                    set({
                        onlineNotification: {
                            userId: onlineUserId,
                            text: `${contact.nickName} is online`
                        }
                    });
                    setTimeout(() => {
                        set({ onlineNotification: null });
                    }, 3000);
                }
                set((state) => ({
                    contacts: state.contacts.map((c) => {
                        if (c.userContact && c.userContact.contactId === onlineUserId) {
                            return { ...c, isOnline: true };
                        }
                        return c;
                    })
                }));
                return;
            }

            if (msg.messageType === 10) {
                const offlineUserId = msg.contactId;
                set((state) => ({
                    contacts: state.contacts.map((c) => {
                        if (c.userContact && c.userContact.contactId === offlineUserId) {
                            return { ...c, isOnline: false };
                        }
                        return c;
                    })
                }));
                return;
            }

            if (msg.status === 2) {
                const errorText = msg.errorMsg || 'Message failed to send';
                toast.error(errorText, { duration: 3000 });
            }

            get().addMessage(msg);

            await get().fetchSessions();

            const { currentSession, sessions } = get();
            if (currentSession) {
                const isRelevant =
                    (msg.contactType === 0 && (msg.sendUserId === currentSession.contactId || msg.contactId === currentSession.contactId)) ||
                    (msg.contactType === 1 && msg.contactId === currentSession.contactId);

                if (isRelevant) {
                    const updatedSessions = sessions.map(s =>
                        s.sessionId === currentSession.sessionId ? { ...s, unreadCount: 0 } : s
                    );
                    set({ sessions: updatedSessions });
                    try {
                        await api.post(`/chat/read?contactId=${currentSession.contactId}`);
                    } catch (e) { console.error(e); }
                }
            }
        };
        ws.onclose = () => {
            set({ isConnected: false, socket: null });
            setTimeout(() => { if (localStorage.getItem('token')) get().connectWebSocket(); }, 3000);
        };
    },

    disconnectWebSocket: () => {
        const { socket } = get();
        if (socket) { socket.close(); set({ socket: null, isConnected: false }); }
    },

    sendMessage: (content, type) => {
        const { socket, currentSession, currentUser } = get();
        if (!socket || !currentSession || !currentUser) return;

        const msg = {
            contactId: currentSession.contactId,
            contactType: currentSession.contactType,
            content: content,
            messageType: type,
            sendUserId: currentUser.userId,
            sendUserAvatar: currentUser.avatar,
            filePath: type === 1 ? content : null,
            sendTime: Date.now(),
            status: 0
        };
        socket.send(JSON.stringify(msg));
        get().addMessage(msg as any);
    },

    addMessage: (msg) => {
        const { currentSession, currentUser } = get();
        const isRelevant =
            currentSession &&
            ((msg.contactType === 0 && (msg.sendUserId === currentSession.contactId || msg.contactId === currentSession.contactId)) ||
                (msg.contactType === 1 && msg.contactId === currentSession.contactId));

        if (!isRelevant) return;

        set((state) => {
            const currentMessages = state.messages;
            if (msg.sendUserId === currentUser?.userId) {
                for (let i = currentMessages.length - 1; i >= 0; i--) {
                    const m = currentMessages[i];
                    if (!m.messageId && m.content === msg.content && m.messageType === msg.messageType) {
                        const newMessages = [...currentMessages];
                        newMessages[i] = msg;
                        return { messages: newMessages };
                    }
                }
            }
            if (msg.messageId && currentMessages.some(m => m.messageId === msg.messageId)) return {};
            return { messages: [...currentMessages, msg] };
        });
    },

    uploadFile: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data.success ? res.data.data : null;
        } catch (e) { return null; }
    },

    createGroup: async (groupName, groupNotice, userIds) => {
        try {
            const res = await api.post('/group-info/create', { groupName, groupNotice, userIds });
            if (res.data.success) {
                toast.success('Group created');
                get().fetchSessions();
                return true;
            }
            return false;
        } catch (e) { return false; }
    },

    updateGroup: async (info) => {
        try {
            const res = await api.put('/group-info/update', info);
            if (res.data.success) {
                toast.success('Group updated');
                get().fetchSessions();
                get().fetchGroupInfo(info.groupId);
                return true;
            }
            return false;
        } catch (e) { return false; }
    },

    fetchGroupInfo: async (groupId) => {
        try {
            const res = await api.get(`/group-info/${groupId}`);
            set({ currentGroupInfo: res.data.data });
        } catch (e) { console.error(e); }
    },

    fetchGroupMembers: async (groupId) => {
        try {
            const res = await api.get(`/group-info/members?groupId=${groupId}`);
            set({ currentGroupMembers: res.data.data || [] });
        } catch (e) {
            console.error(e);
            set({ currentGroupMembers: [] });
        }
    },

    kickGroupMember: async (groupId, userId) => {
        try {
            const res = await api.post('/group-info/kick', { groupId, targetUserId: userId });
            if (res.data.success) {
                toast.success('Member kicked');
                get().fetchGroupMembers(groupId);
            } else {
                toast.error(res.data.errorMsg || 'Failed');
            }
        } catch (e) { console.error(e); }
    },

    inviteGroupMember: async (groupId, userId) => {
        try {
            const res = await api.post('/group-info/add', { groupId, targetUserId: userId });
            if (res.data.success) {
                toast.success('Member added successfully');
                get().fetchGroupMembers(groupId);
                return true;
            } else {
                toast.error(res.data.errorMsg || 'Failed to add member');
                return false;
            }
        } catch (e) {
            console.error(e);
            toast.error('Error inviting member');
            return false;
        }
    },

    quitGroup: async (groupId) => {
        try {
            const res = await api.post(`/group-info/quit?groupId=${groupId}`);
            if (res.data.success) {
                toast.success('Left group');
                get().fetchSessions();
                return true;
            }
            return false;
        } catch (e) { return false; }
    },

    disbandGroup: async (groupId) => {
        try {
            const res = await api.post(`/group-info/disband?groupId=${groupId}`);
            if (res.data.success) {
                toast.success('Group disbanded');
                get().fetchSessions();
                return true;
            }
            return false;
        } catch (e) { return false; }
    },

    fetchFriendRequests: async () => {
        try {
            const res = await api.get('/user-apply/received-friend-requests?page=1&pageSize=100');
            set({ friendRequests: res.data.data || [] });
        } catch (e) { console.error(e); }
    },

    fetchGroupRequests: async () => {
        try {
            const res = await api.get('/user-apply/received-group-requests?page=1&pageSize=100');
            set({ groupRequests: res.data.data || [] });
        } catch (e) { console.error(e); }
    },

    processApplyRequest: async (applyId, status) => {
        try {
            const res = await api.put(`/user-apply/process-apply-request?applyId=${applyId}&status=${status}`);
            if (res.data.success) {
                toast.success(status === 1 ? 'Accepted' : 'Rejected');
                get().fetchFriendRequests();
                get().fetchGroupRequests();
                get().fetchContacts(0);
                get().fetchContacts(1);
                get().fetchSessions();
                return true;
            }
            return false;
        } catch (e) { return false; }
    },

    searchUserOrGroup: async (query) => {
        try {
            const res = await api.get(`/user-contact/search?contactId=${query}`);
            if (res.data.success) {
                return res.data.data;
            }
            return null;
        } catch (e) {
            console.error(e);
            return null;
        }
    },

    sendApplyRequest: async (targetId, applyInfo) => {
        try {
            const res = await api.post('/user-apply/send-request', {
                contactId: targetId,
                applyInfo: applyInfo
            });

            if (res.data.success) {
                toast.success('Request sent successfully');
            } else {
                toast.error(res.data.msg || 'Failed to send request');
            }
        } catch (e) {
            console.error(e);
            toast.error('Error sending request');
        }
    },

    updateCurrentUser: async (userInfo) => {
        try {
            const res = await api.put('/user-info/update', userInfo);
            if (res.data.success) {
                toast.success('Profile updated');
                get().fetchCurrentUser();
                return true;
            }
            return false;
        } catch (e) { return false; }
    },

    updatePassword: async (password) => {
        try {
            const res = await api.put('/user-info/update-password', { password });
            if (res.data.success) {
                toast.success('Password updated');
                return true;
            }
            return false;
        } catch (e) { return false; }
    },

    logout: async () => {
        get().disconnectWebSocket();
        try { await api.post('/user-info/logout'); } catch (e) { }
        set({ currentUser: null, sessions: [], messages: [], currentSession: null });
    },

    sendVerificationCode: async (email, type) => {
        try {
            const res = await api.post(`/user-info/sendCode?email=${email}&type=${type}`);
            if (res.data.success) {
                toast.success('Verification code sent');
                return true;
            } else {
                toast.error(res.data.msg || 'Failed to send code');
                return false;
            }
        } catch (e) {
            console.error(e);
            toast.error('Error sending code');
            return false;
        }
    },

    resetPassword: async (data) => {
        try {
            const res = await api.post('/user-info/reset-password', data);
            if (res.data.success) {
                toast.success('Password reset successfully');
                return true;
            } else {
                toast.error(res.data.msg || 'Failed to reset password');
                return false;
            }
        } catch (e) {
            console.error(e);
            toast.error('Error resetting password');
            return false;
        }
    },
}));