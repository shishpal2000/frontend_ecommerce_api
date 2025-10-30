"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import LayoutComponents from "@/app/layoutComponents";
import { useGeneralApiCall } from "@/services/useGeneralApiCall";
import { TiDeleteOutline } from "react-icons/ti";
import ProtoModel from "@/components/ProtoModel";
import CollectionModal from "@/components/CollectionModel";
import Loading from "@/components/Loding";

// Updated Proto type to match new API response
type Proto = {
  id: string;
  number: number;
  image?: string | null;
  is_protected: boolean;
  is_msr: boolean;
  status: string;
  sampling_merchant_id: string;
  sampling_merchant_name: string;
  can_change_proto_status: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
};

// New type for development cycles in the response
type DevelopmentCycleInfo = {
  development_cycle_id: string;
  development_cycle_name: string;
};

// New type for permissions
type Permissions = {
  can_modify_development_cycles: boolean;
  can_modify_collection: boolean;
  can_add_new_proto: boolean;
};

// New API response structure
type ProtoApiResponse = {
  collection_id: string;
  collection_name: string;
  sampling_merchant_id: string;
  sampling_merchant_name: string;
  jc_number?: string;
  collection_jc_number?: string;
  development_cycles: DevelopmentCycleInfo[];
  remarks: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  permissions: Permissions;
  protos: Proto[];
};

// Type for development cycles dropdown (existing)
type DevelopmentCycle = {
  development_cycle_id: string;
  name: string;
  year: number;
  season: string;
  remarks: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  can_edit: boolean;
};

// Type for merchants
type Merchant = {
  user_id: string;
  name: string;
};

// Type for collection edit data
type CollectionEdit = {
  collection_id: string;
  name: string;
  collection_jc_number?: string;
  sampling_merchant_id: string;
  development_cycle_id?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
};

