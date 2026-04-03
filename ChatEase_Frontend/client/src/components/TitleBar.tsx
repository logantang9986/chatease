import React from 'react';
import { Minus, Square, X, Leaf, Flower } from 'lucide-react';

const TitleBar: React.FC = () => {
    // Helper to send window control events safely
    const handleControl = (action: string) => {
        // Debug Log: Frontend click detected
        console.log(`[Frontend] TitleBar button clicked: ${action}`);

        if ((window as any).api) {
            console.log(`[Frontend] Sending '${action}' to Main via Bridge...`);
            (window as any).api.send('window-control', action);
        } else {
            console.error('[Frontend] Error: window.api is missing/undefined!');
        }
    };

    return (
        <div className="h-10 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 flex items-center justify-between px-3 select-none titlebar-drag border-b border-emerald-100/30 z-50">
            {/* Left Section: Icon and Title */}
            <div className="flex items-center gap-2">
                {/* FIXED: Changed path from absolute '/icon.png' to relative './icon.png' to support Electron file protocol */}
                <img src="./icon.png" alt="Icon" className="w-5 h-5 drop-shadow-sm" />
                <span className="text-xs font-bold text-emerald-900 tracking-wide flex items-center gap-1">
                    ChatEase <Leaf size={10} className="text-emerald-500 fill-emerald-200" />
                </span>
            </div>

            {/* Middle Section: Decorative Elements */}
            <div className="absolute left-1/2 transform -translate-x-1/2 opacity-20 pointer-events-none flex gap-4">
                <Flower size={14} className="text-emerald-400 rotate-12" />
                <Leaf size={14} className="text-teal-400 -rotate-45" />
            </div>

            {/* Right Section: Window Controls */}
            <div className="flex items-center gap-1 titlebar-no-drag">
                <button
                    onClick={() => handleControl('minimize')}
                    className="p-1.5 hover:bg-emerald-100 rounded-md text-emerald-700 transition-colors duration-200"
                    title="Minimize"
                >
                    <Minus size={14} />
                </button>
                <button
                    onClick={() => handleControl('maximize')}
                    className="p-1.5 hover:bg-emerald-100 rounded-md text-emerald-700 transition-colors duration-200"
                    title="Maximize"
                >
                    <Square size={12} />
                </button>
                <button
                    onClick={() => handleControl('close')}
                    className="p-1.5 hover:bg-red-500 hover:text-white rounded-md text-emerald-700 transition-colors duration-200"
                    title="Close"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};

export default TitleBar;