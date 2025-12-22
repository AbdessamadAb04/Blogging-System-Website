import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Menu, X, User, LogOut } from 'lucide-react';
import CTAButton from '../components/CTAButton';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut, loading } = useAuth();
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsProfileMenuOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="flex items-center h-20 relative">
          {/* left: brand */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <Compass className="w-8 h-8 text-[#0077B6]" />
            <span className="text-[22px] font-bold text-[#333333]">Voyagestics</span>
          </div>

          {/* center: navbar links */}
          <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center gap-12">
            {isAuthenticated && user?.role === 'Admin' && (
              <span
                onClick={() => navigate('/admin/overview')}
                className="text-[16px] font-medium text-[#333333] hover:text-[#0077B6] transition-colors cursor-pointer"
              >
                Admin Dashboard
              </span>
            )}
            <a href="#latest" className="text-[16px] font-medium text-[#333333] hover:text-[#0077B6] transition-colors">
              Latest Posts
            </a>
            <a href="#recommendations" className="text-[16px] font-medium text-[#333333] hover:text-[#0077B6] transition-colors">
              Recommendations
            </a>
            <a href="#categories" className="text-[16px] font-medium text-[#333333] hover:text-[#0077B6] transition-colors">
              Categories
            </a>
          </div>

          {/* right: CTA (visible md+) and mobile toggle (visible on small screens) */}
          <div className="ml-auto flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              {loading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
              ) : isAuthenticated ? (
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="profile-button flex items-center gap-2 p-1 hover:bg-gray-100 rounded-full transition-colors group"
                  >
                    <div className="w-12 h-12 bg-transparent border-2 border-[#333333] rounded-full flex items-center justify-center transition-all group-hover:border-[#0077B6]">
                      <User className="w-7 h-7 text-[#333333] group-hover:text-[#0077B6] transition-colors" />
                    </div>
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-transparent border-2 border-[#333333] rounded-full flex items-center justify-center">
                            <User className="w-7 h-7 text-[#333333]" />
                          </div>
                          <div>
                            <p className="font-medium text-[#333333]">User</p>
                            <p className="text-sm text-gray-500">{user?.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        <div className="w-full">
                          <button
                            onClick={handleSignOut}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <CTAButton size="small" onClick={() => navigate('/signin')}>Login</CTAButton>
                  <CTAButton size="small" variant="light" onClick={() => navigate('/signup')}>Sign up</CTAButton>
                </>
              )}
            </div>

            <button
              className="md:hidden text-[#333333]"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col gap-4">
              {isAuthenticated && user?.role === 'Admin' && (
                <span
                  onClick={() => {
                    navigate('/admin/overview');
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-[16px] font-medium text-[#333333] hover:text-[#0077B6] transition-colors text-left cursor-pointer"
                >
                  Admin Dashboard
                </span>
              )}
              <a href="#hero" className="text-[16px] font-medium text-[#333333]">
                Home
              </a>
              <a href="#latest" className="text-[16px] font-medium text-[#333333]">
                Latest Posts
              </a>
              <a href="#recommendations" className="text-[16px] font-medium text-[#333333] hover:text-[#0077B6] transition-colors">
                Recommendations
              </a>
              <a href="#categories" className="text-[16px] font-medium text-[#333333]">
                Categories
              </a>
              <a href="#about" className="text-[16px] font-medium text-[#333333]">
                About Us
              </a>
              <a href="#contact" className="text-[16px] font-medium text-[#333333]">
                Contact
              </a>
              <div className="flex flex-col gap-2">
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-full rounded"></div>
                ) : isAuthenticated ? (
                  <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#0077B6] rounded-full flex items-center justify-center border-0">
                        <User className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-[#333333]">User</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors rounded"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <>
                    <CTAButton size="small" onClick={() => navigate('/signin')}>Login</CTAButton>
                    <CTAButton size="small" variant="light" onClick={() => navigate('/signup')}>Sign up</CTAButton>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

