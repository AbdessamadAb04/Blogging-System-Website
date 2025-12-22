import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import BlogPage from './pages/BlogPage'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import AdminDashboard from './pages/AdminDashboard'
import CreateBlogPost from './pages/admin/CreateBlogPost'
import DashboardOverview from './pages/admin/DashboardOverview'
import BlogsManagement from './pages/admin/BlogsManagement'
import CategoriesManagement from './pages/admin/CategoriesManagement'
import AuthorsManagement from './pages/admin/AuthorsManagement'
import UsersManagement from './pages/admin/UsersManagement'
import CreateCategory from './pages/admin/CreateCategory'
import CreateAuthor from './pages/admin/CreateAuthor'
import CreateUser from './pages/admin/CreateUser'
import CreateSubscriber from './pages/admin/CreateSubscriber'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog/:slug" element={<BlogPage />} />
        <Route path="/blogPost" element={<BlogPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Admin Routes - Secured */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="Admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<DashboardOverview />} />
          <Route path="blog-posts" element={<BlogsManagement />} />
          <Route path="categories" element={<CategoriesManagement />} />
          <Route path="authors" element={<AuthorsManagement />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="create-category" element={<CreateCategory />} />
          <Route path="create-author" element={<CreateAuthor />} />
          <Route path="create-user" element={<CreateUser />} />
          <Route path="create-subscriber" element={<CreateSubscriber />} />
        </Route>

        {/* Standalone Admin Pages - Secured */}
        <Route
          path="/admin/create-blog-post"
          element={
            <ProtectedRoute requiredRole="Admin">
              <CreateBlogPost />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}
