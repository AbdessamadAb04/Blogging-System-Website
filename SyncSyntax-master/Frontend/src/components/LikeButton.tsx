import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import AuthPromptModal from './AuthPromptModal';
import { useAuth } from '../contexts/AuthContext';

interface LikeButtonProps {
  postId: number;
  initialLikeCount?: number;
}

export default function LikeButton({ postId, initialLikeCount = 0 }: LikeButtonProps) {
  const { isAuthenticated, user } = useAuth();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const apiBase = import.meta.env.VITE_API_BASE || '';

  const userId = user?.id;

  // Fetch initial like count and check if user has liked
  useEffect(() => {
    if (!postId) return;

    const fetchLikeData = async () => {
      try {
        // Fetch like count
        const countResponse = await fetch(`${apiBase}/api/likes/${postId}/count`, {
          credentials: 'include'
        });
        if (countResponse.ok) {
          const countData = await countResponse.json();
          setLikeCount(countData.likeCount);
        }

        // Check if authenticated user has liked
        if (isAuthenticated && userId) {
          const userLikeResponse = await fetch(`${apiBase}/api/likes/${postId}/user/${userId}`, {
            credentials: 'include'
          });
          if (userLikeResponse.ok) {
            const userData = await userLikeResponse.json();
            setHasLiked(userData.hasLiked);
          }
        }
      } catch (error) {
        console.error('Error fetching like data:', error);
      }
    };

    fetchLikeData();
  }, [postId, userId, apiBase, isAuthenticated]);

  const handleLike = async () => {
    if (isLoading) return;

    // Check if user is authenticated
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (!userId) return;

    setIsLoading(true);

    try {
      if (hasLiked) {
        // Unlike
        const response = await fetch(`${apiBase}/api/likes`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ postId, userId }),
        });

        if (response.ok) {
          const data = await response.json();
          setLikeCount(data.likeCount);
          setHasLiked(false);
        }
      } else {
        // Like
        const response = await fetch(`${apiBase}/api/likes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ postId, userId }),
        });

        if (response.ok) {
          const data = await response.json();
          setLikeCount(data.likeCount);
          setHasLiked(true);
        } else if (response.status === 400) {
          // User already liked this post
          setHasLiked(true);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleLike}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${hasLiked
          ? 'bg-red-50 text-red-600 border-2 border-red-600'
          : 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:bg-gray-200'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        aria-label={hasLiked ? 'Unlike this post' : 'Like this post'}
      >
        <Heart
          size={20}
          className={`transition-all duration-200 ${hasLiked ? 'fill-red-600 scale-110' : ''
            }`}
        />
        <span className="font-medium text-[16px]">
          {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
        </span>
      </button>

      <AuthPromptModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        action="like"
        returnUrl={window.location.pathname}
      />
    </>
  );
}
