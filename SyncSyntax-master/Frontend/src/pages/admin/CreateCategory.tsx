import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import CTAButton from '../../components/CTAButton';
import StatusMessage from '../../components/StatusMessage';

export default function CreateCategory() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const categoryId = searchParams.get('id');
    const isEditMode = !!categoryId;

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    useEffect(() => {
        if (isEditMode) {
            const fetchCategory = async () => {
                setLoading(true);
                try {
                    const response = await fetch(`/api/categoriesapi/${categoryId}`);
                    if (response.ok) {
                        const data = await response.json();
                        setFormData({
                            name: data.name || '',
                            description: data.description || ''
                        });
                    } else {
                        setStatus({ type: 'error', message: 'Failed to fetch category data.' });
                    }
                } catch (error) {
                    console.error('Error fetching category:', error);
                    setStatus({ type: 'error', message: 'An error occurred while fetching category data.' });
                } finally {
                    setLoading(false);
                }
            };
            fetchCategory();
        }
    }, [categoryId, isEditMode]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        const endpoint = isEditMode
            ? `/api/categoriesapi/update/${categoryId}`
            : '/api/categoriesapi';
        const method = 'POST'; // We use POST for both create and update (update has specific route)

        try {
            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setStatus({
                    type: 'success',
                    message: isEditMode ? 'Category updated successfully!' : 'Category created successfully!'
                });
                setTimeout(() => navigate('/admin/categories'), 1500);
            } else {
                const errorData = await response.json().catch(() => ({}));
                setStatus({
                    type: 'error',
                    message: errorData.error || `Failed to ${isEditMode ? 'update' : 'create'} category.`
                });
            }
        } catch (error) {
            console.error('Error submitting category:', error);
            setStatus({ type: 'error', message: 'An unexpected error occurred. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col gap-8 p-8">
            <div className="max-w-4xl mx-auto w-full">
                {/* Return Button */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/admin/categories')}
                        className="flex items-center gap-2 px-4 py-2 bg-[#0077B6] text-white hover:bg-[#005f8f] rounded-lg transition-colors w-fit"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Return To The Categories List</span>
                    </button>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEditMode ? `Edit Category: ${formData.name}` : 'Create New Category'}
                    </h1>
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

                {/* Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Name Field */}
                        <div>
                            <label htmlFor="name" className="block text-base font-medium text-gray-700 mb-1">
                                Category Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                required
                                maxLength={100}
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Enter category name"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077B6] focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        {/* Description Field */}
                        <div>
                            <label htmlFor="description" className="block text-base font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={4}
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Enter category description..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077B6] focus:border-transparent outline-none transition-all resize-none"
                            />
                        </div>

                        {/* Actions */}
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
                                        <span>{loading ? 'Saving...' : (isEditMode ? 'Update Category' : 'Save Category')}</span>
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
