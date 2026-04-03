import React, { useEffect, useState } from 'react';
import { X, RefreshCw, Download, CheckCircle, Leaf, Package } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface AppVersion {
    versionNumber: string;
    updateContent: string;
    downloadUrl: string;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
    const [currentVersion, setCurrentVersion] = useState<string>('Loading...');
    const [latestVersion, setLatestVersion] = useState<AppVersion | null>(null);
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchLocalVersion();
            setLatestVersion(null); // Reset checking state
        }
    }, [isOpen]);

    const fetchLocalVersion = async () => {
        if ((window as any).api && (window as any).api.getAppVersion) {
            try {
                const ver = await (window as any).api.getAppVersion();
                setCurrentVersion(ver);
            } catch (e) {
                setCurrentVersion('Unknown');
            }
        } else {
            setCurrentVersion('Web Mode');
        }
    };

    const handleCheckUpdate = async () => {
        setIsChecking(true);
        try {
            const response = await api.get('/api/app-version/latest');
            if (response.data.success && response.data.data) {
                setLatestVersion(response.data.data);

                // Simple version comparison logic
                if (response.data.data.versionNumber === currentVersion) {
                    toast.success('You are using the latest version.');
                } else {
                    toast.info('New version available!');
                }
            } else {
                toast.info('No updates found.');
            }
        } catch (error) {
            toast.error('Failed to check for updates');
        } finally {
            setIsChecking(false);
        }
    };

    const handleDownload = () => {
        if (latestVersion?.downloadUrl) {
            // If in Electron production, baseURL is http://localhost:8081
            // We need to construct the full URL if downloadUrl is relative
            let fullUrl = latestVersion.downloadUrl;
            if (fullUrl.startsWith('/')) {
                // Get baseURL from axios config or hardcode the backend root
                const backendRoot = 'http://localhost:8081';
                fullUrl = `${backendRoot}${latestVersion.downloadUrl}`;
            }
            window.open(fullUrl, '_blank');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-scale-in border border-stone-100">
                <div className="relative h-32 bg-gradient-to-br from-emerald-500 to-teal-600 flex flex-col items-center justify-center text-white">
                    <button onClick={onClose} className="absolute top-3 right-3 p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-white">
                        <X size={16} />
                    </button>
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-inner mb-2">
                        <Leaf size={32} className="text-white fill-emerald-100" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">ChatEase</h2>
                </div>

                <div className="p-6">
                    <div className="flex justify-between items-center mb-6 bg-stone-50 p-3 rounded-xl border border-stone-100">
                        <div>
                            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Current Version</p>
                            <p className="text-stone-800 font-semibold font-mono flex items-center gap-2">
                                v{currentVersion}
                            </p>
                        </div>
                        <div className="h-8 w-[1px] bg-stone-200"></div>
                        <div className="text-right">
                            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Status</p>
                            {latestVersion && latestVersion.versionNumber !== currentVersion ? (
                                <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded-full">Update Available</span>
                            ) : (
                                <span className="text-stone-500 text-xs font-bold">Stable</span>
                            )}
                        </div>
                    </div>

                    {latestVersion && latestVersion.versionNumber !== currentVersion ? (
                        <div className="mb-6 space-y-3 animate-fade-in-up">
                            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                <h3 className="font-bold text-emerald-800 text-sm flex items-center gap-2 mb-1">
                                    <Package size={16} />
                                    New Version v{latestVersion.versionNumber}
                                </h3>
                                <p className="text-xs text-emerald-700/80 leading-relaxed whitespace-pre-wrap">
                                    {latestVersion.updateContent || "Bug fixes and performance improvements."}
                                </p>
                            </div>
                            <button
                                onClick={handleDownload}
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                                <Download size={16} /> Download Update
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleCheckUpdate}
                            disabled={isChecking}
                            className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait active:scale-95"
                        >
                            {isChecking ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                            {isChecking ? 'Checking...' : 'Check for Updates'}
                        </button>
                    )}

                    {latestVersion && latestVersion.versionNumber === currentVersion && (
                        <p className="mt-3 text-center text-xs text-stone-400 flex items-center justify-center gap-1 animate-fade-in">
                            <CheckCircle size={12} className="text-emerald-500" /> You're on the latest build.
                        </p>
                    )}
                </div>

                <div className="bg-stone-50 p-3 text-center border-t border-stone-100">
                    <p className="text-[10px] text-stone-400 font-medium">© 2025 ChatEase Inc. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default AboutModal;