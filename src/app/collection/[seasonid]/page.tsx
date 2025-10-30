"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import LayoutComponents from "@/app/layoutComponents";
import { useGeneralApiCall } from "@/services/useGeneralApiCall";
import CollectionModal from "@/components/CollectionModel";
import SeasonModal from "@/components/SeasonModal";
import Loading from "@/components/Loding";
import { TiDeleteOutline } from "react-icons/ti";
import { CiBoxList } from "react-icons/ci";
import { CiGrid41 } from "react-icons/ci";

type CollectionEdit = {
  collection_id: string;
  name: string;
  sampling_merchant: string;
  sampling_merchant_id?: string;
  development_cycle_id?: string;
  collection_jc_number?: string;
  can_edit?: boolean;
  remarks?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
};

type DevelopmentCycle = {
  development_cycle_id: string;
  name: string;
  year: number;
  season: string;
  remarks?: string;
  can_edit?: boolean;
  created_at?: string;
  updated_at?: string;
  updated_by?: string;
  created_by?: string;
};

// New API response structure
type ApiResponse = {
  can_add_new_collection: boolean;
  development_cycle: DevelopmentCycle;
  collections: CollectionEdit[];
};

type CollectionSubmitData = {
  name: string;
  collection_jc_number?: string;
  sampling_merchant_id: string;
  development_cycle_id?: string;
  remarks?: string;
};

type Merchant = {
  user_id: string;
  name: string;
};

type Season = {
  development_cycle_id?: string;
  name: string;
  collection_jc_number?: string;
  year: number;
  season: string;
  remarks?: string;
  updated_by?: string;
  created_by?: string;
  can_edit?: boolean;
  created_at?: string;
  updated_at?: string;
};

