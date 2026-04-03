import React, { useState, useEffect, useRef } from 'react';
import { X, Users, LogOut, Camera, Save, ShieldAlert, Settings, UserPlus, Check, Trash2, Ban } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { toast } from 'sonner';
// Import ContactInfoModal
import ContactInfoModal from './ContactInfoModal';

interface GroupInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const GroupInfoModal: React.FC<GroupInfoModalProps> = ({ isOpen, onClose }) => {
    const {
        currentGroupInfo,
        currentGroupMembers,
        currentUser,
        fetchGroupInfo,
        fetchGroupMembers,
        updateGroup,
        quitGroup,
        disbandGroup,
        uploadFile,
        kickGroupMember,
        inviteGroupMember,
        currentSession
    } = useChatStore();

    const [isEditing, setIsEditing] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [groupNotice, setGroupNotice] = useState('');
    const [groupAvatar, setGroupAvatar] = useState('');
    const [joinType, setJoinType] = useState(0);

    const [isAddingMember, setIsAddingMember] = useState(false);
    const [inviteUserId, setInviteUserId] = useState('');

    const [showDisbandConfirm, setShowDisbandConfirm] = useState(false);
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);

    // New State for Kick Confirmation
    const [kickTarget, setKickTarget] = useState<{ id: string; name: string } | null>(null);

    // State for selected member profile
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && currentSession?.contactType === 1) {
            fetchGroupInfo(currentSession.contactId);
            fetchGroupMembers(currentSession.contactId);
        }
    }, [isOpen, currentSession]);

    useEffect(() => {
        if (!isOpen) {
            setIsEditing(false);
            setShowDisbandConfirm(false);
            setShowQuitConfirm(false);
            setKickTarget(null); // Reset kick target
            setIsAddingMember(false);
            setInviteUserId('');
            setSelectedMemberId(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (currentGroupInfo) {
            setGroupName(currentGroupInfo.groupName || '');
            setGroupNotice(currentGroupInfo.groupNotice || '');
            setGroupAvatar(currentGroupInfo.groupAvatar || '');
            const serverJoinType = currentGroupInfo.joinType ?? currentGroupInfo.groupInfo?.joinType ?? 0;
            setJoinType(serverJoinType);
        }
    }, [currentGroupInfo]);

    if (!isOpen || !currentGroupInfo) return null;

    const remoteOwnerId = currentGroupInfo.ownerId || currentGroupInfo.groupInfo?.groupOwnerId;
    const isOwner = String(remoteOwnerId) === String(currentUser?.userId);

    const handleUpdate = async () => {
        if (!groupName.trim()) return toast.error('Group name is required');

        const success = await updateGroup({
            groupId: currentGroupInfo.groupId,
            groupName,
            groupNotice,
            groupAvatar,
            joinType
        });

        if (success) {
            setIsEditing(false);
        }
    };

    const handleAvatarClick = () => {
        if (isEditing) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const toastId = toast.loading('Uploading avatar...');
            const url = await uploadFile(file);
            toast.dismiss(toastId);
            if (url) {
                setGroupAvatar(url);
            } else {
                toast.error('Failed to upload image');
            }
        }
    };

    // Click "Kick" icon -> Open Modal
    const handleClickKick = (e: React.MouseEvent, userId: string, nickName: string) => {
        e.stopPropagation();
        setKickTarget({ id: userId, name: nickName });
    };

    // Confirm Kick Action
    const handleConfirmKick = async () => {
        if (kickTarget) {
            await kickGroupMember(currentGroupInfo.groupId, kickTarget.id);
            setKickTarget(null);
        }
    };

    const handleConfirmQuit = async () => {
        const success = await quitGroup(currentGroupInfo.groupId);
        if (success) {
            onClose();
        }
    };

    const handleConfirmDisband = async () => {
        const success = await disbandGroup(currentGroupInfo.groupId);
        if (success) {
            onClose();
        }
    };

    const toggleJoinType = () => {
        setJoinType(prev => prev === 1 ? 0 : 1);
    };

    const handleInvite = async () => {
        if (!inviteUserId.trim()) return;
        const userId = inviteUserId.trim();

        const success = await inviteGroupMember(currentGroupInfo.groupId, userId);
        if (success) {
            setIsAddingMember(false);
            setInviteUserId('');
        }
    };

    const handleMemberClick = (userId: string) => {
        setSelectedMemberId(userId);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up max-h-[85vh] flex flex-col">

                {/* Render Contact Info Modal if a member is selected */}
                {selectedMemberId && (
                    <ContactInfoModal
                        isOpen={!!selectedMemberId}
                        onClose={() => setSelectedMemberId(null)}
                        contactId={selectedMemberId}
                        onChatStarted={onClose}
                    />
                )}

                {/* KICK CONFIRMATION OVERLAY (New UI) */}
                {kickTarget && (
                    <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-fade-in text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <Ban size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Remove Member?</h3>
                        <p className="text-sm text-slate-500 mb-8 max-w-[240px] leading-relaxed">
                            Are you sure you want to remove <span className="font-bold text-slate-700">{kickTarget.name}</span> from the group?
                        </p>
                        <div className="flex gap-3 w-full max-w-[260px]">
                            <button
                                onClick={() => setKickTarget(null)}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmKick}
                                className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 transition-all text-sm"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                )}

                {/* Disband Confirmation Overlay */}
                {showDisbandConfirm && (
                    <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-fade-in text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <ShieldAlert size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Disband this group?</h3>
                        <p className="text-sm text-slate-500 mb-8 max-w-[240px] leading-relaxed">
                            This action cannot be undone. All members will be removed and chat history will be deleted.
                        </p>
                        <div className="flex gap-3 w-full max-w-[260px]">
                            <button
                                onClick={() => setShowDisbandConfirm(false)}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDisband}
                                className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 transition-all text-sm"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                )}

                {/* Quit Confirmation Overlay */}
                {showQuitConfirm && (
                    <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-fade-in text-center">
                        <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <LogOut size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Leave this group?</h3>
                        <p className="text-sm text-slate-500 mb-8 max-w-[240px] leading-relaxed">
                            {isOwner
                                ? "Since you are the owner, ownership will be transferred to the earliest member."
                                : "You will stop receiving messages from this group."}
                        </p>
                        <div className="flex gap-3 w-full max-w-[260px]">
                            <button
                                onClick={() => setShowQuitConfirm(false)}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmQuit}
                                className="flex-1 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all text-sm"
                            >
                                Leave
                            </button>
                        </div>
                    </div>
                )}


                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Users size={20} className="text-emerald-600" />
                        Group Info
                    </h2>
                    <div className="flex items-center gap-2">
                        {isOwner && !isEditing && (
                            <>
                                <button
                                    onClick={() => setShowDisbandConfirm(true)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                    title="Disband Group"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all"
                                    title="Group Settings"
                                >
                                    <Settings size={18} />
                                </button>
                            </>
                        )}
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Left: Group Details */}
                        <div className="flex-1 space-y-6">
                            <div className="flex flex-col items-center gap-4">
                                <div className={`relative group ${isEditing ? 'cursor-pointer' : ''}`} onClick={handleAvatarClick}>
                                    <img
                                        src={groupAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName)}&background=random`}
                                        alt="Group"
                                        className="w-24 h-24 rounded-2xl object-cover shadow-lg border-4 border-white"
                                    />
                                    {isEditing && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera size={24} />
                                        </div>
                                    )}
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                </div>

                                {isEditing ? (
                                    <input
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        className="text-center font-bold text-xl border-b-2 border-emerald-500 outline-none bg-transparent w-full"
                                        placeholder="Group Name"
                                    />
                                ) : (
                                    <h3 className="font-bold text-2xl text-slate-800">{groupName}</h3>
                                )}
                                <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded-md">ID: {currentGroupInfo.groupId}</span>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Announcement</label>
                                {isEditing ? (
                                    <textarea
                                        value={groupNotice}
                                        onChange={(e) => setGroupNotice(e.target.value)}
                                        className="w-full bg-white p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none"
                                        rows={3}
                                        placeholder="Add a group notice..."
                                    />
                                ) : (
                                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                        {groupNotice || 'No announcement yet.'}
                                    </p>
                                )}
                            </div>

                            {/* Join Type Setting */}
                            {isEditing && isOwner && (
                                <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
                                    <div>
                                        <span className="text-sm font-bold text-slate-700 block">Approval Required</span>
                                        <span className="text-xs text-slate-500">New members must be approved by owner/admin</span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={toggleJoinType}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${joinType === 1 ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${joinType === 1 ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            )}

                            {isEditing && (
                                <div className="flex gap-2">
                                    <button onClick={handleUpdate} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                                        <Save size={16} /> Save Changes
                                    </button>
                                    <button onClick={() => setIsEditing(false)} className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Right: Members List */}
                        <div className="w-full md:w-64 flex flex-col border-l border-slate-100 md:pl-8 pt-6 md:pt-0">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-bold text-slate-700">Members ({currentGroupMembers.length})</span>
                                <button
                                    onClick={() => setIsAddingMember(!isAddingMember)}
                                    className={`p-1.5 rounded-lg transition-colors ${isAddingMember ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                    title="Add Member"
                                >
                                    <UserPlus size={16} />
                                </button>
                            </div>

                            {isAddingMember && (
                                <div className="mb-3 animate-fade-in-up">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={inviteUserId}
                                            onChange={(e) => setInviteUserId(e.target.value)}
                                            placeholder="User ID"
                                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500"
                                        />
                                        <button
                                            onClick={handleInvite}
                                            disabled={!inviteUserId.trim()}
                                            className="px-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                        >
                                            <Check size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto pr-2 space-y-2 max-h-[300px] md:max-h-[400px] custom-scrollbar">
                                {currentGroupMembers.map(member => (
                                    <div
                                        key={member.userId}
                                        onClick={() => handleMemberClick(member.userId)}
                                        className="flex items-center justify-between group p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <img src={member.avatar} alt={member.nickName} className="w-8 h-8 rounded-full bg-slate-200 object-cover" />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-700 truncate max-w-[100px]">{member.nickName}</span>
                                                <span className="text-[10px] text-slate-400">
                                                    {member.role === 0 ? 'Owner' : (member.role === 1 ? 'Admin' : 'Member')}
                                                </span>
                                            </div>
                                        </div>
                                        {/* Updated Kick Button Logic */}
                                        {isOwner && String(member.userId) !== String(currentUser?.userId) && (
                                            <button
                                                onClick={(e) => handleClickKick(e, member.userId, member.nickName)}
                                                className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                title="Kick member"
                                            >
                                                <LogOut size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
                    <button
                        onClick={() => setShowQuitConfirm(true)}
                        className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-700 text-sm font-bold px-4 py-2 hover:bg-red-50 rounded-xl transition-all"
                    >
                        <LogOut size={16} /> Leave Group
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupInfoModal;

