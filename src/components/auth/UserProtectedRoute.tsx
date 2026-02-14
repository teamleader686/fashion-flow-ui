import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

type UserProtectedRouteProps = {
    children: ReactNode;
};

const UserProtectedRoute = ({ children }: UserProtectedRouteProps) => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!loading && !user) {
            // Redirect to login but save the current location to redirect back after login
            navigate('/login', { state: { from: location } });
        }
    }, [user, loading, navigate, location]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
                <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return <>{children}</>;
};

export default UserProtectedRoute;
