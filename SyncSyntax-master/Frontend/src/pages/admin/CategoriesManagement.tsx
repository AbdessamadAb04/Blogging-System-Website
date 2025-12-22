import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit, Plus } from 'lucide-react';
import type { Category } from '../../types/models';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import StatusMessage from '../../components/StatusMessage';

interface CategoriesWithPostCount extends Category {
    postCount: number;
}

export default function CategoriesManagement() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<CategoriesWithPostCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<CategoriesWithPostCount | null>(null);

    const getCategoryDescription = (category: any) => {
        // Check several possible keys/casings that may come from the API
        const raw = category?.description ?? category?.Description ?? category?.desc ?? category?.summary ?? category?.details ?? category?.meta?.description ?? '';
        const text = String(raw ?? '').trim();
        return text || 'No description available';
    };

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                // Fetch categories and posts in parallel
                const [categoriesResponse, postsResponse] = await Promise.all([
                    fetch('/api/postsapi/categories'),
                    fetch('/api/postsapi')
                ]);

                if (!categoriesResponse.ok || !postsResponse.ok) {
                    throw new Error(`HTTP error! status: ${categoriesResponse.status} / ${postsResponse.status}`);
                }

                const categoriesData = await categoriesResponse.json();
                const postsData = await postsResponse.json();

                // Build a map of post counts by category id (preferred) and by name (fallback)
                const countsById: Record<string, number> = {};
                const countsByName: Record<string, number> = {};

                postsData.forEach((post: any) => {
                    const catId = post.category?.id ?? post.categoryId ?? post.CategoryId ?? null;
                    if (catId !== null && catId !== undefined) {
                        const key = String(catId);
                        countsById[key] = (countsById[key] || 0) + 1;
                    } else {
                        // fallback to name-based counting
                        const name = (post.category?.name || post.categoryName || post.categoryTitle || '').toString().toLowerCase().trim();
                        if (name) countsByName[name] = (countsByName[name] || 0) + 1;
                    }
                });

                // Calculate real post counts for each category using id if available, otherwise name
                const categoriesWithCounts: CategoriesWithPostCount[] = categoriesData.map((category: Category) => {
                    const idKey = String(category.id);
                    const byId = countsById[idKey] || 0;
                    const byName = countsByName[category.name.toLowerCase()] || 0;
                    const postCount = Math.max(byId, byName);
                    return { ...category, postCount };
                });

                setCategories(categoriesWithCounts);
            } catch (error) {
                console.error('Error fetching categories:', error);
                setCategories([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    const handleEdit = (categoryId: number) => {
        navigate(`/admin/create-category?id=${categoryId}`);
    };

    const handleDelete = (category: CategoriesWithPostCount) => {
        setCategoryToDelete(category);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (categoryToDelete) {
            try {
                const response = await fetch(`/api/categoriesapi/${categoryToDelete.id}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    setCategories(prev => prev.filter(cat => cat.id !== categoryToDelete.id));
                    setStatus({ type: 'success', message: `Category "${categoryToDelete.name}" deleted successfully.` });
                } else {
                    let errorMessage = 'Failed to delete category';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.error || errorData.details || errorMessage;
                    } catch (e) {
                        // Fallback if response is not JSON
                        errorMessage = `Error ${response.status}: Internal Server Error`;
                    }
                    setStatus({ type: 'error', message: errorMessage });
                }
            } catch (error) {
                console.error('Error deleting category:', error);
            } finally {
                setCategoryToDelete(null);
                setDeleteModalOpen(false);
            }
        }
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
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-[#333333]">Categories Management</h1>
                <p className="text-gray-600 mt-2">Organize your content with categories</p>
            </div>

            {/* Separator Line */}
            <hr className="w-full border-t border-gray-200" />

            {status && (
                <div className="mb-6">
                    <StatusMessage
                        type={status.type}
                        message={status.message}
                        onClose={() => setStatus(null)}
                    />
                </div>
            )}

            {/* Categories Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="px-6 py-5 text-left text-sm font-semibold text-gray-900 border-r border-gray-200">Id</th>
                                <th className="px-6 py-5 text-left text-sm font-semibold text-gray-900 border-r border-gray-200">Category Name</th>
                                <th className="px-6 py-5 text-left text-sm font-semibold text-gray-900 border-r border-gray-200">Description</th>
                                <th className="px-6 py-5 text-left text-sm font-semibold text-gray-900 border-r border-gray-200">Post Count</th>
                                <th className="px-6 py-5 text-left text-sm font-semibold text-gray-900">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-gray-200">
                            {categories.map((category) => (
                                <tr key={category.id} className="hover:bg-gray-50 border-b border-gray-100">
                                    <td className="px-6 py-6 border-r border-gray-200">
                                        <span className="text-base font-medium text-gray-900">#{category.id}</span>
                                    </td>
                                    <td className="px-6 py-6 border-r border-gray-200">
                                        <div className="text-base font-medium text-[#333333]">{category.name}</div>
                                    </td>
                                    <td className="px-6 py-6 border-r border-gray-200">
                                        <div className="text-base text-gray-600">{getCategoryDescription(category)}</div>
                                    </td>
                                    <td className="px-6 py-6 border-r border-gray-200">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                            {category.postCount} posts
                                        </span>
                                    </td>
                                    <td className="px-6 py-6">
                                        {category.name.toLowerCase() !== 'uncategorized' && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(category.id)}
                                                    className="p-2.5 bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-[#0077B6] rounded-md transition-colors border-0 outline-0"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category)}
                                                    className="p-2.5 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-md transition-colors border-0 outline-0"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {categories.length === 0 && (
                    <div className="text-center py-12">
                        <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No categories found</p>
                    </div>
                )}
            </div>

            {/* Add New Category Button */}
            <div className="flex justify-start">
                <button
                    onClick={() => navigate('/admin/create-category')}
                    className="bg-[#0077B6] text-white px-4 py-2 rounded-lg hover:bg-[#005f8f] flex items-center gap-2 focus:outline-none"
                >
                    <Plus className="w-5 h-5" />
                    Add New Category
                </button>
            </div>
            <DeleteConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                itemName={categoryToDelete ? `category "${categoryToDelete.name}"` : 'this category'}
            />
        </div>
    );
}
