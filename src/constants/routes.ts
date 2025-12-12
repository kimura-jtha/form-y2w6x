/**
 * Route path constants
 */

export const ROUTES = {
  HOME: '/',
  FORM: '/form',
  TERMS_AGREEMENT: '/forms/terms-agreement',
  NOT_FOUND: '*',

  // Auth routes
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
  },

  // Admin routes
  ADMIN: {
    FORMS: '/admin/forms',
    TOURNAMENTS: '/admin/tournaments',
    SERVICES: '/admin/services',
  },

  // Add more routes as needed
} as const;
