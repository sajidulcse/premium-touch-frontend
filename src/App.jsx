import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'

// Scroll to Top on route change helper
const ScrollToTop = () => {
  const { pathname } = useLocation();
  const prevPathname = React.useRef(pathname);

  useEffect(() => {
    const isAboutUsChange = pathname.startsWith('/about-us') && prevPathname.current.startsWith('/about-us');
    
    // Check if we are filtering within the same portfolio subcategory (e.g., /portfolio/residence -> /portfolio/residence/bedroom)
    const pathSegments = pathname.split('/').filter(Boolean);
    const prevSegments = prevPathname.current.split('/').filter(Boolean);
    const isSamePortfolioSubcategory = 
      pathSegments[0] === 'portfolio' && 
      prevSegments[0] === 'portfolio' && 
      pathSegments[1] === prevSegments[1] &&
      pathSegments[1] !== undefined;

    const isSameProjectsSubcategory = 
      pathSegments[0] === 'projects' && 
      prevSegments[0] === 'projects' && 
      pathSegments[1] === prevSegments[1] &&
      pathSegments[1] !== undefined;

    if (!isAboutUsChange && !isSamePortfolioSubcategory && !isSameProjectsSubcategory) {
      window.scrollTo(0, 0);
    }
    prevPathname.current = pathname;
  }, [pathname]);

  return null;
};
import Navbar from './components/Navbar/Navbar'
import StatsAndCTA from './components/StatsAndCTA/StatsAndCTA'
import ContactCTA from "./components/ContactCTA/ContactCTA";
import Footer from "./components/Footer/Footer";
import ContactFAB from './components/ContactFAB/ContactFAB';
import EstimatorFAB from './components/EstimatorFAB/EstimatorFAB';
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
import Gallery from './pages/Gallery/Gallery';
import VideoGalleryPublic from './pages/Gallery/VideoGalleryPublic';
import Contact from './pages/Contact/Contact';
import Home from './pages/Home/Home';
// About Us Components (with lazy loading)
import AboutLayout from './pages/About/AboutLayout';
import AboutOverview from './pages/About/AboutOverview';
const AboutTeam = React.lazy(() => import('./pages/About/AboutTeam'));
const AboutCareer = React.lazy(() => import('./pages/About/AboutCareer'));
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
import TeamManager from './pages/Admin/TeamManager';
import CareerManager from './pages/Admin/CareerManager';
import HeroSetup from './pages/Admin/HeroSetup';
import IdentitySetup from './pages/Admin/IdentitySetup';
import ProcessSetup from './pages/Admin/ProcessSetup';
import ReviewsSetup from './pages/Admin/ReviewsSetup';
import ConsultationManager from './pages/Admin/ConsultationManager';
import FormManager from './pages/Admin/FormManager';

// Estimator Components
import EstimatorPage from './pages/Estimator/EstimatorPage';
import EstimatorPackages from './pages/Admin/Estimator/EstimatorPackages';
import EstimatorRooms from './pages/Admin/Estimator/EstimatorRooms';
import EstimatorAddons from './pages/Admin/Estimator/EstimatorAddons';
import EstimatorLeads from './pages/Admin/Estimator/EstimatorLeads';
import EstimatorSettings from './pages/Admin/Estimator/EstimatorSettings';
import EstimatorReports from './pages/Admin/Estimator/EstimatorReports';

import UserManager from './pages/Admin/UserManager';
import RoleManager from './pages/Admin/RoleManager';
import SystemSettings from './pages/Admin/SystemSettings';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import NotFound from './pages/NotFound/NotFound';

