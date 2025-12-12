import { lazy } from 'react';

import { createBrowserRouter, Navigate } from 'react-router';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ROUTES } from '@/constants';
import { AdminLayout } from '@/layouts/AdminLayout';
import { FormManagementLayout } from '@/layouts/FormManagementLayout';

const FormPage = lazy(() =>
  import('./pages/FormPage').then((module) => ({ default: module.FormPage })),
);

const TermsAgreementPage = lazy(() =>
  import('./pages/TermsAgreementPage').then((module) => ({
    default: module.TermsAgreementPage,
  })),
);

const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })),
);

// Admin pages
const AdminFormManagementPage = lazy(() =>
  import('./pages/admin/FormManagementPage').then((module) => ({
    default: module.FormManagementPage,
  })),
);

const AdminTournamentManagementPage = lazy(() =>
  import('./pages/admin/TournamentManagementPage').then((module) => ({
    default: module.TournamentManagementPage,
  })),
);

const AdminTournamentDetailPage = lazy(() =>
  import('./pages/admin/TournamentDetailPage').then((module) => ({
    default: module.TournamentDetailPage,
  })),
);

const AdminServiceManagementPage = lazy(() =>
  import('./pages/admin/ServiceManagementPage').then((module) => ({
    default: module.ServiceManagementPage,
  })),
);

const router = createBrowserRouter([
  {
    element: <FormManagementLayout />,
    children: [
      {
        path: ROUTES.FORM,
        element: <FormPage />,
      },
      {
        path: ROUTES.TERMS_AGREEMENT,
        element: <TermsAgreementPage />,
      },
    ],
  },
  {
    path: ROUTES.AUTH.LOGIN,
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            path: ROUTES.ADMIN.FORMS,
            element: <AdminFormManagementPage />,
          },
          {
            path: ROUTES.ADMIN.TOURNAMENTS,
            element: <AdminTournamentManagementPage />,
          },
          {
            path: `${ROUTES.ADMIN.TOURNAMENTS}/:id`,
            element: <AdminTournamentDetailPage />,
          },
          {
            path: ROUTES.ADMIN.SERVICES,
            element: <AdminServiceManagementPage />,
          },
        ],
      },
    ],
  },
  {
    path: ROUTES.NOT_FOUND,
    element: <Navigate to={ROUTES.FORM} />,
  },
]);

export default router;
