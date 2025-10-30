"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_ROUTE_ACCESS, getUserDashboard } from "@/assests/data";

interface GlobalProtectedRouteProps {
  children: React.ReactNode;
}

export const GlobalProtectedRoute = ({
  children,
}: GlobalProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authCheck, setAuthCheck] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const PUBLIC_ROUTES = [
    "/",
    "/login",
    "/register",
    "/unauthorized",
    "/forgot-password",
    "/reset-password/*",
    "/user-profile",
    "/specs-diff",
    "/admin/processes",
    "/admin/processes/*",
    "/materials/*",
    "/Materialtype",
    "/fields",
    "/comments",
    "/material-page",
    "/specs-template",
    "/materials/*",
    "/processes/*",
    "/print/*",
    "/placement-location/*",
    "/development",
    "/collection/*",
    "/draft-template",
    "/type_management",
    "/material-page/*",
    "/helpdesk",
    "/add-style-comment/*",
    "/tutorial/*",
    "/settings/*",
    "/video-comment/*",
    "/master-table/*",
  ];

  // Check if a route is public
  const isPublicRoute = useCallback((path: string): boolean => {
    return PUBLIC_ROUTES.some((route) => {
      if (route.endsWith("/*")) {
        return path.startsWith(route.slice(0, -2));
      }
      return path === route;
    });
  }, []);

  // Enhanced route access checker with dynamic route support
  const checkRouteAccess = useCallback(
    (currentPath: string, allowedRoutes: string[]): boolean => {
      return allowedRoutes.some((route) => {
        // 1. Exact match
        if (currentPath === route) {
          return true;
        }

        if (route.endsWith("/*")) {
          const baseRoute = route.slice(0, -2); // Remove "/*"
          const matches = currentPath.startsWith(baseRoute);

          return matches;
        }

        // 3. Dynamic nested routes (e.g., "/admin/collection" allows "/admin/collection/uuid")
        if (currentPath.startsWith(route + "/")) {
          return true;
        }

        // 4. Handle NextJS dynamic routes with brackets
        if (route.includes("[") && route.includes("]")) {
          const regexPattern = route
            .replace(/\[([^\]]+)\]/g, "([^/]+)")
            .replace(/\//g, "\\/");

          const regex = new RegExp(`^${regexPattern}$`);
          const matches = regex.test(currentPath);

          return matches;
        }

        return false;
      });
    },
    []
  );

  // Main authorization check function
  const checkGlobalAuthorization = useCallback(() => {
    // Skip if already checking or redirecting
    if (redirecting) {
      return;
    }

    setAuthCheck(true);

    if (isPublicRoute(pathname)) {
      setIsAuthorized(true);
      return;
    }

    if (!user || !user.role) {
      if (pathname !== "/") {
        localStorage.setItem("intendedUrl", pathname);
      }

      setIsAuthorized(false);
      setRedirecting(true);

      setTimeout(() => {
        router.replace("/");
      }, 100);

      return;
    }

    // Keep role uppercase - no conversion needed
    const userRole = user.role as keyof typeof ROLE_ROUTE_ACCESS;
    const allowedRoutes = ROLE_ROUTE_ACCESS[userRole] || [];

    // Check if current route is allowed (with dynamic route support)
    const hasAccess = checkRouteAccess(pathname, allowedRoutes);

    if (!hasAccess) {
      setIsAuthorized(false);
      setRedirecting(true);

      // Redirect to user's default dashboard
      const dashboardPath = getUserDashboard(userRole) || "/";

      setTimeout(() => {
        router.replace(dashboardPath);
      }, 100);
      return;
    }

    setIsAuthorized(true);
    setRedirecting(false);
  }, [user, pathname, isPublicRoute, checkRouteAccess, redirecting, router]);

  // Reset redirect flag when user changes or pathname changes
  useEffect(() => {
    setRedirecting(false);
  }, [user?.user_id, pathname]);

  // Handle public route changes
  useEffect(() => {
    if (isPublicRoute(pathname)) {
      setRedirecting(false);
      setIsAuthorized(true);
      setAuthCheck(true);
    }
  }, [pathname, isPublicRoute]);

  // Main authorization effect
  useEffect(() => {
    if (!isLoading) {
      checkGlobalAuthorization();
    }
  }, [user, isLoading, checkGlobalAuthorization, redirecting]);

  // Always render public routes immediately
  if (isPublicRoute(pathname)) {
    return <>{children}</>;
  }

  // Show loading while checking or redirecting
  if (isLoading || !authCheck || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm">
            {redirecting ? "Redirecting..." : "Checking permissions..."}
          </p>
        </div>
      </div>
    );
  }

  // Render protected content only if authorized
  return isAuthorized ? <>{children}</> : null;
};
