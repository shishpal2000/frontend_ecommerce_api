"use client";

import Sidebar from "@/components/Sidebar";
import { clearTokenData } from "@/utils/tokenManager";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const LayoutComponents = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const LayoutWrapper: React.FC<P> = (props) => {
    const { user } = useAuth();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
    const [isMobile, setIsMobile] = useState(false);

    useLayoutEffect(() => {
      const checkIsMobile = () => {
        const isNowMobile = window.innerWidth < 768;
        setIsMobile(isNowMobile);

        setSidebarOpen((prev: any) => {
          if (!isNowMobile) return true;

          return prev;
        });
      };

      // Run only once initially
      checkIsMobile();

      // Throttle resize to avoid rapid toggles
      let resizeTimer: NodeJS.Timeout;
      const handleResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(checkIsMobile, 150);
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    const toggleSidebar = () => {
      setSidebarOpen(!sidebarOpen);
    };

    const handleLogout = () => {
      clearTokenData();
      window.location.reload();
      window.location.href = "/";
    };

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-30 print:hidden">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Hamburger menu for mobile */}
                {isMobile && (
                  <button
                    onClick={toggleSidebar}
                    className="p-1 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>
                )}
                {/* <img src="/file.svg" alt="Logo" className="h-8 w-8" /> */}
              </div>

              <div className="flex-1 mx-2 p-4 w-[80%]"></div>
              <button
                type="button"
                onClick={() => router.push("/tutorial")}
                className="cursor-pointer border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-100 mr-4"
              >
                Tutorial
              </button>

              <button
                type="button"
                onClick={() => router.push("/helpdesk")}
                className="cursor-pointer border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-100 mr-4"
              >
                Help Desk
              </button>

              <div className="flex items-center space-x-4 gap-4">
                {!isMobile && (
                  <>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 text-sm font-medium cursor-pointer text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Logout
                    </button>
                  </>
                )}
                <div className="relative group">
                  <button className="flex items-center space-x-1 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none">
                    <div className="text-left leading-tight">
                      <p className="truncate max-w-auto sm:max-w-none">
                        <span className="font-semibold">User:</span>{" "}
                        {user?.name || "Guest"}
                      </p>
                      <p className="truncate max-w-auto sm:max-w-none">
                        <span className="font-semibold">Role:</span>{" "}
                        {user?.role || "Guest"}
                      </p>
                    </div>
                  </button>
                  <div className="absolute right-0 w-48 mt-2 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => router.push("/user-profile")}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Your Profile
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        {/* Main Content Layout: Sidebar fixed, main scrollable */}
        <div className="relative flex">
          {/* Desktop Sidebar - fixed */}
          {!isMobile && (
            <div className="fixed top-200px left-0 h-screen w-64 bg-gray-100 z-20 shadow print:hidden">
              <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                isMobile={false}
              />
            </div>
          )}
          {/* Mobile Sidebar - overlay drawer */}
          {isMobile && sidebarOpen && (
            <>
              {/* Sidebar Drawer */}
              <div className="fixed inset-0 z-30 flex print:hidden">
                <div className="w-64 h-full bg-gray-100 shadow-lg">
                  <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    isMobile={true}
                  />
                </div>
                {/* Overlay */}
                <div
                  className="flex-1 bg-black/40 backdrop-blur-sm"
                  onClick={() => setSidebarOpen(false)}
                />
              </div>
            </>
          )}

          {/* Main Content - offset by sidebar width on desktop */}
          <main
            className={`flex-1 h-[calc(100vh-70px)] overflow-y-auto bg-gray-50 ${
              !isMobile ? "ml-64" : ""
            } print:ml-0 print:h-auto print:overflow-visible print:bg-white`}
          >
            {/* Pass all props to the wrapped component */}
            <WrappedComponent {...props} />
          </main>
        </div>
      </div>
    );
  };

  // Set display name for debugging
  LayoutWrapper.displayName = `LayoutComponents(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return LayoutWrapper;
};

export default LayoutComponents;
