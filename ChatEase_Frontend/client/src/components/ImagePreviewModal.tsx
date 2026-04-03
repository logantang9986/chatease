import React from 'react';
import { X, Download } from 'lucide-react';

interface ImagePreviewModalProps {
    isOpen: boolean;
    imageUrl: string | null;
    onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ isOpen, imageUrl, onClose }) => {
    if (!isOpen || !imageUrl) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
            >
                <X size={24} />
            </button>

            {/* Content */}
            <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <img
                    src={imageUrl}
                    alt="Preview"
                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                />

                {/* Download Button (Optional) */}
                <a
                    href={imageUrl}
                    download="image.png"
                    target="_blank"
                    rel="noreferrer"
                    className="absolute bottom-4 right-4 p-3 bg-stone-900/50 hover:bg-stone-900/80 text-white rounded-xl backdrop-blur-md transition-all opacity-0 hover:opacity-100 group-hover:opacity-100 flex items-center gap-2 text-sm font-medium"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Download size={16} /> Download
                </a>
            </div>
        </div>
    );
};

export default ImagePreviewModal;