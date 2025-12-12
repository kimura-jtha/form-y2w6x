import { Navigate, Outlet } from 'react-router';

import { ROUTES } from '@/constants';
import { isAuthenticated } from '@/utils/auth';

/**
 * Protected route wrapper that checks authentication
 * Redirects to login page if user is not authenticated
 */
export function ProtectedRoute() {
  if (!isAuthenticated()) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  }

  return <Outlet />;
}
