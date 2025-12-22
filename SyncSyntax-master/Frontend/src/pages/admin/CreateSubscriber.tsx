import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import CTAButton from '../../components/CTAButton';
import StatusMessage from '../../components/StatusMessage';

export default function CreateSubscriber() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [email, setEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            const response = await fetch('/api/newsletterapi', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Subscriber created:', result);
                setStatus({ type: 'success', message: 'Subscriber created successfully!' });
                setTimeout(() => navigate('/admin/users?tab=subscribers'), 1500);
            } else {
                console.error('Failed to create subscriber');
                setStatus({ type: 'error', message: 'Failed to create subscriber. Please try again.' });
            }
        } catch (error) {
            console.error('Error submitting subscriber:', error);
            setStatus({ type: 'error', message: 'An unexpected error occurred. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col gap-8 p-8">
            <div className="max-w-4xl mx-auto w-full">
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/admin/users?tab=subscribers')}
                        className="flex items-center gap-2 px-4 py-2 bg-[#0077B6] text-white hover:bg-[#005f8f] rounded-lg transition-colors w-fit"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Return To Newsletter Subscribers List</span>
                    </button>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Create New Subscriber</h1>
                </div>

                {status && (
                    <div className="mb-6">
                        <StatusMessage
                            type={status.type}
                            message={status.message}
                            onClose={() => setStatus(null)}
                        />
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-base font-medium text-gray-700 mb-1">
                                Subscriber Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter subscriber email"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077B6] focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <div className="min-w-[180px]">
                                <CTAButton
                                    type="submit"
                                    disabled={loading}
                                    size="small"
                                >
                                    <div className="flex items-center justify-center gap-2 w-full whitespace-nowrap">
                                        <Save className="w-4 h-4" />
                                        <span>{loading ? 'Saving...' : 'Save Subscriber'}</span>
                                    </div>
                                </CTAButton>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
