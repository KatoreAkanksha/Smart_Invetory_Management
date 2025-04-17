import React, { Suspense, lazy, memo, useCallback, useState } from "react";
import StockDashboard from "@/components/StockDashboard";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { Toaster as SonnerToaster } from "sonner";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorBoundary from "@/components/ErrorBoundary";
import InitMockData from "@/components/InitMockData";

// Preload important routes
const Dashboard = lazy(() => import("@/pages/Dashboard"));
// Use StockDashboard directly without lazy loading since it's a critical component
const Expenses = lazy(() => import("@/pages/Expenses"));
const Budget = lazy(() => import("@/pages/Budget"));
const Groups = lazy(() => import("@/pages/Groups"));
const FinancialAdvisor = lazy(() => import("@/pages/FinancialAdvisor"));
const Settings = lazy(() => import("@/pages/Settings"));
const Profile = lazy(() => import("@/pages/Profile"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Define route configuration to avoid duplication
const ROUTES = [
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "/dashboard", element: <><Dashboard /><StockDashboard defaultSymbol="AAPL" /></> },
  { path: "/expenses", element: <Expenses /> },
  { path: "/budget", element: <Budget /> },
  { path: "/groups", element: <Groups /> },
  { path: "/advisor", element: <FinancialAdvisor /> },
  { path: "/settings", element: <Settings /> },
  { path: "/profile", element: <Profile /> },
  { path: "*", element: <NotFound /> },
];

// Error handling hook
const useErrorHandler = () => {
  return useCallback((error: Error) => {
    // Centralized error logging
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
      // Example: Sentry.captureException(error);
    } else {
      // Only log in development
      console.error("[App Error]:", error.message, error.stack);
    }
  }, []);
};

// Memoize the route content to prevent unnecessary re-renders
const RouteContent = memo(() => (
  <Routes>
    {ROUTES.map(({ path, element }) => (
      <Route key={path} path={path} element={element} />
    ))}
  </Routes>
));

RouteContent.displayName = 'RouteContent';

// Memoize the main content to prevent unnecessary re-renders
const MainContent = memo(() => (
  <main className="flex-1 container mx-auto px-4 py-6">
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <RouteContent />
      </Suspense>
    </ErrorBoundary>
  </main>
));

MainContent.displayName = 'MainContent';

// Memoize the layout to prevent unnecessary re-renders
const Layout = memo(({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <header className="container mx-auto px-4 pt-4 text-center">
        <h1 className="text-3xl font-bold mb-2">Finance Tracker</h1>
        <p className="text-gray-600">Track stocks and manage your portfolio</p>
      </header>
      {children}
    </div>
  );
});

Layout.displayName = 'Layout';

// Memoize the providers to prevent unnecessary re-renders
const Providers = memo(({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <ThemeProvider defaultTheme="light">
      <LanguageProvider>
        <NotificationProvider>{children}</NotificationProvider>
      </LanguageProvider>
    </ThemeProvider>
  </AuthProvider>
));

Providers.displayName = 'Providers';

/**
 * Main App component
 */
function App() {
  const handleError = useErrorHandler();

  return (
    <ErrorBoundary onError={handleError}>
      <Router>
        <Providers>
          {/* Initialize mock data - this component doesn't render anything */}
          <InitMockData />
          <Layout>
            <MainContent />
          </Layout>
          <SonnerToaster position="bottom-right" />
          <Toaster />
        </Providers>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