const ProtosPage = () => {
  const router = useRouter();

  // Modal states
  const [modalShow, setModalShow] = useState(false); // For development cycle modal
  const [collectionModalShow, setCollectionModalShow] = useState(false); // For collection edit modal

  const [developmentCycles, setDevelopmentCycles] = useState<
    DevelopmentCycle[]
  >([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]); // Add merchants state
  const [editCollection, setEditCollection] = useState<CollectionEdit | null>(
    null
  ); // Add edit collection state

  const { styleId } = useParams();
  const { getApi, postApi } = useGeneralApiCall();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postApiResponse, setPostApiResponse] = useState(false);

  // Updated states to match new API response
  const [collectionData, setCollectionData] = useState<ProtoApiResponse | null>(
    null
  );
  const [protos, setProtos] = useState<Proto[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Updated getApiData function
  const getApiData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getApi<ProtoApiResponse>(`/proto/list/${styleId}`);

      // Set the complete collection data
      setCollectionData(data.data);

      // Extract protos array from the response
      setProtos(data.data?.protos || []);
    } catch (error: any) {
      setError(error.message || "Error fetching protos. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDevelopmentCycles = async () => {
    try {
      const data = await getApi<any>("/development-cycle/list/");

      // Handle the API response structure for development cycles
      if (data.data && data.data.development_cycles) {
        setDevelopmentCycles(data.data.development_cycles);
      } else if (Array.isArray(data.data)) {
        setDevelopmentCycles(data.data);
      } else {
        setDevelopmentCycles([]);
      }
    } catch (error) {
      setDevelopmentCycles([]);
    }
  };

  // Add fetchMerchants function
  const fetchMerchants = async () => {
    try {
      const data: any = await getApi(
        "/authentication/list-users/sampling-merchants/"
      );
      setMerchants(data?.data || []);
    } catch (error) {
      setMerchants([]);
    }
  };

  const postApiData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await postApi(`/proto/create/${styleId}/`, {});
      if (response.status === 201) {
        await getApiData(); // Refresh data
        setPostApiResponse(true);
        setTimeout(() => {
          setPostApiResponse(false);
        }, 5000);
      }
    } catch (error: any) {
      setError(error.message || "Failed to create protos");
      setPostApiResponse(true);
      setTimeout(() => {
        setPostApiResponse(false);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const cancelAlert = () => {
    setPostApiResponse(false);
    setError(null);
  };

  useEffect(() => {
    getApiData();
    fetchDevelopmentCycles();
    fetchMerchants();
  }, [styleId]);

  // Development cycle handlers
  const handleCreateCollection = async (collectionData: {
    development_cycle_id: string;
  }) => {
    try {
      const payload = {
        development_cycle_id: collectionData.development_cycle_id,
      };

      const response = await postApi(
        `/collection/add-development-cycle/${styleId}/`,
        payload
      );

      // Check for successful response
      if (response.status === 201 || response.status === 200) {
        await getApiData(); // Refresh protos list
        setModalShow(false);

        // Show success message
        setError(null);
        setPostApiResponse(true);
      }
    } catch (error: any) {
      setError(error.message || "Failed to add style. Please try again.");
      setPostApiResponse(true);
    }
  };

  // Collection edit handlers
  const handleEditCollectionClick = () => {
    if (collectionData) {
      setEditCollection({
        collection_id: collectionData.collection_id,
        name: collectionData.collection_name,
        collection_jc_number: collectionData.collection_jc_number,
        sampling_merchant_id: collectionData.sampling_merchant_id,
        remarks: collectionData.remarks,
        created_at: collectionData.created_at,
        updated_at: collectionData.updated_at,
      });
      setCollectionModalShow(true);
    }
  };

  const handleCollectionModalClose = () => {
    setCollectionModalShow(false);
    setEditCollection(null);
  };

  const handleUpdateCollection = async (collectionData: {
    name: string;
    sampling_merchant_id: string;
    collection_jc_number?: string;
    development_cycle_id?: string;
    remarks?: string;
  }) => {
    try {
      const payload = {
        name: collectionData.name,
        sampling_merchant_id: collectionData.sampling_merchant_id,
        jc_number: collectionData.collection_jc_number || "",
        remarks: collectionData.remarks || "",
      };

      await postApi(`/collection/update/${styleId}/`, payload);

      // Refresh collection data
      await getApiData();

      // Close modal and reset edit state
      setCollectionModalShow(false);
      setEditCollection(null);

      // Show success message
      setError(null);
      setPostApiResponse(true);
      setTimeout(() => {
        setPostApiResponse(false);
      }, 5000);
    } catch (error: any) {
      setError(
        error.message ||
          "Error updating collection information. Please try again."
      );
      setPostApiResponse(true);
      setTimeout(() => {
        setPostApiResponse(false);
      }, 5000);
    }
  };

  const handleCollectionModalSubmit = (collectionData: {
    name: string;
    sampling_merchant_id: string;
    collection_jc_number?: string;
    development_cycle_id?: string;
    remarks?: string;
  }) => {
    handleUpdateCollection(collectionData);
  };

  // Convert collection data to the format expected by modal
  const getEditDataForModal = (collection: CollectionEdit | null) => {
    if (!collection) return null;

    return {
      collection_id: collection.collection_id,
      name: collection.name,
      collection_jc_number: collection.collection_jc_number || "",
      sampling_merchant_id: collection.sampling_merchant_id,
      development_cycle_id: collection.development_cycle_id || "",
      remarks: collection.remarks || "",
      created_at: collection.created_at,
      updated_at: collection.updated_at,
    };
  };

  return (
    <>
      <div className="px-2 sm:px-4 py-6">
        {/* Header */}
        <div className="bg-white shadow-sm p-4 mb-8">
          {isMobile ? (
            <div>
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
                  Back
                </button>
              </div>

              <div className="mt-4 mb-4">
                <h1 className="text-3xl font-bold text-gray-900 uppercase">
                  Style Name :{" "}
                  {collectionData?.collection_name || name || "Collection"}
                </h1>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-6">
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
                  Back
                </button>
              </div>

              <div>
                <h1 className="text-3xl font-bold text-gray-900 uppercase">
                  Style Name :{" "}
                  {collectionData?.collection_name || name || "Collection"}
                </h1>
              </div>

              {/* Show Add Development Cycle button only if user has permission */}
              {collectionData?.permissions?.can_modify_development_cycles &&
                !isMobile && (
                  <button
                    onClick={() => setModalShow(true)}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
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
                    Add MSR Cycle
                  </button>
                )}
            </div>
          )}

          {/* Collection Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Collection Details */}
            <div className="text-gray-700 p-4 border border-dashed border-gray-300 bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg text-gray-900 uppercase">
                  Style Details
                </h3>

                {/* Edit Collection Button */}
                {collectionData?.permissions?.can_modify_collection &&
                  !isMobile && (
                    <button
                      onClick={handleEditCollectionClick}
                      className="bg-gradient-to-r cursor-pointer from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-4 py-2 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 flex-shrink-0"
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
                          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                        />
                      </svg>
                      Edit Style
                    </button>
                  )}
              </div>

              <div className="space-y-2">
                <p>
                  <span className="font-medium">Sampling Merchant:</span>{" "}
                  {collectionData?.sampling_merchant_name ||
                    "No sampling merchant"}
                </p>

                <p>
                  <span className="font-medium">JC Number:</span>{" "}
                  {collectionData?.collection_jc_number || "No JC Number"}
                </p>

                <p>
                  <span className="font-medium">Created On:</span>{" "}
                  {collectionData?.created_at?.split("T")[0]}
                </p>
                <p>
                  <span className="font-medium">Created By:</span>{" "}
                  {collectionData?.created_by}
                </p>
              </div>
            </div>

            {/* Development Cycles */}
            <div className="text-gray-700 p-4 border border-dashed border-gray-300 bg-blue-50">
              <h3 className="font-semibold text-lg mb-3 text-gray-900 uppercase">
                MSR Cycles
              </h3>
              <div className="space-y-2 ">
                {collectionData?.development_cycles?.map((cycle) => (
                  <div
                    key={cycle.development_cycle_id}
                    className=" p-2 border bg-red-200"
                  >
                    <p className="font-medium ">
                      {cycle.development_cycle_name}
                    </p>
                  </div>
                )) || (
                  <p className="text-gray-500">No MSR Cycle cycles assigned</p>
                )}
              </div>
            </div>
          </div>

          <div className="border p-4 mt-4 bg-red-100">
            <div className="flex items-center justify-center">
              <h1 className="font-semibold text-lg uppercase">
                Remark : {collectionData?.remarks || "No remarks"}
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
            } mb-6 relative`}
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
              className="absolute top-2 right-2 cursor-pointer hover:bg-gray-100 p-1 transition-colors"
              onClick={cancelAlert}
            >
              <TiDeleteOutline size={24} />
            </button>
          </div>
        )}

        {/* Protos Section */}
        <div className="bg-white shadow-sm p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 uppercase">
              Proto Variations ({protos.length})
            </h2>

            <div className="flex gap-2">
              {collectionData?.permissions?.can_add_new_proto && !isMobile && (
                <button
                  onClick={() => router.push(`/add-style-comment/${styleId}/`)}
                  className="bg-gradient-to-r text-white bg-blue-400  font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  View Style Comments
                </button>
              )}

              {/* Show Add Proto button only if user has permission */}
              {collectionData?.permissions?.can_add_new_proto && !isMobile && (
                <button
                  onClick={postApiData}
                  className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer"
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
                  Add New Proto
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <Loading fullScreen={true} text="Loading protos..." />
          ) : protos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {protos.map((proto: any) => (
                <div
                  key={proto.id}
                  className="border border-black-500 shadow-sm hover:shadow-md transition-shadow p-4 bg-white"
                >
                  <div className="w-full flex justify-between mb-4">
                    <div>
                      <p className="font-semibold text-gray-900 text-lg ">
                        Proto # {proto.number}
                      </p>

                      <p className="font-semibold text-gray-900 text-lg ">
                        QR NUMBER : {proto.qr_number}
                      </p>

                      <p className="text-sm text-gray-600 mb-4">
                        Status:{" "}
                        <span className="font-medium">
                          {proto.status.replace("_", " ")}
                        </span>
                      </p>
                    </div>
                    <div className="w-20 h-20 border border-gray-300 overflow-hidden px-1">
                      <img
                        src={proto.qr_image}
                        alt={`QR Code ${proto.number}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="aspect-square bg-gray-100 mb-3 overflow-hidden">
                      {proto.image ? (
                        <img
                          src={proto.image}
                          alt={`Proto ${proto.number}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg
                            className="w-12 h-12"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    <button
                      className="bg-blue-500 text-white w-full p-2 cursor-pointer"
                      onClick={() =>
                        router.push(`/collection/proto-detail/${proto.id}`)
                      }
                    >
                      Open Proto Detail
                    </button>
                  </div>
                </div>
              ))}
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
                No protos yet
              </h3>
              <p className="text-gray-500 mb-6">
                Get started by creating your first proto for this collection
              </p>
              {collectionData?.permissions?.can_add_new_proto && (
                <button
                  onClick={postApiData}
                  className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
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
                  Add First Proto
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ProtoModel for adding development cycles */}
      <ProtoModel
        isOpen={modalShow}
        onClose={() => setModalShow(false)}
        onSubmit={handleCreateCollection}
        loading={loading}
        developmentCycles={developmentCycles}
        errorMessage={error}
      />

      {/* CollectionModal for editing collection information */}
      <CollectionModal
        isOpen={collectionModalShow}
        onClose={handleCollectionModalClose}
        onSubmit={handleCollectionModalSubmit}
        editData={getEditDataForModal(editCollection)}
        loading={loading}
        merchants={merchants}
        error={error}
      />
    </>
  );
};

export default LayoutComponents(ProtosPage);
