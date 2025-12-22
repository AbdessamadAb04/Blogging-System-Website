import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface StatusMessageProps {
    type: 'success' | 'error';
    message: string;
    onClose?: () => void;
}

export default function StatusMessage({ type, message, onClose }: StatusMessageProps) {
    const isSuccess = type === 'success';

    return (
        <div className={`rounded-lg p-4 flex items-start gap-3 ${isSuccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
            {isSuccess ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}

            <div className="flex-1">
                <h3 className={`text-sm font-medium ${isSuccess ? 'text-green-800' : 'text-red-800'
                    }`}>
                    {isSuccess ? 'Success' : 'Error'}
                </h3>
                <div className={`mt-1 text-sm ${isSuccess ? 'text-green-700' : 'text-red-700'
                    }`}>
                    {message}
                </div>
            </div>

            {onClose && (
                <button
                    onClick={onClose}
                    className={`p-1.5 rounded-md hover:bg-opacity-20 transition-colors ${isSuccess
                            ? 'text-green-600 hover:bg-green-600'
                            : 'text-red-600 hover:bg-red-600'
                        }`}
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
