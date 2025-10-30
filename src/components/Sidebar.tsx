import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import { getSidebarLinks } from "@/assests/data";
import { useRouter } from "next/navigation";
import { clearTokenData } from "@/utils/tokenManager";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import QRScannerComponent from "@/components/QRScannerComponent";
import { useGeneralApiCall } from "@/services/useGeneralApiCall";
import { usePathname } from "next/navigation";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { getApi } = useGeneralApiCall();
  const [searchData, setSearchData] = useState<any>("");
  const [sidebarLinks, setSidebarLinks] = useState<any[]>([]);
  const [sidebarWidth, setSidebarWidth] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Add QR scanner state
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  const sidebarRef = useRef<HTMLDivElement>(null);

  const fetchSearchData = useCallback(async () => {
    if (!sidebarWidth.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const response: any = await getApi(
        `/qr/search/${sidebarWidth.toUpperCase()}/`
      );

      if (response?.status === 200) {
        // Check if data exists and has proto_id
        if (
          response?.data &&
          Object.keys(response.data).length > 0 &&
          response?.data?.proto_id
        ) {
          setSearchData(response.data);
          router.push(`/collection/proto-detail/${response.data.proto_id}/`);
        } else {
          // Data is empty or no proto_id found
          setSearchData(null);
        }
      } else {
        setSearchData(null);
      }
    } catch (error) {
      setSearchData(null);
    } finally {
      setIsSearching(false);
    }
  }, [sidebarWidth, getApi, router]);

  useEffect(() => {
    if (sidebarWidth.trim() === "") {
      setSearchData(null);
      setHasSearched(false);
    }
  }, [sidebarWidth]);

  useLayoutEffect(() => {
    if (!isMobile) return;

    const handleKeyboardFocus = (event: Event) => {
      const target = event.target as HTMLElement;
      if (sidebarRef.current && sidebarRef.current.contains(target)) return;
    };

    document.addEventListener("focusin", handleKeyboardFocus);
    return () => document.removeEventListener("focusin", handleKeyboardFocus);
  }, [isMobile]);

  const handleLogout = () => {
    clearTokenData();
    router.push("/");
  };

  useEffect(() => {
    const links = getSidebarLinks();
    setSidebarLinks(links);
  }, [user?.role]);

  // QR Scanner handlers
  const handleQRScanSuccess = (result: string) => {
    setIsQRScannerOpen(false);

    try {
      const url = new URL(result);
      if (url.protocol === "http:" || url.protocol === "https:") {
        window.open(result, "_blank");
      }
    } catch (error) {}
  };

  const handleQRScanError = (error: string) => {
    console.error("QR scan error:", error);
    alert(`QR Scan Error: ${error}`);
  };

  const openQRScanner = () => {
    setIsQRScannerOpen(true);
  };

  const closeQRScanner = () => {
    setIsQRScannerOpen(false);
  };

  if (!isMobile && !isOpen) return null;

  return (
    <>
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`${
          isMobile
            ? "fixed left-0 top-0 h-full z-50 transform transition-transform duration-300 ease-in-out"
            : "relative"
        } ${
          isOpen ? "translate-x-0" : isMobile ? "-translate-x-full" : ""
        } w-64 bg-white border-r border-t border-gray-200 flex flex-col min-h-screen print:hidden shadow-lg`}
      >
        {/* Close button for mobile */}
        {isMobile && (
          <div className="flex items-center justify-end p-4 border-b border-gray-200">
            <img src="/logo.png" alt="Logo" className="h-8 mr-auto" />
            <button
              className=" text-gray-500 hover:text-gray-700 cursor-pointer z-10 p-2"
              onClick={onClose}
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Sidebar links */}
        <div className="flex-grow overflow-y-auto p-4 border-t  border-gray-200">
          <ul className="space-y-2 w-full">
            {sidebarLinks?.map((link: any, index: number) => (
              <li key={link?.title || index}>
                {link.path ? (
                  // Direct link
                  <Link
                    href={link.path}
                    className={`block px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      pathname === link?.path
                        ? "bg-blue-100 text-blue-700 border-blue-500 shadow-sm"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                    }  `}
                  >
                    <div
                      className={`flex items-center ${
                        link?.title === "MSR Styles" && "font-bold text-xl"
                      }`}
                      onClick={() => {
                        if (isMobile) onClose();
                      }}
                    >
                      {link.title}
                    </div>
                  </Link>
                ) : (
                  <Link
                    href={`/settings/?list=${encodeURIComponent(
                      JSON.stringify(link?.list)
                    )}`}
                    className={`block px-4 py-3 text-md font-medium rounded-lg transition-all duration-200 ${
                      pathname === link?.title?.toLowerCase()
                        ? "bg-blue-100 text-blue-700 border-blue-500 shadow-sm"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                    }  `}
                  >
                    <div
                      className="flex items-center"
                      onClick={() => {
                        if (isMobile) onClose();
                      }}
                    >
                      <span className="text-sm font-medium">
                        {link?.title || "Settings"}
                      </span>
                    </div>
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {/* Mobile-specific features */}
          {isMobile && (
            <div className="mt-6 space-y-4">
              {/* Search QR Code */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Search QR Code
                </h3>
                <div className="relative">
                  <input
                    onFocus={(e) => e.stopPropagation()}
                    type="text"
                    value={sidebarWidth.toUpperCase()}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg pr-10"
                    placeholder="Enter QR Code..."
                    onChange={(e) => setSidebarWidth(e.target.value)}
                    disabled={isSearching}
                  />
                  <button
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={fetchSearchData}
                    disabled={isSearching || sidebarWidth.length < 8}
                  >
                    {isSearching ? (
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-gray-500 hover:text-gray-700"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 21l-4.35-4.35" />
                        <circle cx={10} cy={10} r={7} />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Search feedback */}
                {hasSearched &&
                  !isSearching &&
                  sidebarWidth.trim() &&
                  !searchData && (
                    <div className="mt-2 text-red-500 text-xs flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      No results found
                    </div>
                  )}

                {searchData?.proto_id && (
                  <div className="mt-2 text-green-500 text-xs flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Found: {searchData.collection_name || searchData.qr_code}
                  </div>
                )}

                {isSearching && (
                  <div className="mt-2 text-blue-500 text-xs flex items-center">
                    <div className="animate-spin h-3 w-3 border border-blue-500 border-t-transparent rounded-full mr-2"></div>
                    Searching...
                  </div>
                )}

                {/* Submit button for valid QR codes */}
                {sidebarWidth.length >= 8 &&
                  sidebarWidth.length <= 10 &&
                  !isSearching && (
                    <button
                      type="button"
                      className="w-full mt-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors rounded-lg"
                      onClick={fetchSearchData}
                      disabled={isSearching}
                    >
                      {isSearching ? "Searching..." : "Search"}
                    </button>
                  )}
              </div>

              {/* QR Scanner */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  QR Scanner
                </h3>
                <button
                  onClick={openQRScanner}
                  className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-lg shadow-sm"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 16h4.01M16 12h4.01M12 8h4.01M8 16h.01M8 12h.01M8 8h.01M8 4h.01"
                    />
                  </svg>
                  Scan QR Code
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Logout button */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors rounded-lg shadow-sm"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerComponent
        isOpen={isQRScannerOpen}
        onClose={closeQRScanner}
        onScanSuccess={handleQRScanSuccess}
        onScanError={handleQRScanError}
      />
    </>
  );
}

export default Sidebar;
