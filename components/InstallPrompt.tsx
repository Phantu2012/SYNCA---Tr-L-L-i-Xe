import React from 'react';
import { InstallIcon, LogoIcon } from './Icons';

interface InstallPromptProps {
    onInstall: () => void;
    onDismiss: () => void;
}

const InstallPrompt: React.FC<InstallPromptProps> = ({ onInstall, onDismiss }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
            <div className="max-w-md mx-auto bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-4 flex items-center gap-4">
                <LogoIcon />
                <div className="flex-grow">
                    <h4 className="font-bold text-white">Cài đặt Synca</h4>
                    <p className="text-sm text-gray-300">Thêm vào màn hình chính để truy cập nhanh hơn.</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                    <button 
                        onClick={onDismiss} 
                        className="px-3 py-2 text-xs font-semibold text-gray-300 rounded-md hover:bg-gray-700"
                    >
                        Để sau
                    </button>
                    <button 
                        onClick={onInstall} 
                        className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 flex items-center gap-2"
                    >
                        <InstallIcon className="w-4 h-4" />
                        Cài đặt
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up {
                    animation: slide-up 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default InstallPrompt;