import { X, Trash2, AlertTriangle } from 'lucide-react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName?: string;
}

export default function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    itemName = 'this item'
}: DeleteConfirmationModalProps) {

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] h-screen w-screen flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-[2px] animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-slideUp"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-[#0077B6] to-[#00A8E8] p-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-all duration-200"
                        aria-label="Close"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex items-center justify-center">
                        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl px-6 py-4 flex items-center gap-3">
                            <Trash2 className="w-10 h-10 text-white" />
                            <span className="text-2xl font-bold text-white">Confirm Delete</span>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="flex flex-col items-center justify-center gap-4 mb-6">
                        <div className="bg-red-50 rounded-full p-3">
                            <AlertTriangle size={32} className="text-red-500" />
                        </div>
                        <p className="text-center text-gray-600 text-lg">
                            Are you sure about deleting <strong>{itemName}</strong>?
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200"
                        >
                            Delete
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full bg-white text-[#0077B6] py-3 rounded-lg font-semibold border-2 border-[#0077B6] hover:bg-gray-50 transition-colors duration-200"
                        >
                            Cancel
                        </button>
                    </div>

                    <p className="text-center text-xs text-gray-500 mt-4">
                        Deletion is permanent and cannot be recovered.
                    </p>
                </div>
            </div>

            <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
        </div>
    );
}
