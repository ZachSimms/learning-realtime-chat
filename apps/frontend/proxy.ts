import { authkitMiddleware } from '@workos-inc/authkit-nextjs';

// In middleware auth mode, each page is protected by default.
// Exceptions are configured via the `unauthenticatedPaths` option.
export default authkitMiddleware({
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: ['/'],
  },
});

// Match against pages that require authentication
// Leave this out if you want authentication on every page in your application
//
// `/api/:path*` must be included so route handlers that call `withAuth`
// (e.g. `/api/ably`) are covered by the AuthKit middleware — otherwise
// `withAuth` throws and those endpoints 500.
export const config = { matcher: ['/', '/chat/:path*', '/api/:path*'] };