import React from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar'
import ContactCTA from "./components/ContactCTA/ContactCTA";
import Footer from "./components/Footer/Footer";
import BlogList from './pages/Blog/BlogList';
import BlogDetail from './pages/Blog/BlogDetail';
import CategoryBlogList from './pages/Blog/CategoryBlogList';
import ProjectList from './pages/Project/ProjectList';
import ProjectDetail from './pages/Project/ProjectDetail';
import PortfolioList from './pages/Portfolio/PortfolioList';
import PortfolioDetail from './pages/Portfolio/PortfolioDetail';
import ServiceDetail from './pages/Service/ServiceDetail';
import ServiceList from './pages/Service/ServiceList';
import PhotoGalleryPublic from './pages/Gallery/PhotoGalleryPublic';
import HandoverSnapshotPublic from './pages/Gallery/HandoverSnapshotPublic';
// Admin Components
import AdminLayout from './pages/Admin/AdminLayout';
import Dashboard from './pages/Admin/Dashboard';
import BlogManager from './pages/Admin/BlogManager';
import BlogEditor from './pages/Admin/BlogEditor';
import BlogCategoryManager from './pages/Admin/BlogCategoryManager';
import CommentManager from './pages/Admin/CommentManager';
import Login from './pages/Admin/Login';
import Profile from './pages/Admin/Profile';
import SettingsManager from './pages/Admin/SettingsManager';
import ProjectManager from './pages/Admin/ProjectManager';
import ProjectEditor from './pages/Admin/ProjectEditor';
import ProjectCategoryManager from './pages/Admin/ProjectCategoryManager';
import PortfolioManager from './pages/Admin/PortfolioManager';
import PortfolioEditor from './pages/Admin/PortfolioEditor';
import PortfolioCategoryManager from './pages/Admin/PortfolioCategoryManager';
import CategoryManager from './pages/Admin/CategoryManager';
import ServiceManager from './pages/Admin/ServiceManager';
import ServiceEditor from './pages/Admin/ServiceEditor';
import ServiceCategoryManager from './pages/Admin/ServiceCategoryManager';
import PhotoGallery from './pages/Admin/PhotoGallery';
import VideoGallery from './pages/Admin/VideoGallery';
import HandoverSnapshot from './pages/Admin/HandoverSnapshot';
import AboutManager from './pages/Admin/AboutManager';

import '@fortawesome/fontawesome-free/css/all.min.css';

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.includes('/admin');

  return (
    <>
      {!isAdminRoute && <Navbar />}
      <main style={{ minHeight: '80vh' }}>
        <Routes>
          <Route path="/" element={<div>Home Page (Existing)</div>} />
          <Route path="/blogs" element={<BlogList />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="/blogs/category/:slug" element={<CategoryBlogList />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/projects/:slug" element={<ProjectDetail />} />
          <Route path="/portfolio" element={<PortfolioList />} />
          <Route path="/portfolio/:categorySlug" element={<PortfolioList />} />
          <Route path="/portfolio/:parentSlug/:categorySlug" element={<PortfolioList />} />
          <Route path="/portfolio/view/:slug" element={<PortfolioDetail />} />
          <Route path="/portfolio/:parentSlug/:categorySlug/:slug" element={<PortfolioDetail />} />
          <Route path="/service-detail/:id" element={<ServiceDetail />} />
          <Route path="/services" element={<ServiceList />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/photo-gallery" element={<PhotoGalleryPublic />} />
          <Route path="/handover-snapshot" element={<HandoverSnapshotPublic />} />
          
          {/* Default catch-all for dynamic root categories */}
          <Route path="/:categorySlug" element={<ProjectList />} />

          {/* Admin Routes with Layout */}
          <Route path="/admin-login" element={<Login />} />
          <Route path="/admin/dashboard" element={<AdminLayout><Dashboard /></AdminLayout>} />
          <Route path="/admin/blogs" element={<AdminLayout><BlogManager /></AdminLayout>} />
          <Route path="/admin/blogs/new" element={<AdminLayout><BlogEditor /></AdminLayout>} />
          <Route path="/admin/blogs/edit/:id" element={<AdminLayout><BlogEditor /></AdminLayout>} />
          <Route path="/admin/blog-categories" element={<AdminLayout><BlogCategoryManager /></AdminLayout>} />
          <Route path="/admin/comments" element={<AdminLayout><CommentManager /></AdminLayout>} />
          <Route path="/admin/projects" element={<AdminLayout><ProjectManager /></AdminLayout>} />
          <Route path="/admin/projects/new" element={<AdminLayout><ProjectEditor /></AdminLayout>} />
          <Route path="/admin/projects/edit/:slug" element={<AdminLayout><ProjectEditor /></AdminLayout>} />
          <Route path="/admin/project-categories" element={<AdminLayout><ProjectCategoryManager /></AdminLayout>} />
          <Route path="/admin/portfolios" element={<AdminLayout><PortfolioManager /></AdminLayout>} />
          <Route path="/admin/portfolios/new" element={<AdminLayout><PortfolioEditor /></AdminLayout>} />
          <Route path="/admin/portfolios/edit/:id" element={<AdminLayout><PortfolioEditor /></AdminLayout>} />
          <Route path="/admin/portfolio-categories" element={<AdminLayout><PortfolioCategoryManager /></AdminLayout>} />
          <Route path="/admin/categories" element={<AdminLayout><CategoryManager /></AdminLayout>} />
          <Route path="/admin/services" element={<AdminLayout><ServiceManager /></AdminLayout>} />
          <Route path="/admin/services/new" element={<AdminLayout><ServiceEditor /></AdminLayout>} />
          <Route path="/admin/services/edit/:id" element={<AdminLayout><ServiceEditor /></AdminLayout>} />
          <Route path="/admin/service-categories" element={<AdminLayout><ServiceCategoryManager /></AdminLayout>} />
          <Route path="/admin/gallery/photos" element={<AdminLayout><PhotoGallery /></AdminLayout>} />
          <Route path="/admin/gallery/videos" element={<AdminLayout><VideoGallery /></AdminLayout>} />
          <Route path="/admin/gallery/handover" element={<AdminLayout><HandoverSnapshot /></AdminLayout>} />
          <Route path="/admin/about" element={<AdminLayout><AboutManager /></AdminLayout>} />
          <Route path="/admin/profile" element={<AdminLayout><Profile /></AdminLayout>} />
          <Route path="/admin/settings" element={<AdminLayout><SettingsManager /></AdminLayout>} />
        </Routes>
      </main>
      {!isAdminRoute && <ContactCTA />}
      {!isAdminRoute && <Footer />}
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
