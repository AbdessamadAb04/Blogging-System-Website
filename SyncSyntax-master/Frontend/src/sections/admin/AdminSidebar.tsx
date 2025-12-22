import { Compass, LayoutDashboard, FileText, FolderOpen, PenTool, Users, Home } from 'lucide-react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  relatedPaths?: string[];
}

const navigationItems: NavItem[] = [
  { path: '/admin/overview', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/blog-posts', label: 'Blog Posts', icon: FileText, relatedPaths: ['/admin/create-blog-post'] },
  { path: '/admin/categories', label: 'Categories', icon: FolderOpen, relatedPaths: ['/admin/create-category'] },
  { path: '/admin/authors', label: 'Authors', icon: PenTool, relatedPaths: ['/admin/create-author'] },
  { path: '/admin/users', label: 'Users', icon: Users, relatedPaths: ['/admin/create-user', '/admin/create-subscriber'] },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const handleReturnHome = () => {
    navigate('/');
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col">
      {/* Brand Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Compass className="w-8 h-8 text-[#0077B6]" />
          <div>
            <h1 className="text-xl font-bold text-[#333333]">Voyagestics</h1>
            <p className="text-xs text-gray-500">Admin Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => {
                    const isRelatedActive = item.relatedPaths?.some(path => location.pathname === path);
                    const activeState = isActive || isRelatedActive;

                    return `w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg focus:outline-none ${activeState
                        ? 'bg-blue-50 text-[#0077B6] border-l-4 border-[#0077B6] shadow-sm'
                        : 'bg-white text-black hover:bg-gray-100 hover:text-black shadow-sm border border-gray-200'
                      }`;
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button - Sticky at Bottom */}
      <div className="mt-auto p-4 border-t border-gray-100">
        <button
          onClick={handleReturnHome}
          className="w-full bg-[#0077B6] hover:bg-[#005f8f] text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 focus:outline-none"
        >
          <Home className="w-4 h-4" />
          Return to home
        </button>
      </div>
    </div>
  );
}