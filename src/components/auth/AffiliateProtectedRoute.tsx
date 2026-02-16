import { Navigate, useLocation } from 'react-router-dom';

interface AffiliateProtectedRouteProps {
    children: React.ReactNode;
}

export default function AffiliateProtectedRoute({ children }: AffiliateProtectedRouteProps) {
    const location = useLocation();

    // Check for affiliate session in localStorage
    const affiliateSession = localStorage.getItem('affiliate_user');

    if (!affiliateSession) {
        // Redirect to affiliate login, saving the location they were trying to go to
        return <Navigate to="/affiliate-dashboard/login" state={{ from: location }} replace />;
    }

    // Session exists, allow access
    // Note: Further validation could happen inside the dashboard or via a hook if needed
    return <>{children}</>;
}
