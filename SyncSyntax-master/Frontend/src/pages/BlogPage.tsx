import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUp, User, Calendar, Tag, MessageCircle, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import Navbar from '../sections/Navbar';
import Footer from '../sections/Footer';
import Newsletter from '../sections/Newsletter';
import FAQ from '../components/FAQ';
import Headings from '../components/Headings';
import BlogPost from '../components/BlogPost';
import CTAButton from '../components/CTAButton';
import LikeButton from '../components/LikeButton';
import AuthPromptModal from '../components/AuthPromptModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { useAuth } from '../contexts/AuthContext';
import { NO_IMAGE_PLACEHOLDER } from '../utils/constants';

interface Comment {
  id: number;
  userName: string;
  userId: string;
  content: string;
  commentDate: string;
  avatar?: string;
}

export default function BlogPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [blogData, setBlogData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentLimit, setCommentLimit] = useState(3);
  const [newComment, setNewComment] = useState({ content: '' });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);


  // Function to create slug from title
  const createSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Function to handle navigation to related posts
  const handleRelatedPostClick = (post: any) => {
    const slug = createSlug(post.title);
    navigate(`/blog/${slug}`, { state: { id: post.id } });
  };

  // Function to fetch related posts from the same category
  const fetchRelatedPosts = async (categoryId: number, currentPostId: number) => {
    try {
      setLoadingRelated(true);
      const apiBase = import.meta.env.VITE_API_BASE || '';
      const response = await fetch(`${apiBase}/api/postsapi`);

      if (response.ok) {
        const allPosts = await response.json();
        // Filter by categoryId, exclude current post, and limit to 3 posts
        const posts = allPosts.filter((post: any) => {
          const postCategoryId = post.categoryId || post.CategoryId || post.category?.id;
          return postCategoryId === categoryId;
        });
        const filteredPosts = posts
          .filter((post: any) => post.id !== currentPostId)
          .slice(0, 3)
          .map((p: any) => ({
            id: p.id,
            thumbnail: p.featureImageUrl ? (p.featureImageUrl.startsWith("/") ? apiBase + p.featureImageUrl : p.featureImageUrl) : NO_IMAGE_PLACEHOLDER,
            title: p.title,
            date: new Date(p.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            subtitle: p.subtitle || '',
            category: p.category?.name || 'Uncategorized',
            author: p.author || 'Staff',
          }));

        setRelatedPosts(filteredPosts);
      }
    } catch (error) {
      console.error('Error fetching related posts:', error);
    } finally {
      setLoadingRelated(false);
    }
  };

  // Fetch blog post data when component mounts or slug changes
  useEffect(() => {
    const fetchBlogData = async () => {
      if (!slug) {
        // No slug provided - show error
        setBlogData(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const apiBase = import.meta.env.VITE_API_BASE || '';

        // Try to get ID from navigation state first (when coming from a BlogPost component)
        const postId = location.state?.id;
        let foundPost = null;

        let postIdToFetch = postId;

        if (!postIdToFetch) {
          // We need to find the post ID by slug first
          const allPostsResponse = await fetch(`${apiBase}/api/postsapi`);
          if (allPostsResponse.ok) {
            const allPosts = await allPostsResponse.json();
            const matchedPost = allPosts.find((post: any) => {
              const postSlug = post.title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
              return postSlug === slug;
            });
            postIdToFetch = matchedPost?.id;
          }
        }

        // Now fetch the full post with content using the ID
        if (postIdToFetch) {
          const postResponse = await fetch(`${apiBase}/api/postsapi/${postIdToFetch}`);
          if (postResponse.ok) {
            foundPost = await postResponse.json();
          }
        }

        if (foundPost) {
          // Transform the found post data
          setBlogData({
            id: foundPost.id,
            title: foundPost.title,
            content: foundPost.content || foundPost.Content || 'No content available.',
            subtitle: foundPost.subtitle || '',
            date: new Date(foundPost.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            category: foundPost.category?.name || 'Uncategorized',
            categoryId: foundPost.category?.id,
            author: foundPost.author || 'Unknown Author',
            authorBio: 'Travel writer and photographer with a passion for exploring new destinations.',
            authorImage: NO_IMAGE_PLACEHOLDER,
            featuredImage: foundPost.featureImageUrl ? (foundPost.featureImageUrl.startsWith("/") ? apiBase + foundPost.featureImageUrl : foundPost.featureImageUrl) : NO_IMAGE_PLACEHOLDER,
            readTime: Math.ceil((foundPost.content?.length || foundPost.subtitle?.length || 1000) / 200) + ' min read'
          });

          // Fetch related posts if we have a category
          if (foundPost.category?.id) {
            fetchRelatedPosts(foundPost.category.id, foundPost.id);
          }
        } else {
          // No post found
          setBlogData(null);
        }
      } catch (error) {
        console.error('Error fetching blog post:', error);
        setBlogData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogData();
  }, [slug, location.state]);

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      if (!blogData?.id) return;
      try {
        const apiBase = import.meta.env.VITE_API_BASE || '';
        const response = await fetch(`${apiBase}/api/comments/${blogData.id}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setComments(data);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };

    fetchComments();
  }, [blogData?.id]);

  // Handle scroll for back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle carousel navigation for related posts
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? Math.max(0, relatedPosts.length - 3) : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= Math.max(0, relatedPosts.length - 3) ? 0 : prev + 1));
  };

  const visiblePosts = relatedPosts.slice(currentIndex, currentIndex + 3);

  // Handle comment submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (newComment.content.trim() && !isSubmittingComment) {
      try {
        setIsSubmittingComment(true);
        const apiBase = import.meta.env.VITE_API_BASE || '';

        const response = await fetch(`${apiBase}/api/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            postId: blogData.id,
            content: newComment.content
          })
        });

        if (response.ok) {
          const addedComment = await response.json();
          setComments([addedComment, ...comments]);
          setNewComment({ content: '' });
        }
      } catch (error) {
        console.error('Error posting comment:', error);
      } finally {
        setIsSubmittingComment(false);
      }
    }
  };

  const handleCommentDelete = async (commentId: number) => {
    setCommentToDelete(commentId);
    setShowDeleteModal(true);
  };

  const confirmDeleteComment = async () => {
    if (commentToDelete === null) return;

    try {
      const apiBase = import.meta.env.VITE_API_BASE || '';

      const response = await fetch(`${apiBase}/api/comments/${commentToDelete}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setComments(comments.filter(c => c.id !== commentToDelete));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setCommentToDelete(null);
    }
  };

  const handleViewMoreComments = () => {
    setCommentLimit(prev => prev * 2);
  };

  const handleViewLessComments = () => {
    setCommentLimit(prev => Math.max(3, Math.floor(prev / 2)));
  };

  return (
    <>
      <Navbar />

      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0077B6] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading blog post...</p>
          </div>
        </div>
      ) : !blogData ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Post Not Found</h1>
            <p className="text-gray-600">The blog post you're looking for could not be found.</p>
          </div>
        </div>
      ) : (
        <>

          {/* Hero Section */}
          <section id="hero" className="pt-28 pb-12">
            <div className="max-w-7xl mx-auto px-8 lg:px-12">
              <div className="flex-1 max-w-none lg:max-w-3xl pl-4 lg:pl-8">
                <div className="text-left mb-8 ml-4 lg:ml-8">
                  <h1 className="text-[48px] font-bold text-[#333333] leading-tight mb-4">
                    {blogData.title}
                  </h1>
                  <p className="text-[18px] text-gray-600 mb-6 leading-relaxed">
                    {blogData.subtitle}
                  </p>

                  <div className="flex flex-wrap items-center gap-6 text-[16px] text-gray-500">
                    <div className="flex items-center gap-2">
                      <Tag size={18} className="text-[#0077B6]" />
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                        {blogData.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={18} className="text-[#0077B6]" />
                      <span>By {blogData.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-[#0077B6]" />
                      <span>{blogData.date}</span>
                    </div>
                    <span>{blogData.readTime}</span>
                  </div>
                </div>

                {/* Featured Image */}
                <div className="aspect-video rounded-lg overflow-hidden shadow-lg ml-4 lg:ml-8">
                  <img
                    src={blogData.featuredImage}
                    alt={blogData.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Horizontal line separator */}
          <div className="max-w-6xl mx-auto px-8 lg:px-12 mb-6">
            <hr className="border-t-2 border-gray-400" />
          </div>

          {/* Main Content Container */}
          <div className="max-w-7xl mx-auto px-8 lg:px-12 py-12 flex flex-col lg:flex-row gap-12">

            {/* Main Content */}
            <main className="flex-1 max-w-none lg:max-w-3xl text-left pl-4 lg:pl-8">

              {/* Blog Body */}
              <article className="prose prose-lg max-w-none ml-4 lg:ml-8">
                <div
                  className="blog-content text-[16px] leading-relaxed text-[#333333] text-left"
                  dangerouslySetInnerHTML={{ __html: blogData.content }}
                  style={{
                    lineHeight: '1.7'
                  }}
                />
              </article>

              {/* Like Section */}
              <div className="mt-12 ml-4 lg:ml-8">
                <LikeButton postId={blogData.id} />
              </div>

              {/* Comments Section */}
              <section id="comments" className="mt-16 bg-[#FAFAF8] rounded-lg p-8 -mx-4 lg:-mx-8">
                <Headings
                  upheading="Join the Discussion"
                  mainHeading="Leave a Comment"
                  highlightWords={['Comment']}
                  alignment="left"
                />

                {/* Comment Form */}
                <form onSubmit={handleCommentSubmit} className="mb-12 bg-white rounded-lg p-6 shadow-sm">
                  <textarea
                    placeholder="Share your thoughts..."
                    value={newComment.content}
                    onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077B6] focus:border-transparent outline-none mb-4"
                    required
                  />
                  <CTAButton type="submit" size="medium">
                    <div className="flex items-center">
                      <MessageCircle size={18} className="mr-2" />
                      <span>Post Comment</span>
                    </div>
                  </CTAButton>
                </form>

                {/* Existing Comments */}
                <div className="space-y-6">
                  {comments.length === 0 ? (
                    <div className="bg-white rounded-lg p-8 shadow-sm text-center">
                      <p className="text-gray-500 italic">
                        No comments posted on this Blog. Be the first one to share your opinion!
                      </p>
                    </div>
                  ) : (
                    <>
                      {comments.slice(0, commentLimit).map((comment) => (
                        <div key={comment.id} className="bg-white rounded-lg p-6 shadow-sm group">
                          <div className="flex items-start gap-4">
                            {comment.avatar ? (
                              <img
                                src={comment.avatar}
                                alt={comment.userName}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                <User size={24} />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <h4 className="font-semibold text-[#333333]">{comment.userName}</h4>
                                  <span className="text-[14px] text-gray-500">{comment.commentDate}</span>
                                </div>
                                {(user?.id === comment.userId || user?.role === 'Admin') && (
                                  <button
                                    onClick={() => handleCommentDelete(comment.id)}
                                    className="text-gray-400 hover:text-red-500 transition-all duration-200 bg-transparent border-none cursor-pointer"
                                    title="Delete comment"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                              <p className="text-[16px] text-gray-700 leading-relaxed">{comment.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {(comments.length > commentLimit || commentLimit > 3) && (
                        <div className="flex items-center justify-center gap-6 mt-8">
                          {comments.length > commentLimit && (
                            <button
                              onClick={handleViewMoreComments}
                              className="text-[#0077B6] font-bold text-[15px] hover:text-[#005f8f] transition-all duration-200 cursor-pointer bg-transparent border-none p-0"
                            >
                              View more
                            </button>
                          )}
                          {commentLimit > 3 && (
                            <button
                              onClick={handleViewLessComments}
                              className="text-gray-500 font-bold text-[15px] hover:text-gray-700 transition-all duration-200 cursor-pointer bg-transparent border-none p-0"
                            >
                              View less
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </section>
            </main>

            {/* Sidebar (Desktop Only) */}
            <aside className="hidden lg:block lg:w-80">

              {/* Author Bio */}
              <div className="bg-[#FAFAF8] rounded-lg p-6 mb-8">
                <h3 className="text-[18px] font-semibold text-[#333333] mb-4">About the Author</h3>
                <div className="flex items-start gap-4">
                  <img
                    src={blogData.authorImage}
                    alt={blogData.author}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-medium text-[#333333] mb-2">{blogData.author}</h4>
                    <p className="text-[14px] text-gray-600 leading-relaxed">{blogData.authorBio}</p>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
                <h3 className="text-[18px] font-semibold text-[#333333] mb-4">Categories</h3>
                <ul className="space-y-2">
                  {['Adventure', 'Food & Culture', 'Nature', 'Beach', 'Wildlife'].map((category) => (
                    <li key={category}>
                      <a
                        href="#"
                        className="text-[#0077B6] hover:text-[#005f8f] transition-colors"
                      >
                        {category}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Related Posts */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-[18px] font-semibold text-[#333333] mb-4">You Might Also Like</h3>
                <div className="space-y-4">
                  {loadingRelated ? (
                    // Loading skeleton
                    Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="flex gap-3 animate-pulse">
                        <div className="w-16 h-16 bg-gray-200 rounded"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        </div>
                      </div>
                    ))
                  ) : relatedPosts.length > 0 ? (
                    relatedPosts.slice(0, 3).map((post: any, index: number) => (
                      <div
                        key={index}
                        className="flex gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200"
                        onClick={() => handleRelatedPostClick(post)}
                      >
                        <img
                          src={post.thumbnail}
                          alt={post.title}
                          className="w-16 h-16 rounded object-cover hover:scale-105 transition-transform duration-200"
                        />
                        <div className="flex-1">
                          <h4 className="text-[14px] font-medium text-[#333333] line-clamp-2 mb-1 hover:text-[#0077B6] transition-colors">
                            {post.title}
                          </h4>
                          <span className="text-[12px] text-gray-500">{post.date}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No related posts found</p>
                  )}
                </div>
              </div>
            </aside>
          </div>

          {/* Related Posts Section */}
          <section id="related-posts" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <Headings
                upheading="More Adventures"
                mainHeading="Related Posts"
                highlightWords={['Related']}
                subheading="Discover more amazing travel destinations and experiences"
              />
            </div>

            <div className="w-full">
              <div className="max-w-[1328px] mx-auto relative px-6 lg:px-8">
                {loadingRelated ? (
                  // Loading skeleton
                  <div className="flex justify-center">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-7 max-w-fit">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="bg-white rounded-lg overflow-hidden shadow-md w-[340px] sm:w-[380px] md:w-[420px] h-[580px] md:h-[730px] animate-pulse">
                          <div className="aspect-square bg-gray-300"></div>
                          <div className="p-6">
                            <div className="h-8 bg-gray-300 rounded mb-3"></div>
                            <div className="h-4 bg-gray-300 rounded mb-3"></div>
                            <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
                            <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : relatedPosts.length > 0 ? (
                  <>
                    {relatedPosts.length > 3 && (
                      <button
                        onClick={handlePrev}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-20 z-10 w-16 h-14 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-[#E7F4F7] transition-colors overflow-visible border-2 border-transparent focus:outline-none focus-visible:outline-none active:border-black focus:border-black focus-visible:border-black"
                        aria-label="Previous"
                        style={{ boxShadow: '0 -4px 12px rgba(0,0,0,0.06), 0 6px 12px rgba(0,0,0,0.06)' }}
                      >
                        <span style={{ display: 'inline-block', transform: 'scale(1.3)', lineHeight: 0 }}>
                          <ChevronLeft size={24} className="text-[#0077B6]" />
                        </span>
                      </button>
                    )}

                    <div className="flex justify-center">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-7 max-w-fit">
                        {visiblePosts.map((post: any, index: number) => (
                          <BlogPost key={currentIndex + index} {...post} />
                        ))}
                      </div>
                    </div>

                    {relatedPosts.length > 3 && (
                      <button
                        onClick={handleNext}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-20 z-10 w-16 h-14 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-[#E7F4F7] transition-colors overflow-visible border-2 border-transparent focus:outline-none focus-visible:outline-none active:border-black focus:border-black focus-visible:border-black"
                        aria-label="Next"
                        style={{ boxShadow: '0 -4px 12px rgba(0,0,0,0.06), 0 6px 12px rgba(0,0,0,0.06)' }}
                      >
                        <span style={{ display: 'inline-block', transform: 'scale(1.3)', lineHeight: 0 }}>
                          <ChevronRight size={24} className="text-[#0077B6]" />
                        </span>
                      </button>
                    )}
                  </>
                ) : (
                  // Empty state
                  <div className="flex justify-center py-12">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Related Posts</h3>
                      <p className="text-gray-600">We couldn't find any posts in the same category.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <Newsletter />

          <FAQ />

          <Footer />

          {/* Back to Top Button */}
          {showBackToTop && (
            <button
              onClick={scrollToTop}
              className="fixed bottom-8 right-8 w-12 h-12 bg-[#0077B6] text-white rounded-full shadow-lg hover:bg-[#005f8f] transition-all duration-300 flex items-center justify-center z-50"
              aria-label="Back to top"
            >
              <ArrowUp size={20} />
            </button>
          )}

          <AuthPromptModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            action="comment"
            returnUrl={window.location.pathname}
          />

          <DeleteConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={confirmDeleteComment}
            itemName="this comment"
          />

          {/* Custom Styles for Blog Content */}
          <style dangerouslySetInnerHTML={{
            __html: `
        .blog-content h2 {
          font-size: 28px;
          font-weight: 600;
          color: #333333;
          margin: 32px 0 16px 0;
          line-height: 1.3;
        }
        
        .blog-content h3 {
          font-size: 22px;
          font-weight: 600;
          color: #333333;
          margin: 24px 0 12px 0;
        }
        
        .blog-content p {
          margin-bottom: 20px;
          color: #333333;
        }
        
        .blog-content code {
          display: block;
          background-color: #E7F4F7;
          border: 1px solid #B8D4E3;
          padding: 16px;
          border-radius: 8px;
          margin: 24px 0;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          color: #0077B6;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        `
          }} />
        </>
      )}
    </>
  );
}
