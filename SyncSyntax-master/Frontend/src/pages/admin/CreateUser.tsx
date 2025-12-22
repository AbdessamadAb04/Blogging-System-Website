import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import CTAButton from '../../components/CTAButton';
import StatusMessage from '../../components/StatusMessage';

export default function CreateUser() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const userId = searchParams.get('id');
    const isEditMode = !!userId;

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user',
        isNewsletterSubscribed: false
    });

    useEffect(() => {
        if (isEditMode) {
            const fetchUser = async () => {
                setLoading(true);
                try {
                    const response = await fetch(`/api/usersapi/${userId}`);
                    if (response.ok) {
                        const data = await response.json();
                        setFormData({
                            fullName: data.userName || '',
                            email: data.email || '',
                            password: '',
                            confirmPassword: '',
                            role: data.role?.toLowerCase() || 'user',
                            isNewsletterSubscribed: data.isNewsletterSubscribed || false
                        });
                    } else {
                        setStatus({ type: 'error', message: 'Failed to fetch user data.' });
                    }
                } catch (error) {
                    console.error('Error fetching user:', error);
                    setStatus({ type: 'error', message: 'An error occurred while fetching user data.' });
                } finally {
                    setLoading(false);
                }
            };
            fetchUser();
        }
    }, [userId, isEditMode]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Password validation only if provided or if creating new user
        if (!isEditMode || formData.password) {
            if (formData.password !== formData.confirmPassword) {
                setStatus({ type: 'error', message: 'Passwords do not match!' });
                return;
            }
            if (!isEditMode && !formData.password) {
                setStatus({ type: 'error', message: 'Password is required for new users.' });
                return;
            }
        }

        setLoading(true);
        setStatus(null);

        const endpoint = isEditMode
            ? `/api/usersapi/update/${userId}`
            : '/api/usersapi';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setStatus({
                    type: 'success',
                    message: isEditMode ? 'User updated successfully!' : 'User created successfully!'
                });
                setTimeout(() => navigate('/admin/users'), 1500);
            } else {
                const errorData = await response.json().catch(() => ({}));
                setStatus({
                    type: 'error',
                    message: errorData.error || `Failed to ${isEditMode ? 'update' : 'create'} user.`
                });
            }
        } catch (error) {
            console.error('Error submitting user:', error);
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
                        onClick={() => navigate('/admin/users')}
                        className="flex items-center gap-2 px-4 py-2 bg-[#0077B6] text-white hover:bg-[#005f8f] rounded-lg transition-colors w-fit"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Return To The Users List</span>
                    </button>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEditMode ? `Edit User: ${formData.fullName}` : 'Create New User'}
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
                            <label htmlFor="email" className="block text-base font-medium text-gray-700 mb-1">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Enter email address"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077B6] focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div className={`grid grid-cols-1 ${formData.password.length > 0 ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-6 transition-all duration-300`}>
                            <div>
                                <label htmlFor="password" className="block text-base font-medium text-gray-700 mb-1">
                                    Password {isEditMode ? '(Optional)' : <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    type="text"
                                    id="password"
                                    name="password"
                                    required={!isEditMode}
                                    minLength={6}
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder={isEditMode ? "Type to change password" : "Enter password"}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077B6] focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            {formData.password.length > 0 && (
                                <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                                    <label htmlFor="confirmPassword" className="block text-base font-medium text-gray-700 mb-1">
                                        Confirm Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        required
                                        minLength={6}
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        placeholder="Confirm password"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077B6] focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="role" className="block text-base font-medium text-gray-700 mb-1">
                                Role <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="role"
                                name="role"
                                required
                                value={formData.role}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077B6] focus:border-transparent outline-none transition-all bg-white"
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        name="isNewsletterSubscribed"
                                        checked={formData.isNewsletterSubscribed}
                                        onChange={handleInputChange}
                                        className="w-5 h-5 border-2 border-gray-300 rounded text-[#0077B6] focus:ring-[#0077B6] cursor-pointer transition-all"
                                    />
                                </div>
                                <span className="text-base font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                                    Subscribe user to the newsletter list
                                </span>
                            </label>
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
                                        <span>{loading ? 'Saving...' : (isEditMode ? 'Update User' : 'Save User')}</span>
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
