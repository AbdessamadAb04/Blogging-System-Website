import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, User, BookOpen, Users, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import StatusMessage from '../../components/StatusMessage';

interface Author {
  id: number;
  fullName: string;
  description: string;
  joinDate: string;
  avatarUrl?: string;
  blogCount: number;
}

interface BlogPost {
  id: number;
  title: string;
  publishedDate: string;
  status: 'Published' | 'Draft' | 'Archived';
  category?: { id: number; name: string } | null;
  readingTime: number;
}

interface AuthorWithBlogs extends Author {
  blogs: BlogPost[];
}

export default function AuthorsManagement() {
  const navigate = useNavigate();
  const [authors, setAuthors] = useState<AuthorWithBlogs[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedAuthor, setExpandedAuthor] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [authorToDelete, setAuthorToDelete] = useState<AuthorWithBlogs | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch authors and posts in parallel. Posts API includes category info reliably.
        const [authorsResp, postsResp] = await Promise.all([
          fetch('/api/authorsapi'),
          fetch('/api/postsapi')
        ]);
        if (!authorsResp.ok) throw new Error(`Authors API error: ${authorsResp.status}`);
        if (!postsResp.ok) throw new Error(`Posts API error: ${postsResp.status}`);
        const data = await authorsResp.json();
        const allPosts = await postsResp.json();
        // build index of posts by id to enrich authors' posts with category when missing
        const postsIndex: Record<number, any> = {};
        if (Array.isArray(allPosts)) {
          allPosts.forEach((pp: any) => { postsIndex[Number(pp.id)] = pp; });
        }

        if (!Array.isArray(data)) {
          throw new Error('Invalid authors payload');
        }

        // Debug sample of authors payload
        try { console.debug('Authors API payload (AuthorsManagement):', Array.isArray(data) ? data.slice(0, 6) : data); } catch (e) { console.debug('Authors payload debug failed', e); }

        const mapped: AuthorWithBlogs[] = data.map((a: any) => ({
          id: a.id,
          fullName: a.fullName || 'Unknown',
          description: a.description || '',
          joinDate: a.joinedAt || a.joinDate || '',
          avatarUrl: a.avatarUrl || undefined,
          blogCount: typeof a.postCount === 'number' ? a.postCount : (Array.isArray(a.posts) ? a.posts.length : 0),
          blogs: Array.isArray(a.posts)
            ? a.posts.map((p: any) => {
              // try to get category from the author-post entry, otherwise enrich from posts API
              let categoryObj = null;
              if (p.category && typeof p.category === 'object') categoryObj = { id: p.category.id, name: p.category.name };
              else if (typeof p.category === 'string') categoryObj = { id: null, name: p.category };
              else if (postsIndex && postsIndex[p.id] && postsIndex[p.id].category) categoryObj = postsIndex[p.id].category;

              return {
                id: p.id,
                title: p.title,
                publishedDate: p.publishedDate,
                status: p.status || 'Draft',
                readingTime: 0,
                category: categoryObj
              };
            })
            : []
        }));

        // Identify Staff Writer posts (those with no author matched in authors payload)
        const staffPosts = Array.isArray(allPosts)
          ? allPosts.filter((p: any) => p.author === 'Staff Writer' || !p.author)
          : [];

        if (staffPosts.length > 0) {
          const staffWriter: AuthorWithBlogs[] = [{
            id: -1, // Virtual ID
            fullName: 'Staff Writer',
            description: 'Default system author for posts with no assigned contributor.',
            joinDate: staffPosts.length > 0 ? staffPosts[staffPosts.length - 1].createdAt || new Date().toISOString() : new Date().toISOString(),
            blogCount: staffPosts.length,
            blogs: staffPosts.map((p: any) => ({
              id: p.id,
              title: p.title,
              publishedDate: p.createdAt,
              status: p.status || 'Published',
              readingTime: 0,
              category: p.category
            }))
          }];
          setAuthors([...mapped, ...staffWriter]);
        } else {
          setAuthors(mapped);
        }
      } catch (error) {
        console.error('Error fetching authors:', error);
        setAuthors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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

  // Handle author actions
  const handleEditAuthor = (authorId: number) => {
    navigate(`/admin/create-author?id=${authorId}`);
  };

  const handleDeleteAuthor = (author: AuthorWithBlogs) => {
    setAuthorToDelete(author);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (authorToDelete) {
      try {
        const response = await fetch(`/api/authorsapi/${authorToDelete.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setAuthors(prev => prev.filter(a => a.id !== authorToDelete.id));
          setStatus({ type: 'success', message: `Author "${authorToDelete.fullName}" deleted successfully.` });
          console.log('Deleted author:', authorToDelete.id);
        } else {
          console.error('Failed to delete author');
          setStatus({ type: 'error', message: 'Failed to delete author. It might be referenced by other records.' });
        }
      } catch (error) {
        console.error('Error deleting author:', error);
      } finally {
        setAuthorToDelete(null);
        setDeleteModalOpen(false);
      }
    }
  };


  const toggleAuthorExpansion = (authorId: number) => {
    setExpandedAuthor(expandedAuthor === authorId ? null : authorId);
  };

  // Filter and pagination logic
  const getFilteredData = () => {
    return authors.filter(author => {
      const matchesSearch = author.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        author.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  };

  const filteredData = getFilteredData();
  const getTotalPages = () => Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const getCategoryBadgeClasses = (_categoryName?: string | null) => {
    // Use a consistent blue badge for all category labels
    return 'bg-blue-100 text-blue-800';
  };

  // Defensive extractor for blog category name
  const getCategoryName = (blog: any) => {
    if (!blog) return 'Uncategorized';
    const c = blog.category;
    if (c && typeof c === 'object') {
      if (c.name) return String(c.name);
      if (c.title) return String(c.title);
    }
    if (typeof c === 'string' && c.trim()) return c;
    if (blog.categoryName) return String(blog.categoryName);
    if (blog.categoryTitle) return String(blog.categoryTitle);
    return 'Uncategorized';
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
        <h1 className="text-3xl font-bold text-[#333333]">Authors Management</h1>
        <p className="text-gray-600 mt-2">Manage blog authors and their published content</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Authors</p>
              <p className="text-2xl font-semibold text-[#333333]">{authors.length}</p>
            </div>
            <Users className="w-8 h-8 text-[#0077B6]" />
          </div>
        </div>

        <div className="bg-white shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Most Active Author</p>
              <p className="text-2xl font-semibold text-blue-600">
                {authors.length > 0
                  ? authors.reduce((prev, current) => (prev.blogCount > current.blogCount) ? prev : current).fullName
                  : 'N/A'
                }
              </p>
            </div>
            <User className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="relative" style={{ width: '900px' }}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search authors by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077B6] focus:border-[#0077B6] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Authors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {currentData.map((author) => (
          <div key={author.id}>
            <div className={`bg-white shadow-sm border border-gray-200 overflow-hidden ${author.id === -1 ? 'bg-gray-50 border-blue-200' : ''}`} style={{ height: '280px' }}>
              {/* Author Header */}
              <div className="p-6 border-b border-gray-200" style={{ height: 'calc(280px - 53px)' }}>
                <div className="flex items-start justify-between h-full">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 ${author.id === -1 ? 'bg-gray-400' : 'bg-gradient-to-br from-blue-500 to-purple-600'}`}>
                      {author.fullName === 'Staff Writer' ? 'SW' : author.fullName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-[#333333] mb-1">{author.fullName}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <span>{author.id === -1 ? 'System Assigned' : `ID: #${author.id}`}</span>
                        <span>Joined: {new Date(author.joinDate).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {author.blogCount} posts
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{author.description}</p>
                    </div>
                  </div>
                  {author.id !== -1 && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleEditAuthor(author.id)}
                        className="p-2.5 bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-[#0077B6] rounded-md transition-colors border-0 outline-0"
                        style={{ backgroundColor: '#f9fafb' }}
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAuthor(author)}
                        className="p-2.5 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-md transition-colors border-0 outline-0"
                        style={{ backgroundColor: '#f9fafb' }}
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Blog Posts Toggle Button - FIXED POSITION */}
              <button
                onClick={() => toggleAuthorExpansion(author.id)}
                className="w-full px-6 py-3 text-left flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none border-t border-gray-200 rounded-none"
                style={{ backgroundColor: '#f9fafb', height: '53px' }}
                aria-expanded={expandedAuthor === author.id}
              >
                <span className="text-sm font-medium text-gray-700">
                  Blog Posts ({author.blogs.length})
                </span>
                <div>
                  {expandedAuthor === author.id ? (
                    <ChevronUp className="w-4 h-4 text-gray-500 transition-transform duration-200" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500 transition-transform duration-200" />
                  )}
                </div>
              </button>
            </div>

            {/* Expanded Blog Posts - OUTSIDE THE CARD */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out bg-white ${expandedAuthor === author.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
              <div className="px-6 pb-5 bg-white border-l border-r border-b border-gray-200">
                <div className="pt-2 border-t border-gray-200">
                  <div className="mt-3 max-h-64 overflow-y-auto space-y-3" style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#cbd5e0 #f7fafc'
                  }}>
                    {author.blogs.map((blog) => (
                      <div key={blog.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors rounded-none">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm mb-1">{blog.title}</h4>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{new Date(blog.publishedDate).toLocaleDateString()}</span>
                            <span>{blog.readingTime} min read</span>
                          </div>
                        </div>
                        {
                          (() => {
                            const catName = getCategoryName(blog);
                            return (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadgeClasses(catName)}`}>
                                {catName}
                              </span>
                            );
                          })()
                        }
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-12 bg-white shadow-sm border border-gray-200">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No authors found matching your search criteria</p>
        </div>
      )}

      {/* Pagination */}
      {filteredData.length > 0 && (
        <div className="flex items-center justify-between bg-white px-6 py-3 border border-gray-200">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, filteredData.length)}</span> of{' '}
            <span className="font-medium">{filteredData.length}</span> results
          </div>
          {getTotalPages() > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousPage}
                className={`p-2 text-sm transition-colors flex items-center justify-center ${currentPage <= 1
                  ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                style={{ backgroundColor: currentPage <= 1 ? '#f9fafb' : '#f3f4f6' }}
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageClick(page)}
                  className={`px-3 py-1 text-sm transition-colors ${currentPage === page
                    ? 'bg-[#0077B6] text-white hover:bg-[#005f8f]'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  style={{ backgroundColor: currentPage === page ? '#0077B6' : '#f3f4f6' }}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={handleNextPage}
                className={`p-2 text-sm transition-colors flex items-center justify-center ${currentPage >= getTotalPages()
                  ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                style={{ backgroundColor: currentPage >= getTotalPages() ? '#f9fafb' : '#f3f4f6' }}
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
          onClick={() => navigate('/admin/create-author')}
          className="bg-[#0077B6] text-white px-4 py-2 hover:bg-[#005f8f] flex items-center gap-2 focus:outline-none"
          style={{ backgroundColor: '#0077B6' }}
        >
          <Plus className="w-5 h-5" />
          Add New Author
        </button>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        itemName={authorToDelete ? `author "${authorToDelete.fullName}"` : 'this author'}
      />
    </div>
  );
}