import '@fortawesome/fontawesome-free/css/all.min.css';
import { initAnalytics } from './analytics/analyticsService';
import useAnalyticsTracker from './analytics/useAnalyticsTracker';
import ConsultationModal from './components/ConsultationModal/ConsultationModal';
import { ToastProvider } from './context/ToastContext';

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.includes('/admin');
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);

  // Activate SPA Analytics Page View Tracking
  useAnalyticsTracker();

  useEffect(() => {
    const handleOpen = () => setIsConsultationOpen(true);
    window.addEventListener('open-consultation', handleOpen);
    return () => window.removeEventListener('open-consultation', handleOpen);
  }, []);

  return (
    <>
      {!isAdminRoute && <Navbar />}
      <main style={{ minHeight: '80vh' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blogs" element={<BlogList />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="/blogs/category/:slug" element={<CategoryBlogList />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/projects/:categorySlug" element={<ProjectList />} />
          <Route path="/projects/:parentSlug/:categorySlug" element={<ProjectList />} />
          <Route path="/projects/view/:slug" element={<ProjectDetail />} />
          <Route path="/projects/:parentSlug/:categorySlug/:slug" element={<ProjectDetail />} />
          <Route path="/portfolio" element={<PortfolioList />} />
          <Route path="/portfolio/:categorySlug" element={<PortfolioList />} />
          <Route path="/portfolio/:parentSlug/:categorySlug" element={<PortfolioList />} />
          <Route path="/portfolio/view/:slug" element={<PortfolioDetail />} />
          <Route path="/portfolio/:parentSlug/:categorySlug/:slug" element={<PortfolioDetail />} />
          <Route path="/service-detail/:id" element={<ServiceDetail />} />
          <Route path="/services" element={<ServiceList />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
           <Route path="/photo-gallery" element={<PhotoGalleryPublic />} />
          <Route path="/video-gallery" element={<VideoGalleryPublic />} />
          <Route path="/handover-snapshot" element={<HandoverSnapshotPublic />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/contact-us" element={<Contact />} />
          <Route path="/about-us" element={<AboutLayout />}>
            <Route index element={<AboutOverview />} />
            <Route path="about-overview" element={<AboutOverview />} />
            <Route path="about-our-team" element={
              <React.Suspense fallback={<div className="about-loading-wrapper"><div className="about-loader"></div><p>Loading Team...</p></div>}>
                <AboutTeam />
              </React.Suspense>
            } />
            <Route path="about-career" element={
              <React.Suspense fallback={<div className="about-loading-wrapper"><div className="about-loader"></div><p>Loading Careers...</p></div>}>
                <AboutCareer />
              </React.Suspense>
            } />
            <Route path=":subCategorySlug" element={<AboutOverview />} />
          </Route>
          
          {/* Public Cost Estimator Route (placed before catch-all slug) */}
          <Route path="/estimator" element={<EstimatorPage />} />
          
          {/* Default catch-all for dynamic root categories */}
          <Route path="/:categorySlug" element={<ProjectList />} />

          {/* Admin Routes with Layout */}
          <Route path="/admin-login" element={<Login />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute permission="dashboard.view"><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
          
          {/* Estimator Admin Routes */}
          <Route path="/admin/estimator/packages" element={<ProtectedRoute permission="estimator.settings.manage"><AdminLayout><EstimatorPackages /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/estimator/rooms" element={<ProtectedRoute permission="estimator.settings.manage"><AdminLayout><EstimatorRooms /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/estimator/addons" element={<ProtectedRoute permission="estimator.settings.manage"><AdminLayout><EstimatorAddons /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/estimator/leads" element={<ProtectedRoute permission="estimator.leads.view"><AdminLayout><EstimatorLeads /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/estimator/settings" element={<ProtectedRoute permission="estimator.settings.manage"><AdminLayout><EstimatorSettings /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/estimator/reports" element={<ProtectedRoute permission="estimator.leads.view"><AdminLayout><EstimatorReports /></AdminLayout></ProtectedRoute>} />
          
          <Route path="/admin/blogs" element={<ProtectedRoute permission="blogs.view"><AdminLayout><BlogManager /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/blogs/new" element={<ProtectedRoute permission="blogs.create"><AdminLayout><BlogEditor /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/blogs/edit/:id" element={<ProtectedRoute permission="blogs.edit"><AdminLayout><BlogEditor /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/blog-categories" element={<ProtectedRoute permission="blog_categories.view"><AdminLayout><BlogCategoryManager /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/comments" element={<ProtectedRoute permission="comments.view"><AdminLayout><CommentManager /></AdminLayout></ProtectedRoute>} />
          
          <Route path="/admin/projects" element={<ProtectedRoute permission="projects.view"><AdminLayout><ProjectManager /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/projects/new" element={<ProtectedRoute permission="projects.create"><AdminLayout><ProjectEditor /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/projects/edit/:slug" element={<ProtectedRoute permission="projects.edit"><AdminLayout><ProjectEditor /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/project-categories" element={<ProtectedRoute permission="categories.view"><AdminLayout><ProjectCategoryManager /></AdminLayout></ProtectedRoute>} />
          
          <Route path="/admin/portfolios" element={<ProtectedRoute permission="portfolios.view"><AdminLayout><PortfolioManager /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/portfolios/new" element={<ProtectedRoute permission="portfolios.create"><AdminLayout><PortfolioEditor /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/portfolios/edit/:id" element={<ProtectedRoute permission="portfolios.edit"><AdminLayout><PortfolioEditor /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/portfolio-categories" element={<ProtectedRoute permission="categories.view"><AdminLayout><PortfolioCategoryManager /></AdminLayout></ProtectedRoute>} />
          
          <Route path="/admin/categories" element={<ProtectedRoute permission="categories.view"><AdminLayout><CategoryManager /></AdminLayout></ProtectedRoute>} />
          
          <Route path="/admin/services" element={<ProtectedRoute permission="services.view"><AdminLayout><ServiceManager /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/services/new" element={<ProtectedRoute permission="services.create"><AdminLayout><ServiceEditor /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/services/edit/:id" element={<ProtectedRoute permission="services.edit"><AdminLayout><ServiceEditor /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/service-categories" element={<ProtectedRoute permission="categories.view"><AdminLayout><ServiceCategoryManager /></AdminLayout></ProtectedRoute>} />
          
          <Route path="/admin/gallery/photos" element={<ProtectedRoute permission="gallery.view"><AdminLayout><PhotoGallery /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/gallery/videos" element={<ProtectedRoute permission="gallery.view"><AdminLayout><VideoGallery /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/gallery/handover" element={<ProtectedRoute permission="gallery.view"><AdminLayout><HandoverSnapshot /></AdminLayout></ProtectedRoute>} />
          
          <Route path="/admin/about" element={<ProtectedRoute permission="settings.edit"><AdminLayout><AboutManager /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/about/overview" element={<ProtectedRoute permission="settings.edit"><AdminLayout><AboutManager /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/about/team" element={<ProtectedRoute permission="team.view"><AdminLayout><TeamManager /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/about/career" element={<ProtectedRoute permission="careers.view"><AdminLayout><CareerManager /></AdminLayout></ProtectedRoute>} />
          
          <Route path="/admin/profile" element={<ProtectedRoute><AdminLayout><Profile /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute permission="settings.view"><AdminLayout><SettingsManager /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/system-settings" element={<ProtectedRoute permission="settings.view"><AdminLayout><SystemSettings /></AdminLayout></ProtectedRoute>} />
          
          <Route path="/admin/home/hero" element={<ProtectedRoute permission="homepage.manage"><AdminLayout><HeroSetup /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/home/identity" element={<ProtectedRoute permission="homepage.manage"><AdminLayout><IdentitySetup /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/home/process" element={<ProtectedRoute permission="homepage.manage"><AdminLayout><ProcessSetup /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/home/reviews" element={<ProtectedRoute permission="homepage.manage"><AdminLayout><ReviewsSetup /></AdminLayout></ProtectedRoute>} />
          
          <Route path="/admin/consultations" element={<ProtectedRoute permission="consultations.view"><AdminLayout><ConsultationManager /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/form-fields" element={<ProtectedRoute permission="form_fields.manage"><AdminLayout><FormManager /></AdminLayout></ProtectedRoute>} />
          
          {/* User & Role Management (Super Admin only) */}
          <Route path="/admin/users" element={<ProtectedRoute permission="users.view"><AdminLayout><UserManager /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/roles" element={<ProtectedRoute permission="roles.view"><AdminLayout><RoleManager /></AdminLayout></ProtectedRoute>} />
          
          {/* Wildcard 404 Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdminRoute && <StatsAndCTA />}
      {!isAdminRoute && <ContactCTA />}
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <ContactFAB />}
      {!isAdminRoute && <EstimatorFAB />}
      <ConsultationModal isOpen={isConsultationOpen} onClose={() => setIsConsultationOpen(false)} />
    </>
  );
};

const App = () => {
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <ScrollToTop />
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
