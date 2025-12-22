import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Trash2, Eye, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Post } from '../../types/models';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import { NO_IMAGE_PLACEHOLDER } from '../../utils/constants';

interface PostsTableRow extends Post {
    status: 'Draft' | 'Published';
}

export default function BlogsManagement() {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<PostsTableRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [categories, setCategories] = useState<any[]>([]);
    const [filterStatus, setFilterStatus] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<number | null>(null);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch posts and categories in parallel
                const [postsResp, catsResp] = await Promise.all([
                    fetch('/api/postsapi?includeDrafts=true'), // Fetch all posts including drafts
                    fetch('/api/postsapi/categories')
                ]);

                if (!postsResp.ok) throw new Error(`Posts API error: ${postsResp.status}`);

                const postsData = await postsResp.json();
                const catsData = catsResp && catsResp.ok ? await catsResp.json() : [];

                const transformedPosts: PostsTableRow[] = postsData.map((post: any) => ({
                    ...post,
                    status: (post.status && post.status.toLowerCase() === 'published' ? 'Published' : 'Draft') as 'Published' | 'Draft',
                }));

                setPosts(transformedPosts);
                setCategories(Array.isArray(catsData) ? catsData : []);
            } catch (error) {
                console.error('Error fetching posts or categories:', error);
                setPosts([]);
                setCategories([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Defensive category name extractor to tolerate varied API shapes
    const getCategoryName = (post: any) => {
        if (!post) return 'Uncategorized';
        const catObj = post.category;
        if (catObj && typeof catObj === 'object') {
            if (catObj.name) return String(catObj.name);
            if (catObj.title) return String(catObj.title);
        }
        if (typeof catObj === 'string' && catObj.trim()) return catObj;
        if (post.categoryName) return String(post.categoryName);
        if (post.categoryTitle) return String(post.categoryTitle);
        if (post.categoryId && categories && categories.length > 0) {
            const found = categories.find((c: any) => String(c.id) === String(post.categoryId));
            if (found) return found.name;
        }
        return 'Uncategorized';
    };

    const handleEdit = (postId: number) => {
        navigate(`/admin/create-blog-post?id=${postId}`);
    };

    const handleDelete = (postId: number) => {
        setPostToDelete(postId);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (postToDelete) {
            try {
                const response = await fetch(`/api/postsapi/${postToDelete}`, {
                    method: 'DELETE',
                    credentials: 'include', // CRITICAL: This ensures cookies are sent for Auth
                });

                if (response.ok) {
                    setPosts(posts.filter(post => post.id !== postToDelete));
                    console.log('Deleted post:', postToDelete);
                } else {
                    console.error('Failed to delete post:', response.status);
                }
            } catch (error) {
                console.error('Error deleting post:', error);
            } finally {
                setPostToDelete(null);
                setDeleteModalOpen(false); // Close modal
            }
        }
    };

    const handleView = (postId: number) => {
        const post = posts.find(p => p.id === postId);
        const titleSlug = post?.title
            ?.toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-');

        const slug = titleSlug || postId;
        navigate(`/blog/${slug}`);
    };

    const filteredPosts = posts.filter(post => {
        const matchesSearch = post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.content?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || post.category?.name?.toLowerCase() === filterCategory.toLowerCase();
        const matchesStatus = filterStatus === 'all' || post.status?.toLowerCase() === filterStatus.toLowerCase();

        let matchesDate = true;
        if (dateFilter) {
            if (!post.createdAt) {
                matchesDate = false;
            } else {
                const d = new Date(post.createdAt);
                const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                matchesDate = localDate === dateFilter;
            }
        }

        return matchesSearch && matchesCategory && matchesStatus && matchesDate;
    });

    const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPosts = filteredPosts.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterCategory, filterStatus, dateFilter]);

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
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePageClick = (page: number) => {
        setCurrentPage(page);
        scrollToTop();
    };

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
            <div>
                <h1 className="text-3xl font-bold text-[#333333]">Blogs Management</h1>
                <p className="text-gray-600 mt-2">Create, edit, and manage your blog posts</p>
            </div>
            <hr className="w-full border-t border-gray-200" />
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search posts by title or content..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077B6] focus:border-[#0077B6] outline-none"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077B6] focus:border-[#0077B6] outline-none appearance-none bg-white"
                        >
                            <option value="all">All Categories</option>
                            {categories && categories.length > 0 ? (
                                categories.map((c: any) => (
                                    <option key={c.id ?? c.name} value={(c.name || '').toLowerCase()}>{c.name}</option>
                                ))
                            ) : (
                                <>
                                    <option value="travel">Travel</option>
                                    <option value="lifestyle">Lifestyle</option>
                                    <option value="food">Food</option>
                                    <option value="adventure">Adventure</option>
                                </>
                            )}
                        </select>
                    </div>
                    <div className="relative">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077B6] focus:border-[#0077B6] outline-none appearance-none bg-white"
                        >
                            <option value="all">All Status</option>
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                        </select>
                    </div>
                    <div className="relative flex items-center gap-2">
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077B6] focus:border-[#0077B6] outline-none"
                            aria-label="Filter by date"
                        />
                        <button
                            onClick={() => {
                                setDateFilter('');
                                setFilterCategory('all');
                                setFilterStatus('all');
                                setSearchTerm('');
                                setCurrentPage(1);
                            }}
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="px-6 py-5 text-left text-sm font-semibold text-gray-900 border-r border-gray-200">Id</th>
                                <th className="px-6 py-5 text-left text-sm font-semibold text-gray-900 border-r border-gray-200">Hero Image</th>
                                <th className="px-6 py-5 text-left text-sm font-semibold text-gray-900 border-r border-gray-200">Post Titling</th>
                                <th className="px-6 py-5 text-left text-sm font-semibold text-gray-900 border-r border-gray-200">Category</th>
                                <th className="px-8 py-5 text-left text-sm font-semibold text-gray-900 border-r border-gray-200">Author</th>
                                <th className="px-4 py-5 text-left text-sm font-semibold text-gray-900 border-r border-gray-200">Date Published</th>
                                <th className="px-4 py-5 text-left text-sm font-semibold text-gray-900 border-r border-gray-200">Status</th>
                                <th className="px-6 py-5 text-left text-sm font-semibold text-gray-900">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-gray-200">
                            {currentPosts.map((post) => (
                                <tr key={post.id} className="hover:bg-gray-50 border-b border-gray-100">
                                    <td className="px-6 py-6 border-r border-gray-200">
                                        <span className="text-base font-medium text-gray-900">#{post.id}</span>
                                    </td>
                                    <td className="px-4 py-4 border-r border-gray-200">
                                        <div className="w-20 h-18 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                                            <img
                                                src={post.featureImageUrl || NO_IMAGE_PLACEHOLDER}
                                                alt="Hero"
                                                className="w-20 h-18 object-cover flex-shrink-0"
                                                style={{ width: '80px', height: '72px', minWidth: '80px', minHeight: '72px', maxWidth: '80px', maxHeight: '72px' }}
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = NO_IMAGE_PLACEHOLDER;
                                                }}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 border-r border-gray-200">
                                        <div>
                                            <p className="text-base font-medium text-[#333333] truncate max-w-xs">{post.title}</p>
                                            <p className="text-sm text-gray-500 truncate max-w-xs">{post.subtitle || 'No subtitle available'}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 border-r border-gray-200">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                            {getCategoryName(post)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-6 text-base text-gray-900 border-r border-gray-200">
                                        {post.author || 'Unknown Author'}
                                    </td>
                                    <td className="px-4 py-6 text-base text-gray-900 border-r border-gray-200">
                                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'No date'}
                                    </td>
                                    <td className="px-4 py-6 border-r border-gray-200">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${post.status === 'Published'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {post.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-2">
                                            {post.status === 'Published' && (
                                                <button
                                                    onClick={() => handleView(post.id)}
                                                    className="p-2.5 bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-[#0077B6] rounded-md transition-colors border-0 outline-0"
                                                    title="View"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleEdit(post.id)}
                                                className="p-2.5 bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-[#0077B6] rounded-md transition-colors border-0 outline-0"
                                                title="Edit"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(post.id)}
                                                className="p-2.5 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-md transition-colors border-0 outline-0"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredPosts.length === 0 && (
                    <div className="text-center py-12">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No posts found matching your criteria</p>
                    </div>
                )}
            </div>

            {filteredPosts.length > 0 && (
                <div className="flex items-center justify-between bg-white px-6 py-3 border border-gray-200 rounded-lg">
                    <div className="text-sm text-gray-700">
                        Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, filteredPosts.length)}</span> of{' '}
                        <span className="font-medium">{filteredPosts.length}</span> results
                    </div>
                    {totalPages > 1 && (
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
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                                className={`p-2 text-sm rounded transition-colors flex items-center justify-center ${currentPage >= totalPages
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

            <div className="flex justify-start">
                <button
                    onClick={() => navigate('/admin/create-blog-post')}
                    className="bg-[#0077B6] text-white px-4 py-2 rounded-lg hover:bg-[#005f8f] flex items-center gap-2 focus:outline-none"
                >
                    <Plus className="w-5 h-5" />
                    Add New Post
                </button>
            </div>
            <DeleteConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                itemName={postToDelete ? `post #${postToDelete}` : 'this post'}
            />
        </div>
    );
}
