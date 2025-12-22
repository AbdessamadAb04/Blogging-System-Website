import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Image as ImageIcon } from 'lucide-react';
import CTAButton from '../../components/CTAButton';
import StatusMessage from '../../components/StatusMessage';

export default function CreateAuthor() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const authorId = searchParams.get('id');
    const isEditMode = !!authorId;

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [formData, setFormData] = useState({
        fullName: '',
        bio: ''
    });
    const [avatar, setAvatar] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    useEffect(() => {
        if (isEditMode) {
            const fetchAuthor = async () => {
                setLoading(true);
                try {
                    const response = await fetch(`/api/authorsapi/${authorId}`);
                    if (response.ok) {
                        const data = await response.json();
                        setFormData({
                            fullName: data.fullName || '',
                            bio: data.description || ''
                        });
                        if (data.avatarUrl) {
                            setAvatarPreview(data.avatarUrl);
                        }
                    } else {
                        setStatus({ type: 'error', message: 'Failed to fetch author data.' });
                    }
                } catch (error) {
                    console.error('Error fetching author:', error);
                    setStatus({ type: 'error', message: 'An error occurred while fetching author data.' });
                } finally {
                    setLoading(false);
                }
            };
            fetchAuthor();
        }
    }, [authorId, isEditMode]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatar(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        const endpoint = isEditMode
            ? `/api/authorsapi/update/${authorId}`
            : '/api/authorsapi';

        try {
            const data = new FormData();
            data.append('fullName', formData.fullName);
            if (formData.bio) data.append('description', formData.bio);

            if (!isEditMode) {
                // Generate a username for new authors
                const userName = formData.fullName.toLowerCase().replace(/\s+/g, '');
                data.append('userName', userName);
            }

            if (avatar) {
                data.append('avatar', avatar);
            }

            const response = await fetch(endpoint, {
                method: 'POST', // We use POST for both create and update
                body: data,
            });

            if (response.ok) {
                setStatus({
                    type: 'success',
                    message: isEditMode ? 'Author updated successfully!' : 'Author created successfully!'
                });
                setTimeout(() => navigate('/admin/authors'), 1500);
            } else {
                const errorData = await response.json().catch(() => ({}));
                setStatus({
                    type: 'error',
                    message: errorData.error || `Failed to ${isEditMode ? 'update' : 'create'} author.`
                });
            }
        } catch (error) {
            console.error('Error submitting author:', error);
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
                        onClick={() => navigate('/admin/authors')}
                        className="flex items-center gap-2 px-4 py-2 bg-[#0077B6] text-white hover:bg-[#005f8f] rounded-lg transition-colors w-fit"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Return To The Authors List</span>
                    </button>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEditMode ? `Edit Author: ${formData.fullName}` : 'Create New Author'}
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

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-12">
                            {/* Avatar Upload Section */}
                            <div>
                                <label className="block text-base font-medium text-gray-700 mb-2">
                                    Profile Picture
                                </label>
                                <div className={`mt-4 w-40 h-40 border-2 border-dashed rounded-full flex items-center justify-center relative overflow-hidden transition-colors ${avatarPreview ? 'border-[#0077B6] bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                                    }`}>
                                    {avatarPreview ? (
                                        <div className="w-full h-full relative group">
                                            <img
                                                src={avatarPreview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAvatar(null);
                                                    setAvatarPreview(null);
                                                }}
                                                className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center p-2 hover:bg-gray-50 transition-colors">
                                            <div className="p-2 bg-gray-100 rounded-full mb-2">
                                                <ImageIcon className="w-5 h-5 text-gray-500" />
                                            </div>
                                            <span className="text-xs font-medium text-gray-900 text-center">Upload Photo</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Form Fields Section */}
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="fullName" className="block text-base font-medium text-gray-700 mb-1">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        required
                                        maxLength={100}
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        placeholder="Enter full name"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077B6] focus:border-transparent outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="bio" className="block text-base font-medium text-gray-700 mb-1">
                                        Bio
                                    </label>
                                    <textarea
                                        id="bio"
                                        name="bio"
                                        rows={5}
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                        placeholder="Enter author bio..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077B6] focus:border-transparent outline-none transition-all resize-none"
                                    />
                                </div>
                            </div>
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
                                        <span>{loading ? 'Saving...' : (isEditMode ? 'Update Author' : 'Save Author')}</span>
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
