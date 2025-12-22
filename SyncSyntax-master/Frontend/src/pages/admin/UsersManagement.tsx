import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Users, Mail, Shield, User, ChevronLeft, ChevronRight } from 'lucide-react';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import StatusMessage from '../../components/StatusMessage';

// Global index to map numeric UI IDs back to AspNet string IDs
const usersJsonIndex: Record<number, string> = {};

interface RegisteredUser {
    id: number;
    fullName: string;
    email: string;
    role: 'Admin' | 'User';
    registrationDate: string;
    lastLogin?: string;
}

interface NewsletterSubscriber {
    id: number;
    email: string;
    userId?: number; // Foreign key to registered user (optional) - numeric UI id derived from the string user id
    subscriptionDate: string;
}

export default function UsersManagement() {
    const navigate = useNavigate();
    // Check for ?tab=subscribers in the URL to set the default tab
    const [activeTab, setActiveTab] = useState<'users' | 'subscribers'>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('tab') === 'subscribers') return 'subscribers';
        }
        return 'users';
    });
    const [users, setUsers] = useState<RegisteredUser[]>([]);
    const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
    const [totalUsersCount, setTotalUsersCount] = useState<number | null>(null);
    const [adminCount, setAdminCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<RegisteredUser | null>(null);
    const [subscriberToDelete, setSubscriberToDelete] = useState<NewsletterSubscriber | null>(null);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch registered users list (if available) and counts
                const usersListReq = fetch('/api/usersapi');
                const usersCountReq = fetch('/api/usersapi/count');
                // Fetch newsletter subscribers (real data)
                const subscribersReq = fetch('/api/newsletterapi');

                const [usersListRes, usersCountRes, subscribersRes] = await Promise.all([
                    usersListReq,
                    usersCountReq,
                    subscribersReq
                ]);

                if (usersListRes.ok && (usersListRes.headers.get('content-type') || '').includes('application/json')) {
                    const usersJson = await usersListRes.json();
                    // Map API user shape to RegisteredUser for UI
                    const mapped = (usersJson as any[]).map((u) => {
                        const numericId = typeof u.id === 'string' ? parseInt(u.id.slice(0, 6), 36) : (u.id as number) || 0;
                        usersJsonIndex[numericId] = u.id; // Store in index
                        return {
                            id: numericId,
                            fullName: u.userName || u.email || 'User',
                            email: u.email || '',
                            role: (u.roles && u.roles.includes('Admin')) ? 'Admin' : 'User',
                            registrationDate: u.registrationDate || new Date().toISOString(),
                            lastLogin: u.lastLogin
                        } as RegisteredUser;
                    });

                    setUsers(mapped);
                }

                if (usersCountRes.ok && (usersCountRes.headers.get('content-type') || '').includes('application/json')) {
                    const counts = await usersCountRes.json();
                    setTotalUsersCount(counts.totalUsers ?? null);
                    setAdminCount(counts.adminCount ?? null);
                }

                if (subscribersRes.ok && (subscribersRes.headers.get('content-type') || '').includes('application/json')) {
                    const subsJson = await subscribersRes.json();
                    const mappedSubs = (subsJson as any[]).map((s) => {
                        // API returns userId as a string (AspNetUsers.Id) or null. Convert to the numeric id used in the UI mapping.
                        let mappedUserId: number | undefined = undefined;
                        if (typeof s.userId === 'string' && s.userId) {
                            try {
                                mappedUserId = parseInt((s.userId as string).slice(0, 6), 36);
                            } catch {
                                mappedUserId = undefined;
                            }
                        } else if (typeof s.userId === 'number') {
                            mappedUserId = s.userId;
                        }

                        return ({
                            id: s.id,
                            email: s.email,
                            userId: mappedUserId,
                            subscriptionDate: s.subscribedAt || s.subscriptionDate
                        } as NewsletterSubscriber);
                    });

                    setSubscribers(mappedSubs);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Reset pagination when tab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchTerm]);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePreviousPage = () => {
        scrollToTop();
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        scrollToTop();
        if (currentPage < getTotalPages()) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePageClick = (page: number) => {
        setCurrentPage(page);
        scrollToTop();
    };

    // Handle user actions
    const handleEditUser = (userId: number | string) => {
        // Find the actual user ID string if numeric mapping was used
        const user = users.find(u => u.id === userId);
        const actualId = user ? usersJsonIndex[userId as number] || userId : userId;
        navigate(`/admin/create-user?id=${actualId}`);
    };

    const handleDeleteUser = (user: RegisteredUser) => {
        setSubscriberToDelete(null);
        setUserToDelete(user);
        setDeleteModalOpen(true);
    };

    const handleDeleteSubscriber = (subscriber: NewsletterSubscriber) => {
        setUserToDelete(null);
        setSubscriberToDelete(subscriber);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (userToDelete) {
            try {
                // Find actual ID
                const actualId = usersJsonIndex[userToDelete.id as number] || userToDelete.id;
                const response = await fetch(`/api/usersapi/${actualId}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
                    setStatus({ type: 'success', message: `User "${userToDelete.fullName}" deleted successfully.` });
                } else {
                    const error = await response.json().catch(() => ({}));
                    setStatus({ type: 'error', message: error.error || 'Failed to delete user.' });
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                setStatus({ type: 'error', message: 'An unexpected error occurred.' });
            } finally {
                setUserToDelete(null);
                setDeleteModalOpen(false);
            }
        } else if (subscriberToDelete) {
            try {
                const response = await fetch(`/api/newsletterapi/${subscriberToDelete.id}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    setSubscribers(prev => prev.filter(s => s.id !== subscriberToDelete.id));
                    setStatus({ type: 'success', message: `Subscriber "${subscriberToDelete.email}" removed successfully.` });
                } else {
                    const error = await response.json().catch(() => ({}));
                    setStatus({ type: 'error', message: error.error || 'Failed to remove subscriber.' });
                }
            } catch (error) {
                console.error('Error deleting subscriber:', error);
                setStatus({ type: 'error', message: 'An unexpected error occurred.' });
            } finally {
                setSubscriberToDelete(null);
                setDeleteModalOpen(false);
            }
        }
    };


    // Filter and pagination logic
    const getFilteredData = () => {
        if (activeTab === 'users') {
            return users.filter(user => {
                const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchTerm.toLowerCase());
                return matchesSearch;
            });
        } else {
            return subscribers.filter(subscriber => {
                const matchesSearch = subscriber.email.toLowerCase().includes(searchTerm.toLowerCase());
                return matchesSearch;
            });
        }
    };

    const filteredData = getFilteredData();
    const getTotalPages = () => Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = filteredData.slice(startIndex, endIndex);

    // Note: status column removed — no status color helper required

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse bg-gray-200 h-8 w-48 rounded"></div>
                <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-[#333333]">Users Management</h1>
                <p className="text-gray-600 mt-2">Manage registered users and newsletter subscribers</p>
            </div>

            {status && (
                <StatusMessage
                    type={status.type}
                    message={status.message}
                    onClose={() => setStatus(null)}
                />
            )}

            {/* Separator Line */}
            <hr className="w-full border-t border-gray-200" />

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Total Users</p>
                            <p className="text-2xl font-semibold text-[#333333]">{totalUsersCount !== null ? totalUsersCount : users.length}</p>
                        </div>
                        <User className="w-8 h-8 text-[#0077B6]" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Newsletter Subscribers</p>
                            <p className="text-2xl font-semibold text-blue-600">{subscribers.length}</p>
                        </div>
                        <Mail className="w-8 h-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Admins</p>
                            <p className="text-2xl font-semibold text-purple-600">{adminCount !== null ? adminCount : users.filter(u => u.role === 'Admin').length}</p>
                        </div>
                        <Shield className="w-8 h-8 text-purple-600" />
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex justify-center border-b border-gray-200 bg-gray-50 p-4">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-6 py-3 text-sm font-medium rounded-lg transition-all duration-300 ease-in-out border ${activeTab === 'users'
                                ? 'bg-white text-gray-900 shadow-md border-gray-200'
                                : 'bg-gray-50 text-gray-600 hover:text-gray-800 hover:bg-gray-100 border-transparent'
                                }`}
                            style={{ backgroundColor: activeTab === 'users' ? '#ffffff' : '#f9fafb' }}
                        >
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Registered Users ({users.length})
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('subscribers')}
                            className={`px-6 py-3 text-sm font-medium rounded-lg transition-all duration-300 ease-in-out border ${activeTab === 'subscribers'
                                ? 'bg-white text-gray-900 shadow-md border-gray-200'
                                : 'bg-gray-50 text-gray-600 hover:text-gray-800 hover:bg-gray-100 border-transparent'
                                }`}
                            style={{ backgroundColor: activeTab === 'subscribers' ? '#ffffff' : '#f9fafb' }}
                        >
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Newsletter Subscribers ({subscribers.length})
                            </div>
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="p-6 bg-gray-50 border-b border-gray-200">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative" style={{ width: '900px' }}>
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder={activeTab === 'users' ? 'Search by name or email...' : 'Search by email...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077B6] focus:border-[#0077B6] outline-none"
                            />
                        </div>

                        {/* Status filter removed (status column was removed). */}
                    </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="px-6 py-5 text-left text-sm font-semibold text-gray-900 border-r border-gray-200">Id</th>
                                {activeTab === 'users' ? (
                                    <>
                                        <th className="px-6 py-5 text-left text-sm font-semibold text-gray-900 border-r border-gray-200">Full Name</th>
                                        <th className="px-6 py-5 text-left text-sm font-semibold text-gray-900 border-r border-gray-200">Email</th>
                                        <th className="px-6 py-5 text-left text-sm font-semibold text-gray-900 border-r border-gray-200">Role</th>
                                        <th className="px-6 py-5 text-left text-sm font-semibold text-gray-900 border-r border-gray-200">Registration Date</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-6 py-5 text-left text-sm font-semibold text-gray-900 border-r border-gray-200">Email</th>
                                        <th className="px-6 py-5 text-left text-sm font-semibold text-gray-900 border-r border-gray-200">Linked User</th>
                                        <th className="px-6 py-5 text-left text-sm font-semibold text-gray-900 border-r border-gray-200">Subscription Date</th>
                                    </>
                                )}
                                <th className="px-6 py-5 text-left text-sm font-semibold text-gray-900" style={{ width: '180px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-gray-200">
                            {activeTab === 'users' ? (
                                (currentData as RegisteredUser[]).map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 border-b border-gray-100">
                                        <td className="px-6 py-3 border-r border-gray-200">
                                            <span className="text-base font-medium text-gray-900">#{user.id}</span>
                                        </td>
                                        <td className="px-6 py-3 border-r border-gray-200">
                                            <div className="text-base font-medium text-[#333333]">{user.fullName}</div>
                                        </td>
                                        <td className="px-6 py-3 border-r border-gray-200">
                                            <div className="text-base text-gray-600">{user.email}</div>
                                        </td>
                                        <td className="px-6 py-3 border-r border-gray-200">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${user.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 border-r border-gray-200">
                                            <div className="text-base text-gray-900">
                                                {new Date(user.registrationDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            {user.email !== 'admin@example.com' && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEditUser(user.id)}
                                                        className="p-2.5 bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-[#0077B6] rounded-md transition-colors border-0 outline-0"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user)}
                                                        className="p-2.5 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-md transition-colors border-0 outline-0"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                (currentData as NewsletterSubscriber[]).map((subscriber) => {
                                    const linkedUser = users.find(u => u.id === subscriber.userId);
                                    return (
                                        <tr key={subscriber.id} className="hover:bg-gray-50 border-b border-gray-100">
                                            <td className="px-6 py-3 border-r border-gray-200">
                                                <span className="text-base font-medium text-gray-900">#{subscriber.id}</span>
                                            </td>
                                            <td className="px-6 py-3 border-r border-gray-200">
                                                <div className="text-base text-gray-600">{subscriber.email}</div>
                                            </td>
                                            <td className="px-6 py-3 border-r border-gray-200">
                                                {linkedUser ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-base text-[#333333]">{linkedUser.fullName}</span>
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            Linked
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">Not linked</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 border-r border-gray-200">
                                                <div className="text-base text-gray-900">
                                                    {new Date(subscriber.subscriptionDate).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleDeleteSubscriber(subscriber)}
                                                        className="p-2.5 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-md transition-colors border-0 outline-0"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredData.length === 0 && (
                    <div className="text-center py-12">
                        {activeTab === 'users' ? <User className="w-12 h-12 text-gray-400 mx-auto mb-4" /> : <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />}
                        <p className="text-gray-500">No {activeTab === 'users' ? 'users' : 'subscribers'} found matching your criteria</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {filteredData.length > 0 && (
                <div className="flex items-center justify-between bg-white px-6 py-3 border border-gray-200 rounded-lg">
                    <div className="text-sm text-gray-700">
                        Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, filteredData.length)}</span> of{' '}
                        <span className="font-medium">{filteredData.length}</span> results
                    </div>
                    {getTotalPages() > 1 && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePreviousPage}
                                className={`p-2 text-sm rounded transition-colors flex items-center justify-center ${currentPage <= 1
                                    ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                title="Previous page"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => handlePageClick(page)}
                                    className={`px-3 py-1 text-sm rounded transition-colors ${currentPage === page
                                        ? 'bg-[#0077B6] text-white hover:bg-[#005f8f]'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                onClick={handleNextPage}
                                className={`p-2 text-sm rounded transition-colors flex items-center justify-center ${currentPage >= getTotalPages()
                                    ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                title="Next page"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Add New Button */}
            <div className="flex justify-start">
                <button
                    onClick={() => navigate(activeTab === 'users' ? '/admin/create-user' : '/admin/create-subscriber')}
                    className="bg-[#0077B6] text-white px-4 py-2 rounded-lg hover:bg-[#005f8f] flex items-center gap-2 focus:outline-none"
                >
                    <Plus className="w-5 h-5" />
                    Add New {activeTab === 'users' ? 'User' : 'Subscriber'}
                </button>
            </div>

            <DeleteConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                itemName={userToDelete ? `user "${userToDelete.fullName}"` : subscriberToDelete ? `subscriber "${subscriberToDelete.email}"` : 'this item'}
            />
        </div>
    );
}
