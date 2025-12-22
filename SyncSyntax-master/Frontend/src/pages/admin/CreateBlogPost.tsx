import { useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CTAButton from '../../components/CTAButton';
import StatusMessage from '../../components/StatusMessage';

interface Category {
    id: number;
    name: string;
}

interface Author {
    id: number | string;
    fullName: string;
}

export default function CreateBlogPost() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [authors, setAuthors] = useState<Author[]>([]);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const [searchParams] = useSearchParams();
    const postId = searchParams.get('id');
    const isEditMode = !!postId;

    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        authorId: '',
        categoryId: '',
        content: '',
        status: 'draft'
    });

    const [featureImage, setFeatureImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        // Fetch categories
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/postsapi/categories');
                if (response.ok) {
                    const data = await response.json();
                    setCategories(data);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
                // Fallback mock data if API fails
                setCategories([
                    { id: 1, name: 'Technology' },
                    { id: 2, name: 'Travel' },
                    { id: 3, name: 'Lifestyle' }
                ]);
            }
        };

        // Fetch authors
        const fetchAuthors = async () => {
            try {
                const response = await fetch('/api/authorsapi');
                if (response.ok) {
                    const data = await response.json();
                    setAuthors(data);
                }
            } catch (error) {
                console.error('Error fetching authors:', error);
                setAuthors([]);
            }
        };

        fetchCategories();
        fetchAuthors();

        // Fetch post data if in edit mode
        if (isEditMode) {
            const fetchPost = async () => {
                setLoading(true);
                try {
                    const response = await fetch(`/api/postsapi/${postId}`);
                    if (response.ok) {
                        const post = await response.json();
                        setFormData({
                            title: post.title || '',
                            subtitle: post.subtitle || '',
                            authorId: post.authorId || '',
                            categoryId: post.category ? String(post.category.id) : (post.categoryId ? String(post.categoryId) : ''),
                            content: post.content || '',
                            status: post.status || 'draft'
                        });
                        // Specific check for authorId to ensure it's a string for the select input
                        if (post.authorId !== null && post.authorId !== undefined) {
                            setFormData(prev => ({ ...prev, authorId: String(post.authorId) }));
                        }
                        if (post.featureImageUrl) {
                            setImagePreview(post.featureImageUrl);
                        }
                    } else {
                        setStatus({ type: 'error', message: 'Failed to fetch post details.' });
                    }
                } catch (error) {
                    console.error('Error fetching post:', error);
                    setStatus({ type: 'error', message: 'Error loading post.' });
                } finally {
                    setLoading(false);
                }
            };
            fetchPost();
        }
    }, [postId, isEditMode]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditorChange = (content: string) => {
        setFormData(prev => ({ ...prev, content }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFeatureImage(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const [submitType, setSubmitType] = useState<'Published' | 'Draft' | null>(null);

    const submitPost = async (statusOverride: 'Published' | 'Draft') => {
        setLoading(true);
        setSubmitType(statusOverride);
        setStatus(null);

        try {
            const data = new FormData();
            data.append('title', formData.title);
            if (formData.subtitle) data.append('subtitle', formData.subtitle);
            data.append('content', formData.content);
            data.append('categoryId', formData.categoryId);
            if (formData.authorId) data.append('authorId', formData.authorId);

            // Use the specific status for this action
            data.append('status', statusOverride);

            if (featureImage) {
                data.append('featureImage', featureImage);
            }

            let response;
            if (isEditMode) {
                response = await fetch(`/api/postsapi/update/${postId}`, {
                    method: 'POST',
                    body: data,
                });
            } else {
                response = await fetch('/api/postsapi', {
                    method: 'POST',
                    body: data,
                });
            }

            if (response.ok) {
                const result = await response.json();
                console.log(isEditMode ? 'Post updated:' : 'Post created:', result);
                setStatus({
                    type: 'success',
                    message: `Blog post ${statusOverride === 'Published' ? 'published' : 'saved as draft'} successfully!`
                });
                setTimeout(() => navigate('/admin/blog-posts'), 1500);
            } else {
                console.error('Failed to submit post');
                setStatus({ type: 'error', message: isEditMode ? 'Failed to update blog post.' : 'Failed to create blog post. Please try again.' });
            }
        } catch (error) {
            console.error('Error submitting post:', error);
            setStatus({ type: 'error', message: 'An unexpected error occurred. Please try again.' });
        } finally {
            setLoading(false);
            setSubmitType(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submitPost('Published');
    };

    const handleSaveDraft = (e: React.MouseEvent) => {
        e.preventDefault();
        submitPost('Draft');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col gap-8">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/admin/blog-posts')}
                                className="flex items-center gap-2 px-4 py-2 bg-[#0077B6] text-white hover:bg-[#005f8f] rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="text-sm font-medium">Return To The Blog List</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSaveDraft}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={loading}
                            >
                                {loading && submitType === 'Draft' ? 'Saving...' : 'Save drafted'}
                            </button>
                            <CTAButton
                                onClick={() => submitPost('Published')}
                                disabled={loading}
                                size="small"
                            >
                                {loading && submitType === 'Published' ? (isEditMode ? 'Updating...' : 'Publishing...') : (isEditMode ? 'Update post' : 'Publish Post')}
                            </CTAButton>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">{isEditMode ? 'Edit Blog Post' : 'Create New Blog Post'}</h1>
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

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content - Left Column */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Title Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="title" className="block text-base font-medium text-gray-700 mb-1">
                                        Post Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        required
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="Enter a captivating title..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077B6] focus:border-transparent outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="subtitle" className="block text-base font-medium text-gray-700 mb-1">
                                        Subtitle
                                    </label>
                                    <input
                                        type="text"
                                        id="subtitle"
                                        name="subtitle"
                                        value={formData.subtitle}
                                        onChange={handleInputChange}
                                        placeholder="Enter a brief subtitle or summary..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077B6] focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Content Editor */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 py-8">
                            <label className="block text-base font-medium text-gray-700 mb-3">
                                Content
                            </label>
                            <div className="min-h-[400px] rounded-lg overflow-hidden">
                                <Editor
                                    apiKey="8v7ap9no879e3vf48t9bipzno7dfbo8dgefvm9kgcttuz3nu"
                                    value={formData.content}
                                    onEditorChange={handleEditorChange}
                                    init={{
                                        height: 500,
                                        menubar: true,
                                        plugins: [
                                            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                                            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                                        ],
                                        toolbar: 'undo redo | blocks | ' +
                                            'bold italic forecolor | alignleft aligncenter ' +
                                            'alignright alignjustify | bullist numlist outdent indent | ' +
                                            'removeformat | help',
                                        content_style: 'body { font-family:Inter,Helvetica,Arial,sans-serif; font-size:14px }'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Right Column */}
                    <div className="space-y-6">

                        {/* Publishing Details */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Publishing Details</h3>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="authorId" className="block text-base font-medium text-gray-700 mb-1">
                                        Author
                                    </label>
                                    <select
                                        id="authorId"
                                        name="authorId"
                                        value={formData.authorId}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077B6] focus:border-transparent outline-none transition-all bg-white"
                                    >
                                        <option value="">No Author</option>
                                        {authors.map(author => (
                                            <option key={author.id} value={String(author.id)}>{author.fullName}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="categoryId" className="block text-base font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <select
                                        id="categoryId"
                                        name="categoryId"
                                        value={formData.categoryId}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077B6] focus:border-transparent outline-none transition-all bg-white"
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(category => (
                                            <option key={category.id} value={category.id}>{category.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Feature Image */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Featured Image</h3>

                            <div className="space-y-4">
                                <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${imagePreview ? 'border-[#0077B6] bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                                    }`}>
                                    {imagePreview ? (
                                        <div className="relative">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full h-48 object-cover rounded-md"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFeatureImage(null);
                                                    setImagePreview(null);
                                                }}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer block">
                                            <div className="flex flex-col items-center justify-center py-4">
                                                <div className="p-3 bg-gray-100 rounded-full mb-3">
                                                    <ImageIcon className="w-6 h-6 text-gray-500" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">Click to upload</span>
                                                <span className="text-xs text-gray-500 mt-1">SVG, PNG, JPG or GIF</span>
                                            </div>
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
                        </div>

                    </div>
                </form>
            </main>

            {/* Footer */}
            <footer className="mt-auto border-t border-gray-200 p-4 bg-white">
                <div className="text-center text-sm text-gray-500 py-3">
                    © 2025 Voyagestics Admin Dashboard • Version 1.0
                </div>
            </footer>
        </div>
    );
}
