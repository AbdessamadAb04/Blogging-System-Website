import { X, Heart, MessageCircle, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'like' | 'comment';
  returnUrl?: string;
}

export default function AuthPromptModal({ isOpen, onClose, action, returnUrl }: AuthPromptModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSignIn = () => {
    navigate('/signin', { state: { returnUrl: returnUrl || window.location.pathname } });
    onClose();
  };

  const handleSignUp = () => {
    navigate('/signup', { state: { returnUrl: returnUrl || window.location.pathname } });
    onClose();
  };

  const actionText = action === 'like' ? 'like posts' : 'leave comments';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-[2px] animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-[#0077B6] to-[#00A8E8] p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-all duration-200"
            aria-label="Close"
          >
            <X size={24} />
          </button>
          
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl px-6 py-4 flex items-center gap-3">
              <Compass className="w-10 h-10 text-white" />
              <span className="text-2xl font-bold text-white">Voyagestics</span>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Join Our Community
          </h2>
          <p className="text-white text-opacity-90 text-center text-sm">
            Sign in to {actionText} and engage with our content
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 rounded-full p-2">
                <Heart size={24} className="text-red-500 fill-red-500" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Like Your Favorites</h3>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-full p-2">
                <MessageCircle size={24} className="text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Join Discussions</h3>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleSignIn}
              className="w-full bg-[#0077B6] text-white py-3 rounded-lg font-semibold hover:bg-[#005f8f] transition-colors duration-200"
            >
              Login to your account
            </button>
            
            <button
              onClick={handleSignUp}
              className="w-full bg-white text-[#0077B6] py-3 rounded-lg font-semibold border-2 border-[#0077B6] hover:bg-gray-50 transition-colors duration-200"
            >
              Signup new account
            </button>
          </div>

          <p className="text-center text-xs text-gray-500 mt-4">
            It only takes a minute to join our community
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
