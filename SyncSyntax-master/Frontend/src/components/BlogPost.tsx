import { useNavigate } from 'react-router-dom';
import CTAButton from './CTAButton';

interface BlogPostProps {
  id?: string | number;
  thumbnail: string;
  title: string;
  date: string;
  subtitle: string;
  category: string;
  author: string;
  slug?: string;
}

export default function BlogPost({
  id,
  thumbnail,
  title,
  date,
  subtitle,
  category,
  author,
}: BlogPostProps) {
  const navigate = useNavigate();

  const createSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
  };

  const handleReadMore = () => {
    if (title) {
      const slug = createSlug(title);
      // Navigate to blog page using title slug, but pass the ID as state for data fetching
      navigate(`/blog/${slug}`, { state: { id } });
    }
  };
  return (
  // Fixed heights chosen to keep cards visually consistent across breakpoints.
  // - small: h-[520px]
  // - sm: h-[560px]
  // - md+: h-[620px]
  // outer container keeps overflow-hidden so content never increases height visually.
  // Increased fixed heights substantially per request. Cards will be much taller.
  // New heights:
  // - base:  h-[720px]
  // - sm:    h-[780px]
  // - md+:   h-[860px]
  <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col w-[340px] sm:w-[380px] md:w-[420px] h-[720px] sm:h-[580px] md:h-[730px]">
      <div className="aspect-square overflow-hidden">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>

  <div className="p-6 flex flex-col flex-1">
        <div className="mb-4">
          <h3 className="text-[28px] font-semibold text-[#333333] mb-2 line-clamp-2">
            {title}
          </h3>
          <p className="text-[14px] text-gray-500 mb-3">{date}</p>
          <p className="text-[16px] text-[#333333] mb-3 line-clamp-3">
            {subtitle}
          </p>
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-[14px] font-medium rounded-full">
            {category}
          </span>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <CTAButton size="small" onClick={handleReadMore}>Read Blog</CTAButton>
          <p className="text-[14px] text-gray-600 italic">by {author}</p>
        </div>
      </div>
    </div>
  );
}
