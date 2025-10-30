"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { FaEye, FaEyeSlash } from "react-icons/fa6";

import { redirectToDashboard, ROLE_ROUTE_ACCESS } from "@/assests/data";

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isClientMounted, setIsClientMounted] = useState(false);

  // Handle client-side mounting to prevent hydration mismatch
  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  // Only access localStorage after client has mounted
  useEffect(() => {
    if (isClientMounted && typeof window !== "undefined") {
      try {
        const storedUserInfo = localStorage.getItem("authUser");
        if (storedUserInfo) {
          const parsedUser = JSON.parse(storedUserInfo);
          setUserInfo(parsedUser);
        }
      } catch (error) {}
    }
  }, [isClientMounted]);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Login form state
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Call the login API
      await login({
        username: loginData.username,
        password: loginData.password,
      });

      setSuccess("Login successful! Redirecting...");

      // Redirect after successful login
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced redirect logic with intended URL handling
  const handlePostLoginRedirect = (userRole: string) => {
    try {
      // 1. Get the intended URL that user was trying to access
      const intendedUrl = localStorage.getItem("intendedUrl");

      if (intendedUrl && intendedUrl !== "/" && intendedUrl !== "/login") {
        // 2. Check if user has permission for the intended URL
        const normalizedRole = userRole;
        const allowedRoutes =
          ROLE_ROUTE_ACCESS[normalizedRole as keyof typeof ROLE_ROUTE_ACCESS] ||
          [];

        // 3. Check if intended URL is allowed for this user
        const hasAccess = allowedRoutes.some((route) => {
          // Exact match
          if (intendedUrl === route) {
            return true;
          }

          if (route.endsWith("/*")) {
            const baseRoute = route.slice(0, -2);
            const matches = intendedUrl.startsWith(baseRoute);

            return matches;
          }

          if (intendedUrl.startsWith(route + "/")) {
            return true;
          }

          // Handle NextJS dynamic routes with brackets
          if (route.includes("[") && route.includes("]")) {
            const regexPattern = route
              .replace(/\[([^\]]+)\]/g, "([^/]+)")
              .replace(/\//g, "\\/");

            const regex = new RegExp(`^${regexPattern}$`);
            const matches = regex.test(intendedUrl);

            return matches;
          }

          return false;
        });

        localStorage.removeItem("intendedUrl");

        if (hasAccess) {
          setTimeout(() => {
            router.push(intendedUrl);
          }, 500);
          return;
        } else {
          setError(
            "You don't have permission to access that page. Redirecting to your dashboard..."
          );
          setTimeout(() => setError(""), 5000);
        }
      }

      setTimeout(() => {
        redirectToDashboard(userRole, router);
      }, 0);
    } catch (error) {
      setTimeout(() => {
        redirectToDashboard(userRole, router);
      }, 0);
    }
  };

  // Handle redirect after successful login
  useEffect(() => {
    const currentUser = user || userInfo;
    if (currentUser?.role && (success || userInfo)) {
      handlePostLoginRedirect(currentUser.role);
    }
  }, [user?.role, userInfo?.role, success, router]);

  // If user is already logged in (from localStorage), redirect immediately
  useEffect(() => {
    if (userInfo?.role && !user && isClientMounted) {
      handlePostLoginRedirect(userInfo.role);
    }
  }, [userInfo, isClientMounted]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Log in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back! Please log in to continue.
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 rounded">
              <div className="flex">
                <svg
                  className="w-5 h-5 text-red-400 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-400 rounded">
              <div className="flex">
                <svg
                  className="w-5 h-5 text-green-400 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Username * (Only Lower case)
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={loginData.username.toLowerCase()}
                onChange={(e) =>
                  setLoginData((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <span
                  className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center cursor-pointer py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center ">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
