import { Outlet } from 'react-router-dom';
import AdminSidebar from '../sections/admin/AdminSidebar';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation - Fixed */}
      <AdminSidebar />

      {/* Dynamic Content Area */}
      <main className="flex-1 ml-64 transition-all duration-300 flex flex-col gap-8">
        <div className="flex-1 p-8">
          <Outlet />
        </div>

        {/* Footer - Sticky at Bottom */}
        <footer className="mt-auto border-t border-gray-200 p-4 bg-white">
          <div className="text-center text-sm text-gray-500 py-3">
            © 2025 Voyagestics Admin Dashboard • Version 1.0
          </div>
        </footer>
      </main>
    </div>
  );
}