const StylesPage = () => {
  const router = useRouter();
  const { seasonid } = useParams();
  const [isMobile, setIsMobile] = useState(false);
  const { getApi, postApi, loading } = useGeneralApiCall();
  const [showLayout, setShowLayout] = useState<"grid" | "list">("grid");

  // Collection Modal states
  const [modalShow, setModalShow] = useState(false);
  const [editCollection, setEditCollection] = useState<CollectionEdit | null>(
    null
  );

  // Season Modal states
  const [seasonModalShow, setSeasonModalShow] = useState(false);
  const [editSeason, setEditSeason] = useState<Season | null>(null);

  // Common states
  const [error, setError] = useState<string | null>(null);
  const [postApiResponse, setPostApiResponse] = useState(false);

  // Updated data state to match new API response
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);

  // Fetch data on component mount
  useEffect(() => {
    fetchCollections();
    fetchMerchants();
  }, [seasonid]);

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

  // Updated fetchCollections to handle new API structure
  const fetchCollections = async () => {
    try {
      const data: any = await getApi(
        `/development-cycle/list-collections/${seasonid}/`
      );

      setApiData(data?.data || null);
    } catch (error: any) {
      setError(
        error.message || "Error fetching collections. Please try again."
      );
      setPostApiResponse(true);
      setTimeout(() => {
        setPostApiResponse(false);
      }, 1000);
    }
  };

  const fetchMerchants = async () => {
    try {
      const data: any = await getApi(
        "/authentication/list-users/sampling-merchants/"
      );

      setMerchants(data?.data || []);
    } catch (error: any) {
      setError(error.message || "Error fetching merchants. Please try again.");
      setPostApiResponse(true);
      setTimeout(() => {
        setPostApiResponse(false);
      }, 5000);
    }
  };

  // Collection handlers (updated to use new data structure)
  const handleCreateCollection = async (
    collectionData: CollectionSubmitData
  ) => {
    try {
      const payload = {
        name: collectionData.name || "",
        jc_number: collectionData.collection_jc_number || "",
        sampling_merchant_id: collectionData.sampling_merchant_id || "",
        development_cycle_id: seasonid || "",
        remarks: collectionData.remarks || "",
      };

      const response = await postApi("/collection/create/", payload);

      // Refresh collections list
      if (response.status === 201) {
        await fetchCollections();
        setModalShow(false);
        setError(null);
        setPostApiResponse(true);
        setTimeout(() => {
          setPostApiResponse(false);
        }, 5000);
      }
    } catch (error: any) {
      setError(error.message || "Error creating collection. Please try again.");
      setPostApiResponse(true);
      setTimeout(() => {
        setPostApiResponse(false);
      }, 5000);
    }
  };

  const handleUpdateCollection = async (
    collectionData: CollectionSubmitData
  ) => {
    try {
      const payload = {
        name: collectionData.name || "",
        sampling_merchant_id: collectionData.sampling_merchant_id || "",
        development_cycle_id: seasonid || "",
        remarks: collectionData.remarks || "",
        jc_number: collectionData.collection_jc_number || "",
      };

      const response = await postApi(
        `/collection/update/${editCollection?.collection_id}/`,
        payload
      );

      if (response.status === 201 || response.status === 200) {
        // Refresh collections list
        await fetchCollections();

        // Close modal and reset edit state
        setModalShow(false);
        setEditCollection(null);

        setError(null);
        setPostApiResponse(true);
        setTimeout(() => {
          setPostApiResponse(false);
        }, 5000);
      }
    } catch (error: any) {
      setError(error.message || "Error updating collection. Please try again.");
      setPostApiResponse(true);
      setTimeout(() => {
        setPostApiResponse(false);
      }, 5000);
    }
  };

  const handleModalSubmit = (collectionData: CollectionSubmitData) => {
    if (editCollection) {
      handleUpdateCollection(collectionData);
    } else {
      handleCreateCollection(collectionData);
    }
  };

  const handleModalClose = () => {
    setModalShow(false);
    setEditCollection(null);
    setError(null);
  };

  const handleEditClick = (e: React.MouseEvent, collection: CollectionEdit) => {
    e.stopPropagation();
    setEditCollection(collection);
    setModalShow(true);
  };

  // Season/MSR handlers (updated to use new data structure)
  const handleEditSeasonClick = () => {
    if (apiData?.development_cycle) {
      const cycle = apiData.development_cycle;
      setEditSeason({
        development_cycle_id: cycle.development_cycle_id,
        name: cycle.name,
        year: cycle.year,

        season: cycle.season,
        remarks: cycle.remarks,
        created_at: cycle.created_at,
        can_edit: cycle.can_edit,
        created_by: cycle.created_by,
        updated_by: cycle.updated_by,
      });
      setSeasonModalShow(true);
    }
  };

  const handleSeasonModalClose = () => {
    setSeasonModalShow(false);
    setEditSeason(null);
    setError(null);
  };

  const handleUpdateSeason = async (seasonData: {
    name: string;
    year: number;
    season: string;
    remarks?: string;
  }) => {
    try {
      const payload = {
        name: seasonData.name || "",
        year: seasonData.year || "",
        season: seasonData.season || "",
        remarks: seasonData.remarks || "",
      };

      const response = await postApi(
        `/development-cycle/update/${seasonid}/`,
        payload
      );

      if (response.status === 200 || response.status === 201) {
        // Refresh collections data to show updated season info
        await fetchCollections();

        // Close modal and reset edit state
        setSeasonModalShow(false);
        setEditSeason(null);

        // Show success message
        setError(null);
        setPostApiResponse(true);
        setTimeout(() => {
          setPostApiResponse(false);
        }, 5000);
      }
    } catch (error: any) {
      setError(error.message || "Error updating MSR. Please try again.");
      setPostApiResponse(true);
      setTimeout(() => {
        setPostApiResponse(false);
      }, 5000);
    }
  };

  const handleSeasonModalSubmit = (seasonData: {
    name: string;
    year: number;
    season: string;
    remarks?: string;
  }) => {
    handleUpdateSeason(seasonData);
  };

  // Convert CollectionEdit to the format expected by modal
  const getEditDataForModal = (collection: CollectionEdit | null) => {
    if (!collection) return null;

    return {
      collection_id: collection.collection_id,
      name: collection.name,
      jc_number: collection.collection_jc_number || "",
      sampling_merchant_id: collection.sampling_merchant_id || "",
      development_cycle_id: seasonid as string,
      remarks: collection.remarks || "",
      created_at: collection.created_at,
      updated_at: collection.updated_at,
    };
  };

  const cancelAlert = () => {
    setPostApiResponse(false);
    setError(null);
  };

  // Get development cycle data for easier access
  const developmentCycle = apiData?.development_cycle;
  const collections = apiData?.collections || [];
  const canAddNewCollection = apiData?.can_add_new_collection || false;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="px-2 py-8">
          {/* Header Section */}
          <div className="bg-white shadow-sm p-4 mb-8">
            {isMobile ? (
              <div>
                <div className="flex items-center gap-4 w-full justify-between">
                  <button
                    onClick={() => router.back()}
                    className="px-2 py-2 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Back to MSR List
                  </button>
                </div>

                <div className="flex items-center gap-4 mt-4 mb-4">
                  <h1 className="text-3xl font-semibold text-gray-900 uppercase ">
                    MSR Name : {developmentCycle?.name || "Loading..."}
                  </h1>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Back to MSR List
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-semibold text-gray-900 uppercase">
                    MSR Name : {developmentCycle?.name || "Loading..."}
                  </h1>
                </div>

                <div className="flex items-center gap-4">
                  {canAddNewCollection && (
                    <button
                      onClick={() => {
                        setEditCollection(null);
                        setModalShow(true);
                      }}
                      className="bg-gradient-to-r cursor-pointer from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
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
                      Add Style
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* MSR Information Section */}
            <div className="text-gray-700 p-6 border border-dashed border-gray-300 bg-gray-50">
              <div className="flex justify-between items-start gap-6 mb-4">
                {/* MSR Information on the left */}
                <div className="space-y-3">
                  <div className="grid gap-4">
                    <div>
                      <h1 className="text-lg font-semibold text-gray-900">
                        Year : {developmentCycle?.year || "Loading..."}
                      </h1>
                    </div>
                    <div>
                      <h1 className="text-lg font-semibold text-gray-900">
                        Season :{" "}
                        {developmentCycle?.season || "No season specified"}
                      </h1>
                    </div>
                    <div>
                      <h1 className="text-lg font-semibold text-gray-900">
                        Created On :{" "}
                        {developmentCycle?.created_at?.split("T")[0] ||
                          "Loading..."}
                      </h1>
                    </div>
                  </div>

                  {developmentCycle?.created_by && (
                    <div className="mt-4">
                      <h1 className="text-lg font-semibold text-gray-900">
                        Created by : {developmentCycle.created_by}
                      </h1>
                    </div>
                  )}
                </div>

                {/* Edit MSR Button on the right */}
                {developmentCycle?.can_edit && !isMobile && (
                  <button
                    onClick={handleEditSeasonClick}
                    className="bg-gradient-to-r cursor-pointer from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 flex-shrink-0"
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
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                      />
                    </svg>
                    Edit MSR
                  </button>
                )}
              </div>
            </div>

            <div className="border p-4 mt-4 bg-red-100">
              <div className="flex items-center justify-center">
                <h1 className="font-semibold text-lg uppercase">
                  Remark : {developmentCycle?.remarks || "No remarks"}
                </h1>
              </div>
            </div>
          </div>

          {/* Success/Error Alert */}
          {postApiResponse && (
            <div
              className={`text-center border-2 ${
                error
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-green-50 border-green-200 text-green-800"
              }  mb-6 relative`}
            >
              {error ? (
                <div className="p-4">
                  <div className="flex items-center justify-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <h1 className="font-semibold text-lg">Error: {error}</h1>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex items-center justify-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <h1 className="font-semibold text-lg">
                      Success: Action completed successfully!
                    </h1>
                  </div>
                </div>
              )}

              <button
                className="absolute top-2 right-2 cursor-pointer hover:bg-gray-100  p-1 transition-colors"
                onClick={cancelAlert}
              >
                <TiDeleteOutline size={24} />
              </button>
            </div>
          )}

          {/* style Section */}
          {loading ? (
            <Loading
              fullScreen={true}
              text="Please wait while we load your data..."
            />
          ) : (
            <div className="mb-8">
              <div className="bg-white shadow-sm p-4">
                {collections && collections.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        Style ({collections.length})
                      </h2>
                      <div className="flex gap-4 border px-2 py-2 rounded bg-gray-50">
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

                    {showLayout === "grid" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {collections.map((collection: CollectionEdit) => (
                          <div
                            key={collection.collection_id}
                            className="bg-white border border-gray-200 overflow-hidden transition-all duration-300 group hover:shadow-lg hover:border-blue-200"
                          >
                            <div className="p-6 flex flex-col h-full">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg text-gray-900 truncate">
                                  {collection.name}
                                </h3>

                                {collection.can_edit && !isMobile && (
                                  <button
                                    onClick={(e) =>
                                      handleEditClick(e, collection)
                                    }
                                    className="py-1 px-3 text-sm border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                                    title="Edit Collection"
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>

                              {collection.sampling_merchant && (
                                <div className="mb-3">
                                  <h2 className="text-xs font-medium text-black-500 uppercase tracking-wide">
                                    Sampling Merchant :{" "}
                                    {collection.sampling_merchant}
                                  </h2>
                                </div>
                              )}

                              {collection.collection_jc_number && (
                                <div className="mb-3">
                                  <h2 className="text-xs font-medium text-black-500 uppercase tracking-wide">
                                    JC Number :{" "}
                                    {collection.collection_jc_number}
                                  </h2>
                                </div>
                              )}

                              {collection.updated_by && (
                                <div className="mb-4">
                                  <h2 className="text-xs font-medium text-black-500 uppercase tracking-wide">
                                    Updated By : {collection?.updated_by}
                                  </h2>
                                </div>
                              )}

                              {collection.created_at && (
                                <div className="mb-4">
                                  <h2 className="text-xs font-medium text-black-500 uppercase tracking-wide">
                                    Created On :{" "}
                                    {collection.created_at
                                      .toString()
                                      .slice(0, 10)}
                                  </h2>
                                </div>
                              )}

                              <button
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium px-4 py-3 mt-auto transition-colors cursor-pointer shadow-md hover:shadow-lg"
                                onClick={() =>
                                  router.push(
                                    `/collection/protos/${collection.collection_id}`
                                  )
                                }
                              >
                                View Protos
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="overflow-x-auto bg-white border border-gray-200 shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Name
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
                            {collections.map((collection: CollectionEdit) => (
                              <tr
                                key={collection.collection_id}
                                className="hover:bg-blue-50 transition-colors duration-150"
                              >
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                  {collection.name}
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
                                    {collection.can_edit && !isMobile && (
                                      <button
                                        onClick={(e) =>
                                          handleEditClick(e, collection)
                                        }
                                        className="text-sm border border-gray-300 text-gray-700 hover:text-blue-600 hover:border-blue-400 px-3 py-1 rounded-md transition-colors cursor-pointer"
                                      >
                                        Edit
                                      </button>
                                    )}

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
                    )}
                  </div>
                ) : (
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
                      No Style yet
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Get started by creating your first Style for this MSR
                    </p>
                    {canAddNewCollection && (
                      <button
                        onClick={() => {
                          setEditCollection(null);
                          setModalShow(true);
                        }}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3  shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
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
                        Add First Style
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collection Modal - for adding/editing collections */}
      <CollectionModal
        isOpen={modalShow}
        error={error}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        editData={getEditDataForModal(editCollection)}
        loading={loading}
        merchants={merchants}
      />

      {/* Season Modal - for editing MSR/Season information */}
      <SeasonModal
        isOpen={seasonModalShow}
        onClose={handleSeasonModalClose}
        onSubmit={handleSeasonModalSubmit}
        editData={editSeason}
        loading={loading}
        error={error}
      />
    </>
  );
};

export default LayoutComponents(StylesPage);
