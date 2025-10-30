"use client";

import React, { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LayoutComponents from "@/app/layoutComponents";
import { useGeneralApiCall } from "@/services/useGeneralApiCall";
import SeasonModal from "@/components/SeasonModal";
import Loading from "@/components/Loding";
import { TiDeleteOutline } from "react-icons/ti";
import { CiBoxList, CiGrid41 } from "react-icons/ci";

type Season = {
  development_cycle_id: string;
  name: string;
  year: number;
  season: string;
  remarks?: string;
  updated_by: string;
  created_by: string;
  can_edit?: boolean;
  created_at?: string;
  updated_at?: string;
};

// API response structure
type ApiResponse = {
  can_add_new_development_cycle: boolean;
  development_cycles: Season[];
};

// Type for form submission (what modal sends back)
type SeasonFormData = {
  name: string;
  year: number;
  season: string;
  remarks?: string;
};

const SeasonsPage = () => {
  const router = useRouter();
  const [showLayout, setShowLayout] = useState<"grid" | "list">("grid");
  const [editSeason, setEditSeason] = useState<Season | null>(null);
  const [modalShow, setModalShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postApiResponse, setPostApiResponse] = useState(false);
  const { getApi, postApi, loading } = useGeneralApiCall();
  const [isMobile, setIsMobile] = useState(false);
  const [searchStyle, setSearchStyle] = useState<string>("");
  const [styleList, setStyleList] = useState<Season[]>([]);
  const [filterList, setFilterList] = useState<Season[]>([]);

  // Add pagination state variables after the existing useState declarations
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [hasPrevious, setHasPrevious] = useState<boolean>(false);

  const [seasons, setSeasons] = useState<ApiResponse>({
    can_add_new_development_cycle: false,
    development_cycles: [],
  });

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();

    window.addEventListener("resize", checkIsMobile);
    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  const fetchSeasons = async () => {
    try {
      const response = await getApi<ApiResponse>("/development-cycle/list/");

      if (response?.data && typeof response.data === "object") {
        setSeasons(response.data);
      } else {
        setSeasons({
          can_add_new_development_cycle: false,
          development_cycles: [],
        });
      }
    } catch (error) {
      setSeasons({
        can_add_new_development_cycle: false,
        development_cycles: [],
      });
    }
  };

  // Update the fetchStyles function to include pagination
  const fetchStyles = async (page: number = 1) => {
    try {
      const response: any = await getApi(`/collection/list/?page=${page}`);

      if (response) {
        setStyleList(response.data || []);
        setTotalPages(response.total_pages || 1);
        setTotalCount(response.count || 0);
        setCurrentPage(response.current_page || page);
        // Fix the pagination flags - check if URLs exist AND are not null
        setHasNext(response.next !== null && response.next !== undefined);
        setHasPrevious(
          response.previous !== null && response.previous !== undefined
        );
      }
    } catch (error) {
      setStyleList([]);
      setTotalPages(1);
      setTotalCount(0);
      setCurrentPage(1);
      setHasNext(false);
      setHasPrevious(false);
    }
  };

  // Update the fetchSearchStyles function to include pagination
  const fetchSearchStyles = async (page: number = 1) => {
    try {
      const response: any = await getApi(
        `/collection/search/?q=${searchStyle}&page=${page}`
      );

      if (response) {
        setStyleList(response.data || []);
        setTotalPages(response.total_pages || 1);
        setTotalCount(response.count || 0);
        setCurrentPage(response.current_page || page);
        // Fix the pagination flags - check if URLs exist AND are not null
        setHasNext(response.next !== null && response.next !== undefined);
        setHasPrevious(
          response.previous !== null && response.previous !== undefined
        );
      }
    } catch (error) {
      setStyleList([]);
      setTotalPages(1);
      setTotalCount(0);
      setCurrentPage(1);
      setHasNext(false);
      setHasPrevious(false);
    }
  };

  // Add pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;

    setCurrentPage(newPage);

    if (searchStyle.trim() === "") {
      fetchStyles(newPage);
    } else {
      fetchSearchStyles(newPage);
    }
  };

  const handlePrevPage = () => {
    if (hasPrevious && currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNext && currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  // Update the useEffect for search to reset to page 1
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when search changes

    if (searchStyle.trim() === "") {
      fetchStyles(1);
    } else {
      const intervalId = setTimeout(() => {
        fetchSearchStyles(1);
      }, 1000);

      return () => clearTimeout(intervalId);
    }
  }, [searchStyle]);

  useEffect(() => {
    fetchSeasons();
    fetchStyles(1);
  }, []);

  // Updated to match the form data structure from modal
  const handleCreateSeason = async (seasonData: SeasonFormData) => {
    try {
      const response = await postApi("/development-cycle/create/", seasonData);

      // Refresh the list
      await fetchSeasons();

      // Close modal
      setModalShow(false);

      // Show success message
      setPostApiResponse(true);
    } catch (error: any) {
      setError(error.message || "Error creating MSR. Please try again.");
    }
  };

  const handleUpdateSeason = async (seasonData: SeasonFormData) => {
    if (!editSeason?.development_cycle_id) return;

    try {
      const response = await postApi(
        `/development-cycle/update/${editSeason.development_cycle_id}/`,
        seasonData
      );

      // Refresh the list
      await fetchSeasons();

      // Close modal and reset edit state
      setModalShow(false);
      setEditSeason(null);

      // Show success message
      setPostApiResponse(true);
    } catch (error: any) {
      setError(error.message || "Error updating MSR. Please try again.");
    }
  };

  // Updated function signature to match modal expectation
  const handleModalSubmit = (seasonData: SeasonFormData) => {
    if (editSeason) {
      handleUpdateSeason(seasonData);
    } else {
      handleCreateSeason(seasonData);
    }
  };

  const handleModalClose = () => {
    setModalShow(false);
    setEditSeason(null);
    setError(null);
  };

  const handleEditClick = (e: React.MouseEvent, season: Season) => {
    e.stopPropagation();
    setEditSeason(season);
    setModalShow(true);
  };

  const cancelAlert = () => {
    setPostApiResponse(false);
    setError(null);
  };

  const cachedFunction = useCallback(() => {
    const timer = setTimeout(() => {
      if (searchStyle.trim() === "") {
        setFilterList(styleList);
      } else {
        const filtered = styleList.filter((style: Season) =>
          style.name.toLowerCase().includes(searchStyle.toLowerCase())
        );
        setFilterList(filtered);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchStyle, styleList]);

  useEffect(() => {
    cachedFunction();
  }, [searchStyle, styleList]);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className=" px-2 py-8">
          {/* Header Section */}
          {seasons.development_cycles.length > 0 && (
            <div
              className={`text-center bg-white ${isMobile ? "mb-0" : "mb-8"}`}
            >
              {showLayout === "list" ? (
                <h1 className="text-4xl font-bold text-gray-900 mb-2 p-2">
                  ALL STYLE
                </h1>
              ) : (
                <h1 className="text-4xl font-bold text-gray-900 mb-2 p-2">
                  ALL MSR
                </h1>
              )}
            </div>
          )}

          {/* Add Button - only show if user can add */}
          {seasons.can_add_new_development_cycle && showLayout === "grid" && (
            <div className="flex justify-center mb-8">
              {seasons.can_add_new_development_cycle && !isMobile && (
                <button
                  onClick={() => {
                    setEditSeason(null);
                    setModalShow(true);
                  }}
                  className="bg-blue-500 text-white font-semibold px-6 py-3 flex items-center gap-2 cursor-pointer"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Start New MSR
                </button>
              )}
            </div>
          )}

          {/* Empty State */}
          {!loading && seasons.development_cycles.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No MSR yet
              </h3>
              <p className="text-gray-500">
                Get started by creating your first MSR collection
              </p>
            </div>
          )}

          {postApiResponse && (
            <div
              className={`text-center border ${
                error
                  ? "bg-red-200 border-red-300"
                  : "bg-green-200 border-green-300"
              }  mb-6 relative`}
            >
              {error ? (
                <h1 className="font-bold text-2xl p-4 text-center">
                  Error: {error}
                </h1>
              ) : (
                <h1 className="font-bold text-2xl p-4 text-center">
                  Success: Action completed successfully!
                </h1>
              )}

              <div
                className="absolute top-2 right-2 cursor-pointer hover:bg-gray-100  p-1 transition-colors"
                onClick={cancelAlert}
              >
                <TiDeleteOutline size={30} />
              </div>
            </div>
          )}

          {loading ? (
            <Loading fullScreen={true} text="Loading MSR..." />
          ) : (
            <div>
              {seasons.development_cycles.length > 0 && (
                <div className="bg-white">
                  <div className="flex items-center justify-between p-2 sm:px-4 bg-white border-b border-gray-200">
                    {showLayout === "list" ? (
                      <h2 className="text-2xl font-bold text-gray-900">
                        STYLE ({totalCount > 0 ? totalCount : filterList.length}
                        )
                      </h2>
                    ) : (
                      <h2 className="text-2xl font-bold text-gray-900">
                        MSR ({seasons?.development_cycles.length})
                      </h2>
                    )}

                    <div className="flex gap-4 flex-col sm:flex-row justify-end">
                      {showLayout === "list" && !isMobile && (
                        <div>
                          <input
                            type="text"
                            placeholder="Search..."
                            value={searchStyle}
                            className="border px-4 py-3 rounded"
                            onChange={(e) => setSearchStyle(e.target.value)}
                          />
                        </div>
                      )}

                      <div className="flex gap-4 border px-4 py-2 rounded bg-gray-50 w-fit">
                        <CiGrid41
                          size={28}
                          className={`text-gray-600 cursor-pointer ${
                            showLayout === "grid"
                              ? "bg-gray-200 p-2 rounded-sm"
                              : ""
                          }`}
                          onClick={() => setShowLayout("grid")}
                        />
                        <CiBoxList
                          size={28}
                          className={`text-gray-600 cursor-pointer ${
                            showLayout === "list"
                              ? "bg-gray-200 p-2 rounded-sm"
                              : ""
                          }`}
                          onClick={() => setShowLayout("list")}
                        />
                      </div>
                    </div>
                  </div>

                  {showLayout === "list" && isMobile && (
                    <div className="p-2">
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchStyle}
                        className="border px-4 py-3 rounded w-full"
                        onChange={(e) => setSearchStyle(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 bg-white p-6">
                    {Array.isArray(seasons?.development_cycles) &&
                      seasons?.development_cycles?.map(
                        (season: Season, index) => (
                          <div key={index}>
                            {showLayout === "grid" && (
                              <div
                                key={season.development_cycle_id}
                                onClick={() =>
                                  router.push(
                                    `/collection/${season.development_cycle_id}`
                                  )
                                }
                                className="bg-gray-50 overflow-hidden transition-all duration-300 group border border-gray-500 hover:shadow-lg p-6 cursor-pointer hover:border-blue-200 flex flex-col h-full"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <h3 className="font-bold text-lg text-gray-900 truncate">
                                    {season.name}
                                  </h3>

                                  {season.can_edit && !isMobile && (
                                    <button
                                      onClick={(e) =>
                                        handleEditClick(e, season)
                                      }
                                      className="py-1 px-3 text-sm border-2 border-gray-300 hover:bg-blue-50 transition-colors"
                                      title="Edit Collection"
                                    >
                                      Edit
                                    </button>
                                  )}
                                </div>

                                <div className="flex items-center text-sm text-gray-500 mb-3">
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
                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <span className="font-medium">
                                    Year: {season.year}
                                  </span>
                                </div>

                                {/* Card Body */}
                                <div className="space-y-2 flex flex-col flex-grow">
                                  {season.season && (
                                    <div className="bg-blue-50 px-3 py-2">
                                      <span className="text-sm font-medium text-blue-800">
                                        Season: {season.season}
                                      </span>
                                    </div>
                                  )}

                                  {season.remarks && (
                                    <div className="bg-gray-50 px-3 py-2 ">
                                      <span className="text-sm text-gray-700">
                                        Remarks: {season.remarks}
                                      </span>
                                    </div>
                                  )}

                                  <div className="flex justify-between items-center text-xs text-gray-500 pt-4 mt-auto border-t border-gray-100">
                                    <span>Created by: {season.created_by}</span>
                                    {season.created_at && (
                                      <span>
                                        {new Date(
                                          season.created_at
                                        ).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      )}
                  </div>

                  <div className="px-2 sm:px-4 pb-6">
                    {showLayout === "list" && (
                      <>
                        <div className="overflow-x-auto bg-white border border-gray-200 shadow-sm">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  MSR Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Sampling Merchant
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  JC Number
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Updated By
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Created On
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {styleList.map((collection: any) => (
                                <tr
                                  key={collection.collection_id}
                                  className="hover:bg-blue-50 transition-colors duration-150"
                                >
                                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                    {collection.name}
                                  </td>
                                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                    {collection?.development_cycles?.map(
                                      (item: any, index: number) => (
                                        <p
                                          key={index}
                                          className="text-sm text-gray-700"
                                        >
                                          {item.name}
                                        </p>
                                      )
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-700">
                                    {collection.sampling_merchant || "-"}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-700">
                                    {collection.collection_jc_number || "-"}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-700">
                                    {collection.updated_by || "-"}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-700">
                                    {collection.created_at
                                      ? collection.created_at
                                          .toString()
                                          .slice(0, 10)
                                      : "-"}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() =>
                                          router.push(
                                            `/collection/protos/${collection.collection_id}`
                                          )
                                        }
                                        className="text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1 rounded-md hover:from-blue-700 hover:to-blue-800 cursor-pointer shadow-sm transition-all"
                                      >
                                        View Protos
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {/* Corrected Pagination Component */}
                        {totalPages > 1 && (
                          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                            {/* Mobile pagination */}
                            <div className="flex-1 flex justify-between sm:hidden">
                              <button
                                onClick={handlePrevPage}
                                disabled={!hasPrevious || currentPage <= 1}
                                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                                  hasPrevious && currentPage > 1
                                    ? "text-gray-700 bg-white hover:bg-gray-50"
                                    : "text-gray-400 bg-gray-100 cursor-not-allowed"
                                }`}
                              >
                                Previous
                              </button>
                              <button
                                onClick={handleNextPage}
                                disabled={!hasNext || currentPage >= totalPages}
                                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                                  hasNext && currentPage < totalPages
                                    ? "text-gray-700 bg-white hover:bg-gray-50"
                                    : "text-gray-400 bg-gray-100 cursor-not-allowed"
                                }`}
                              >
                                Next
                              </button>
                            </div>

                            {/* Desktop pagination */}
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm text-gray-700">
                                  Showing page{" "}
                                  <span className="font-medium">
                                    {currentPage}
                                  </span>{" "}
                                  of{" "}
                                  <span className="font-medium">
                                    {totalPages}
                                  </span>{" "}
                                  ({styleList.length} items on this page,{" "}
                                  {totalCount} total results)
                                </p>
                              </div>
                              <div>
                                <nav
                                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                                  aria-label="Pagination"
                                >
                                  {/* Previous button */}
                                  <button
                                    onClick={handlePrevPage}
                                    disabled={!hasPrevious || currentPage <= 1}
                                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                                      hasPrevious && currentPage > 1
                                        ? "text-gray-500 bg-white hover:bg-gray-50"
                                        : "text-gray-300 bg-gray-100 cursor-not-allowed"
                                    }`}
                                  >
                                    <svg
                                      className="h-5 w-5"
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                      aria-hidden="true"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </button>

                                  {/* Page numbers */}
                                  {Array.from(
                                    { length: totalPages },
                                    (_, i) => i + 1
                                  )
                                    .filter((page) => {
                                      // Show first page, last page, current page, and pages around current
                                      if (page === 1 || page === totalPages)
                                        return true;
                                      if (Math.abs(page - currentPage) <= 2)
                                        return true;
                                      return false;
                                    })
                                    .map((page, index, arr) => {
                                      // Add ellipsis if there's a gap
                                      const prevPage = arr[index - 1];
                                      const showEllipsis =
                                        prevPage && page - prevPage > 1;

                                      return (
                                        <React.Fragment key={page}>
                                          {showEllipsis && (
                                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                              ...
                                            </span>
                                          )}
                                          <button
                                            onClick={() =>
                                              handlePageChange(page)
                                            }
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                              currentPage === page
                                                ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                            }`}
                                          >
                                            {page}
                                          </button>
                                        </React.Fragment>
                                      );
                                    })}

                                  {/* Next button */}
                                  <button
                                    onClick={handleNextPage}
                                    disabled={
                                      !hasNext || currentPage >= totalPages
                                    }
                                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                                      hasNext && currentPage < totalPages
                                        ? "text-gray-500 bg-white hover:bg-gray-50"
                                        : "text-gray-300 bg-gray-100 cursor-not-allowed"
                                    }`}
                                  >
                                    <svg
                                      className="h-5 w-5"
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                      aria-hidden="true"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </button>
                                </nav>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Season Modal */}
      <SeasonModal
        isOpen={modalShow}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        editData={editSeason}
        loading={loading}
        error={error}
      />
    </>
  );
};

export default LayoutComponents(SeasonsPage);
