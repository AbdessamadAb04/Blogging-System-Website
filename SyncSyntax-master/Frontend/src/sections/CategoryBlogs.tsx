import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Headings from '../components/Headings';
import BlogPost from '../components/BlogPost';
import type { Post } from '../types/models';
import { NO_IMAGE_PLACEHOLDER } from '../utils/constants';

interface Category {
  id: number;
  name: string;
}

export default function CategoryBlogs() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [currentPosts, setCurrentPosts] = useState<Post[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const apiBase = import.meta.env.VITE_API_BASE || '';

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${apiBase}/api/postsapi/categories`);
        if (response.ok) {
          const categoriesData = await response.json();
          setCategories(categoriesData);
          if (categoriesData.length > 0) {
            setSelectedCategory(categoriesData[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [apiBase]);

  // Fetch posts for selected category
  useEffect(() => {
    if (!selectedCategory) return;

    const fetchPosts = async () => {
      setLoadingPosts(true);
      try {
        const response = await fetch(`${apiBase}/api/postsapi`);
        if (response.ok) {
          const allPosts = await response.json();
          // Filter posts by categoryId
          const filteredPosts = allPosts.filter((post: Post) => {
            const postCategoryId = (post as any).categoryId || (post as any).CategoryId || (post.category as any)?.id;
            return postCategoryId === selectedCategory.id;
          });
          setCurrentPosts(filteredPosts);
          setCurrentIndex(0); // Reset to first page when category changes
        }
      } catch (error) {
        console.error('Error fetching posts for category:', error);
        setCurrentPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchPosts();
  }, [selectedCategory, apiBase]);

  // Map API posts to BlogPost component props
  const mappedPosts = currentPosts.map((p) => ({
    id: p.id,
    thumbnail: p.featureImageUrl ? (p.featureImageUrl.startsWith("/") ? apiBase + p.featureImageUrl : p.featureImageUrl) : NO_IMAGE_PLACEHOLDER,
    title: p.title,
    date: new Date(p.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    subtitle: p.subtitle || '',
    category: p.category?.name || 'Uncategorized',
    author: p.author || 'Staff',
  }));

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? Math.max(0, mappedPosts.length - 3) : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= Math.max(0, mappedPosts.length - 3) ? 0 : prev + 1));
  };

  const visibleBlogs = mappedPosts.slice(currentIndex, currentIndex + 3);

  const handleCategoryChange = (category: Category) => {
    setSelectedCategory(category);
    setCurrentIndex(0);
  };

  // Show loading state while fetching categories
  if (loading) {
    return (
      <section id="categories" className="py-20 bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Headings
            upheading="Browse By Topic"
            mainHeading="Explore Travel Categories"
            highlightWords={['Categories']}
            subheading="Find stories that match your travel interests"
          />
        </div>
        <div className="flex justify-center py-8">
          <div className="animate-pulse text-gray-500">Loading categories...</div>
        </div>
      </section>
    );
  }

  // Show empty state if no categories
  if (categories.length === 0) {
    return (
      <section id="categories" className="py-20 bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Headings
            upheading="Browse By Topic"
            mainHeading="Explore Travel Categories"
            highlightWords={['Categories']}
            subheading="Find stories that match your travel interests"
          />
        </div>
        <div className="w-full">
          <div className="max-w-[1328px] mx-auto px-6 lg:px-8">
            <div className="flex justify-center py-20">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Posts Yet</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  We're working on bringing you amazing travel stories. Check back soon for fresh content!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="categories" className="py-20 bg-[#FAFAF8]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <Headings
          upheading="Browse By Topic"
          mainHeading="Explore Travel Categories"
          highlightWords={['Categories']}
          subheading="Find stories that match your travel interests"
        />
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-12">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryChange(category)}
            className={`px-6 py-3 rounded-full text-[16px] font-medium transition-colors ${selectedCategory?.id === category.id
              ? 'bg-[#0077B6] text-white'
              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="w-full">
        {loadingPosts ? (
          <div className="max-w-[1328px] mx-auto px-6 lg:px-8">
            <div className="flex justify-center">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-7 max-w-fit">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-[340px] sm:w-[380px] md:w-[420px] h-[720px] sm:h-[580px] md:h-[730px] bg-gray-200 rounded-lg animate-pulse">
                    <div className="w-full h-[280px] bg-gray-300 rounded-t-lg"></div>
                    <div className="p-6 space-y-4">
                      <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-300 rounded"></div>
                        <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : mappedPosts.length === 0 ? (
          <div className="max-w-[1328px] mx-auto px-6 lg:px-8">
            <div className="flex justify-center py-20">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Posts Yet</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  No posts available in this category at the moment. Check back soon for fresh content!
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-[1328px] mx-auto relative px-6 lg:px-8">
            {mappedPosts.length > 3 && (
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
                {visibleBlogs.map((blog, index) => (
                  <BlogPost key={currentIndex + index} {...blog} />
                ))}
              </div>
            </div>

            {mappedPosts.length > 3 && (
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
          </div>
        )}
      </div>
    </section>
  );
}
