"use client";

import LayoutComponents from "@/app/layoutComponents";
import { useRouter, useParams } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { useGeneralApiCall } from "@/services/useGeneralApiCall";
import {
  GetProtoDetailsResponse,
  MasterJiSectionData,
  MerchantSectionData,
} from "@/types/Proto-Details";
import axios, { AxiosError } from "axios";
import ProtoDetailsPrint from "@/components/ProtoDetailsPrint";
import {
  GetEfficiencyTypesResponse,
  GetNeedleTypesResponse,
  GetOverlockTypesResponse,
  TypeItem,
} from "@/app/type_management/page";
import QrPrintModal from "@/app/QRprintModal";
import { formatTime12Hour } from "./ProtoDetailComponent";

const getEmptyMasterJiDetails = (): MasterJiSectionData => ({
  master_ji_section_id: "",
  stitch_time: null,
  stitch_cost: null,
  cut_cost: null,
  gross_weight: null,
  gross_weight_unit: "grams",
  tuka_file: null,
  extra_data: {
    flat_lock: [],
    needle_type: [],
    overlock_type: [],
    efficiency_type: [],
  },
  created_at: "",
  updated_at: "",
  created_by: "",
  updated_by: "",
  created_by_id: "",
  updated_by_id: "",
});

interface MasterUserResponse {
  user_id: string;
  name: string;
  email: string;
  role: string;
  role_id: string;
  username: string;
}

const ProtoDetailPage = () => {
  const router = useRouter();
  const [phoneResize, setPhoneResize] = useState(false);

  const { getApi, postApi } = useGeneralApiCall();
  const [status, setStatus] = useState<Array<[string, string]>>([]);

  const { protoid: protoId } = useParams();

  const [showPrintView, setShowPrintView] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Store current proto data
  const [protoData, setProtoData] = useState<GetProtoDetailsResponse | null>(
    null
  );

  const [merchantDetails, setMerchantDetails] =
    useState<MerchantSectionData | null>(null);
  const [masterJiDetails, setMasterJiDetails] =
    useState<MasterJiSectionData | null>(null);

  // Store previous proto data
  const prevProtoId = protoData?.proto?.previous_proto?.previous_proto_id;
  // const [prevProtoData, setPrevProtoData] =
  //   useState<GetProtoDetailsResponse | null>(null);

  const [merchantDetailsPrevProto, setMerchantDetailsPrevProto] =
    useState<MerchantSectionData | null>(null);
  const [masterJiDetailsPrevProto, setMasterJiDetailsPrevProto] =
    useState<MasterJiSectionData | null>(null);

  const [isMerchantEditMode, setIsMerchantEditMode] = useState(false);
  const [isMasterJiEditMode, setIsMasterJiEditMode] = useState(false);

  const isMerchantSectionCreated = !!merchantDetails?.merchant_section_id;
  const isMasterJiSectionCreated = !!masterJiDetails?.master_ji_section_id;

  const [protoImage, setProtoImage] = useState<File | null>(null);
  const [protoImagePreview, setProtoImagePreview] = useState<string | null>(
    null
  );

  const [tukFileObject, setTukFileObject] = useState<File | null>(null);

  const [needleTypeRows, setNeedleTypeRows] = useState(2);
  const [tukaEfficiencyRows, setTukaEfficiencyRows] = useState(2);
  const [flatLockRows, setFlatLockRows] = useState(2);

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showCopySuccessMessage, setShowCopySuccessMessage] = useState(false);

  const [selectedOverlockType, setSelectedOverlockType] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isPrevProtoLoading, setIsPrevProtoLoading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isImageuploadSuccess, setIsImageuploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sectionErrors, setSectionErrors] = useState({
    merchant: null as string | null,
    masterji: null as string | null,
  });

  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [cutMasterOptions, setCutMasterOptions] = useState<
    MasterUserResponse[]
  >([]);
  const [patternMasterOptions, setPatternMasterOptions] = useState<
    MasterUserResponse[]
  >([]);
  const [needleTypeOptions, setNeedleTypeOptions] = useState<TypeItem[]>([]);
  const [overlockTypeOptions, setOverlockTypeOptions] = useState<TypeItem[]>(
    []
  );
  const [efficiencyTypeOptions, setEfficiencyTypeOptions] = useState<
    TypeItem[]
  >([]);
  const [folderType, setFolderType] = useState<string[]>(
    Array(flatLockRows).fill("")
  );
  const [qrprintmodal, setQrprintmodal] = useState(false);
  // Modal states
  const [photoModal, setPhotoModal] = useState<{
    isOpen: boolean;
    imageUrl: string | null;
  }>({
    isOpen: false,
    imageUrl: null,
  });

  useLayoutEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setPhoneResize(true);
      } else {
        setPhoneResize(false);
      }
    };

    window.addEventListener("resize", handleResize);

    handleResize(); // Initial check

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getPrevProtoDetails = useCallback(
    async (proto_id: string) => {
      setIsPrevProtoLoading(true);
      try {
        const response = await getApi<GetProtoDetailsResponse>(
          `/proto/get-details/${proto_id}`
        );
        if (response.status === 200) {
          if (response.data?.proto) {
            // Handle extra_data structure
            const merchantData = response.data.proto.merchant_section_data;
            const masterData = response.data.proto.master_ji_section_data;

            // Make sure we have an extra_data object if missing
            if (masterData && !masterData.extra_data) {
              masterData.extra_data = {
                flat_lock: [],
                needle_type: [],
                overlock_type: [],
                efficiency_type: [],
              };
            }

            setMerchantDetailsPrevProto(merchantData);
            setMasterJiDetailsPrevProto(masterData);
          }
        }
      } catch (error) {
        console.error("Error fetching proto details:", error);
      } finally {
        setIsPrevProtoLoading(false);
      }
    },
    [getApi]
  );

  const getProtoDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getApi<GetProtoDetailsResponse>(
        `/proto/get-details/${protoId}`
      );
      if (response.status === 200) {
        setProtoData(response.data);

        if (response.data?.proto) {
          setMerchantDetails(response.data.proto.merchant_section_data);

          // Handle extra_data structure
          const masterData = response.data.proto.master_ji_section_data;
          if (masterData && !masterData.extra_data) {
            masterData.extra_data = {
              flat_lock: [],
              needle_type: [],
              overlock_type: [],
              efficiency_type: [],
            };
          }
          setMasterJiDetails(masterData);
          setProtoImagePreview(response.data.proto.image);
        }
      }
    } catch (error) {
      console.error("Error fetching proto details:", error);
      setError("Failed to load proto details. Please try refreshing the page.");
    } finally {
      setIsLoading(false);
    }
  }, [getApi, protoId]);

  // Update the API call function
  useEffect(() => {
    (async () => {
      try {
        const data = await getApi<[data: [string, string]]>(
          `/proto/status-choices/`
        );

        if (data.status === 200 && data.data) {
          setStatus(data.data); // data.data is the array of [key, value] tuples
        } else {
          console.error("Failed to fetch status");
          setStatus([]);
        }
      } catch (error) {
        console.error("Error fetching status:", error);
        setStatus([]);
      }
    })();

    getProtoDetails();

    // get master options
    (async () => {
      try {
        const res = await getApi<MasterUserResponse[]>(
          `/authentication/list-users/master-jis/`
        );
        setCutMasterOptions(res.data);
        setPatternMasterOptions(res.data);
      } catch (error) {
        console.error("Error fetching cut masters:", error);
        setCutMasterOptions([]);
      }
    })();

    // fetch needle types
    (async () => {
      try {
        const res = await getApi<GetNeedleTypesResponse>(
          `/proto/needle-type/list/`
        );
        setNeedleTypeOptions(res.data.needle_types || []);
      } catch (error) {
        console.error("Error fetching needle types:", error);
      }
    })();

    // Fetch overlock types
    (async () => {
      try {
        const response = await getApi<GetOverlockTypesResponse>(
          "/proto/overlock-type/list/"
        );
        if (response.status === 200) {
          setOverlockTypeOptions(response.data.overlock_types || []);
        }
      } catch (error) {
        console.error("Error fetching overlock types:", error);
      }
    })();

    // Fetch efficiency types
    (async () => {
      try {
        const response = await getApi<GetEfficiencyTypesResponse>(
          "/proto/efficiency-type/list/"
        );
        if (response.status === 200) {
          setEfficiencyTypeOptions(response.data.efficiency_types || []);
        }
      } catch (error) {
        console.error("Error fetching efficiency types:", error);
      }
    })();
  }, [getApi, protoId, getProtoDetails]);

  useEffect(() => {
    if (prevProtoId && typeof protoId === "string" && prevProtoId !== protoId) {
      getPrevProtoDetails(prevProtoId);
    }
  }, [prevProtoId, protoId, getPrevProtoDetails]);

  // Handle form save
  const handleSaveMerchantSection = async (
    e?: React.FormEvent,
    updateCall?: boolean
  ) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSectionErrors((prev) => ({ ...prev, merchant: null }));

    const payload = {
      date_started: merchantDetails?.date_started || null,
      date_end: merchantDetails?.date_end || null,
      time_start: merchantDetails?.time_start || null,
      time_end: merchantDetails?.time_end || null,
      pattern_master_id: merchantDetails?.pattern_master_id || "",
      cutting_master_id: merchantDetails?.cutting_master_id || "",
      tailor: merchantDetails?.tailor || "",
      pattern_parts_total: merchantDetails?.pattern_parts_total || null,
    };

    try {
      const endpoint =
        updateCall && merchantDetails?.merchant_section_id
          ? `/proto/update/merchant-section/${protoId}/`
          : `/proto/create/merchant-section/${protoId}/`;

      const response = await postApi(endpoint, payload);

      await getProtoDetails();

      if (response.status === 200 || response.status === 201) {
        setIsMerchantEditMode(false);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      }
    } catch (error) {
      console.error("Error saving details:", error);
      let message = "Failed to save details. Please try again.";

      if (error instanceof AxiosError) {
        message = error.response?.data?.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }

      setSectionErrors((prev) => ({ ...prev, merchant: message }));
    } finally {
      setIsSaving(false);
    }
  };

  // Handle master ji section save
  const handleSaveMasterJiSection = async (
    e?: React.FormEvent,
    updateCall?: boolean
  ) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSectionErrors((prev) => ({ ...prev, masterji: null }));

    try {
      const formData = new FormData();

      // Add basic fields
      formData.append("stitch_time", masterJiDetails?.stitch_time || "");
      formData.append(
        "stitch_cost",
        masterJiDetails?.stitch_cost?.toString() || ""
      );
      formData.append("cut_cost", masterJiDetails?.cut_cost?.toString() || "");
      formData.append(
        "gross_weight",
        masterJiDetails?.gross_weight?.toString() || ""
      );
      formData.append(
        "gross_weight_unit",
        masterJiDetails?.gross_weight_unit || ""
      );

      // Add Tuka file if exists
      if (tukFileObject) {
        formData.append("tuka_file", tukFileObject);
      }

      // Convert extra_data to JSON string and append
      const extraData = {
        flat_lock: masterJiDetails?.extra_data?.flat_lock || [],
        efficiency_type: masterJiDetails?.extra_data?.efficiency_type || [],
        overlock_type: masterJiDetails?.extra_data?.overlock_type || [],
        needle_type: masterJiDetails?.extra_data?.needle_type || [],
      };

      formData.append("extra_data", JSON.stringify(extraData));

      const endpoint =
        updateCall && masterJiDetails?.master_ji_section_id
          ? `/proto/update/master-ji-section/${protoId}/`
          : `/proto/create/master-ji-section/${protoId}/`;

      // const response = await postApi(endpoint, formData);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      await getProtoDetails();

      if (response.status === 200 || response.status === 201) {
        setIsMasterJiEditMode(false);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      }
    } catch (error) {
      console.error("Error saving master ji details:", error);
      let message = "Failed to save master ji details. Please try again.";

      if (error instanceof AxiosError) {
        message = error.response?.data?.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }

      setSectionErrors((prev) => ({
        ...prev,
        masterji: message,
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleProtoImageUpload = async () => {
    setIsImageUploading(true);
    try {
      const formData = new FormData();
      if (protoImage) {
        formData.append("image", protoImage);
      }
      const response = await postApi(
        `/proto/update/image/${protoId}/`,
        formData
      );

      if (response.status === 200 || response.status === 201) {
        setIsImageuploadSuccess(true);
      }
    } catch (error) {
      console.error("Error uploading proto image:", error);

      let message = "Failed to upload image. Please try again.";
      if (error instanceof AxiosError) {
        message = error.response?.data?.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }

      setError(message);
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newStatus = e.target.value;

    if (!newStatus || !protoData?.proto?.permission?.can_update_status) {
      return;
    }

    setIsStatusUpdating(true);
    setStatusUpdateMessage(null);

    try {
      const response = await postApi(`/proto/change-status/${protoId}/`, {
        status: newStatus,
      });

      if (response.status === 200) {
        setStatusUpdateMessage({
          type: "success",
          message: "Proto status updated successfully",
        });

        // Refresh proto data to get the updated status
        await getProtoDetails();

        // Clear success message after 3 seconds
        setTimeout(() => {
          setStatusUpdateMessage(null);
        }, 3000);
      }
    } catch (error) {
      console.error("Error updating proto status:", error);
      let errorMessage = "Failed to update proto status.";

      if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setStatusUpdateMessage({
        type: "error",
        message: errorMessage,
      });
    } finally {
      setIsStatusUpdating(false);
    }
  };

  // Handle form cancel/reset
  const handleCancel = (section: string) => {
    if (section === "merchant") {
      // Reset merchant section
      const merchantSection = protoData?.proto?.merchant_section_data;
      const originalMerchant = merchantSection ? { ...merchantSection } : null;
      setMerchantDetails(originalMerchant);
    } else {
      // Reset master ji section
      const masterJiSection = protoData?.proto?.master_ji_section_data;
      const originalMasterJi = masterJiSection ? { ...masterJiSection } : null;
      setMasterJiDetails(originalMasterJi);
      setTukFileObject(null);
      setMasterJiDetails((prev) =>
        prev ? { ...prev, tuka_file: null } : null
      );
    }
  };

  // Handle adding fabrics/trims/accessory
  const handleAddFabrics = () => {
    const currentProtoId = Array.isArray(protoId)
      ? protoId.join("-")
      : protoId || "proto-1";
    const protoName = currentProtoId;
    router.push(`/material-page/${encodeURIComponent(currentProtoId)}`);
  };

  // Handle copying data from previous proto
  const handleCopyMerchantFromPreviousProto = () => {
    if (!prevProtoId) {
      setSectionErrors((prev) => ({
        ...prev,
        merchant: "No previous proto found to copy from.",
      }));
      return;
    }

    if (merchantDetailsPrevProto) {
      const { ...rest } = merchantDetailsPrevProto;
      setMerchantDetails({
        ...rest,
        merchant_section_id: "",
        created_at: "",
        updated_at: "",
        created_by: "",
        updated_by: "",
        created_by_id: "",
        updated_by_id: "",
      });
      setShowCopySuccessMessage(true);
      setTimeout(() => setShowCopySuccessMessage(false), 3000);
    }
  };

  const handleCopyMasterJiFromPreviousProto = () => {
    if (!prevProtoId) {
      setSectionErrors((prev) => ({
        ...prev,
        masterji: "No previous proto found to copy from.",
      }));
      return;
    }

    if (masterJiDetailsPrevProto) {
      const { ...rest } = masterJiDetailsPrevProto;
      setMasterJiDetails({
        ...rest,
        master_ji_section_id: "",
        created_at: "",
        updated_at: "",
        created_by: "",
        updated_by: "",
        created_by_id: "",
        updated_by_id: "",
      });
      setShowCopySuccessMessage(true);
      setTimeout(() => setShowCopySuccessMessage(false), 3000);
    }
  };

  const handleSeeComments = () => {
    const currentProtoId = Array.isArray(protoId)
      ? protoId.join("-")
      : protoId || "proto-1";
    router.push(`/comments?protoId=${encodeURIComponent(currentProtoId)}`);
  };

  const handleSeeSpecs = () => {
    const currentProtoId = Array.isArray(protoId)
      ? protoId.join("-")
      : protoId || "proto-1";
    router.push(`/specs-diff?protoId=${encodeURIComponent(currentProtoId)}`);
  };

  const openPhotoModal = (imageUrl: string) => {
    setPhotoModal({
      isOpen: true,
      imageUrl,
    });
    document.body.style.overflow = "hidden";
  };

  const closePhotoModal = () => {
    setPhotoModal({
      isOpen: false,
      imageUrl: null,
    });
    document.body.style.overflow = "unset";
  };

  // Photo Modal Component
  const PhotoModal = () => {
    if (!photoModal.isOpen || !photoModal.imageUrl) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
        <div className="relative max-w-4xl max-h-full p-4">
          <button
            onClick={closePhotoModal}
            className="absolute top-2 right-2 z-10 bg-red-400 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
          >
            ×
          </button>

          <img
            src={photoModal.imageUrl}
            alt={`Fabric photo`}
            className="max-w-[500px] max-h-[80%] object-contain"
          />
        </div>
      </div>
    );
  };

  if (showPrintView) {
    return (
      <ProtoDetailsPrint
        protoData={protoData!}
        setShowPrintView={setShowPrintView}
      />
    );
  }

  // Show a loader until phoneResize is determined
  if (phoneResize === null) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      {phoneResize ? (
        <div className="w-full mx-auto p-4 bg-gray-50 min-h-screen">
          {/* Header Card */}
          <div className="bg-white  shadow-sm mb-4 overflow-hidden">
            {/* Back Button Header */}
            <div className="bg-sky-500 p-4">
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="font-medium">Back</span>
              </button>
            </div>

            {/* Proto Information */}
            <div className="p-4">
              <div className="text-center mb-4">
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  {protoData?.collection?.collection_name}
                </h1>
                <h2 className="text-xl font-bold  text-red-500">
                  Sampling Merchant :{" "}
                  {protoData?.collection?.sampling_merchant_name}
                </h2>

                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Proto #:</span>{" "}
                    {protoData?.proto?.proto_number}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">QR Code:</span>{" "}
                    {protoData?.proto?.qr_code}
                  </p>
                </div>
              </div>

              {/* Proto Image if available */}
              {protoData?.proto?.image && (
                <div className="flex justify-center mb-4">
                  <img
                    src={protoData.proto.image}
                    alt="Proto"
                    className="w-24 h-32 object-cover  border border-gray-200"
                    onClick={() => openPhotoModal(protoData.proto.image!)}
                  />
                </div>
              )}

              {/* Status Dropdown */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proto Status
                </label>
                <div className="relative">
                  <select
                    value={protoData?.proto?.proto_status || ""}
                    onChange={handleStatusChange}
                    disabled={
                      isStatusUpdating ||
                      !protoData?.proto?.permission?.can_update_status
                    }
                    className={`w-full px-3 py-2 border border-gray-300  text-sm ${
                      protoData?.proto?.permission?.can_update_status
                        ? "cursor-pointer"
                        : "cursor-not-allowed opacity-75"
                    }`}
                  >
                    <option value="">Select Status</option>
                    {status?.map((statusItem, index) => (
                      <option key={index} value={statusItem[0]}>
                        {statusItem[1]}
                      </option>
                    ))}
                  </select>
                </div>
                {statusUpdateMessage && (
                  <div
                    className={`mt-2 p-2 text-xs  ${
                      statusUpdateMessage.type === "success"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {statusUpdateMessage.message}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Development Cycles Card */}
          <div className="bg-white  shadow-sm mb-4 p-4">
            <h3 className="font-semibold text-lg text-gray-900 mb-3 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-sky-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              MSR Cycles
            </h3>
            <div className="space-y-2">
              {protoData?.development_cycles?.map((cycle) => (
                <div
                  key={cycle?.development_cycle_id}
                  className="bg-blue-50 border border-blue-200  p-3"
                >
                  <p className="font-medium text-blue-900 capitalize">
                    {cycle?.development_cycle_name}
                  </p>
                </div>
              )) || (
                <div className="bg-gray-50 border border-gray-200 p-3">
                  <p className="text-gray-500 text-center">
                    No development cycles assigned
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Style Remarks Card */}
          {protoData?.collection?.remarks && (
            <div className="bg-white  shadow-sm mb-4 p-4">
              <h3 className="font-semibold text-lg text-gray-900 mb-3 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z"
                  />
                </svg>
                Style Remarks
              </h3>
              <div className="bg-amber-50 border border-amber-200  p-3">
                <p className="text-amber-800">{protoData.collection.remarks}</p>
              </div>
            </div>
          )}

          {/* Quick Actions Card */}
          <div className="bg-white  shadow-sm mb-4 p-4">
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={handleSeeComments}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium py-3 px-4 transition-colors flex items-center justify-center gap-2 cursor-pointer"
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
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                View Comments
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border border-gray-200 p-4 mb-4 bg-white">
            {/* Right Side */}
            <div className="space-y-4">
              <div className="flex items-center justify-center text-2xl font-semibold">
                STYLE DETAILS
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DATE START <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={merchantDetails?.date_started || ""}
                  onChange={(e) =>
                    setMerchantDetails((prev) => {
                      if (!prev) return null;
                      const newStart = e.target.value;

                      const newEnd =
                        prev.date_end && newStart && prev.date_end < newStart
                          ? ""
                          : prev.date_end;
                      return {
                        ...prev,
                        date_started: newStart,
                        date_end: newEnd,
                      };
                    })
                  }
                  disabled={isMerchantSectionCreated && !isMerchantEditMode}
                  className="w-full border border-gray-300  px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* DATE END */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DATE END <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={merchantDetails?.date_end || ""}
                  onChange={(e) =>
                    setMerchantDetails((prev) => {
                      if (!prev) return null;
                      const newEnd = e.target.value;
                      // If new end date is before start date, clear it
                      if (prev.date_started && newEnd < prev.date_started) {
                        return {
                          ...prev,
                          date_end: "",
                        };
                      }
                      return {
                        ...prev,
                        date_end: newEnd,
                      };
                    })
                  }
                  min={merchantDetails?.date_started || ""}
                  disabled={isMerchantSectionCreated && !isMerchantEditMode}
                  className="w-full border border-gray-300  px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {merchantDetails?.date_end &&
                  merchantDetails?.date_started &&
                  merchantDetails.date_end < merchantDetails.date_started && (
                    <div className="text-xs text-red-500 mt-1">
                      End date cannot be before start date.
                    </div>
                  )}
              </div>

              {/* PATTERN MASTER */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PATTERN MASTER <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={merchantDetails?.pattern_master_id || ""}
                  onChange={(e) =>
                    setMerchantDetails((prev) =>
                      prev
                        ? {
                            ...prev,
                            pattern_master_id: e.target.value,
                          }
                        : null
                    )
                  }
                  disabled={isMerchantSectionCreated && !isMerchantEditMode}
                  className="w-full border border-gray-300  px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option className="text-gray-700" value="">
                    Select Pattern Master
                  </option>
                  {patternMasterOptions?.map((master) => (
                    <option
                      key={master.user_id}
                      className="text-gray-700"
                      value={master.user_id}
                    >
                      {master.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* CUT MASTER */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CUT MASTER <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={merchantDetails?.cutting_master_id || ""}
                  onChange={(e) =>
                    setMerchantDetails((prev) =>
                      prev
                        ? {
                            ...prev,
                            cutting_master_id: e.target.value,
                          }
                        : null
                    )
                  }
                  disabled={isMerchantSectionCreated && !isMerchantEditMode}
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option className="text-gray-700" value="">
                    Select Cut Master
                  </option>
                  {cutMasterOptions?.map((master) => (
                    <option
                      key={master.user_id}
                      className="text-gray-700"
                      value={master.user_id}
                    >
                      {master.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* TAILOR */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TAILOR <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={merchantDetails?.tailor || ""}
                  onChange={(e) =>
                    setMerchantDetails((prev) =>
                      prev
                        ? {
                            ...prev,
                            tailor: e.target.value,
                          }
                        : null
                    )
                  }
                  disabled={isMerchantSectionCreated && !isMerchantEditMode}
                  className="w-full border border-gray-300  px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Enter tailor name"
                />
              </div>
            </div>
            {/* Left Side */}
            <div className="space-y-4">
              {/* TIME START */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TIME START <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={merchantDetails?.time_start || ""}
                  onChange={(e) =>
                    setMerchantDetails((prev) =>
                      prev
                        ? {
                            ...prev,
                            time_start: e.target.value,
                          }
                        : null
                    )
                  }
                  disabled={isMerchantSectionCreated && !isMerchantEditMode}
                  className="w-full border border-gray-300  px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {merchantDetails?.time_start && (
                  <div className="text-xs text-gray-500 mt-1">
                    {formatTime12Hour(merchantDetails.time_start)}
                  </div>
                )}
              </div>

              {/* TIME END - NOT REQUIRED */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TIME END
                </label>
                <input
                  type="time"
                  value={merchantDetails?.time_end || ""}
                  onChange={(e) =>
                    setMerchantDetails((prev) =>
                      prev
                        ? {
                            ...prev,
                            time_end: e.target.value,
                          }
                        : null
                    )
                  }
                  disabled={isMerchantSectionCreated && !isMerchantEditMode}
                  className="w-full border border-gray-300  px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {merchantDetails?.time_end && (
                  <div className="text-xs text-gray-500 mt-1">
                    {formatTime12Hour(merchantDetails.time_end)}
                  </div>
                )}
              </div>

              {/* PATTERN PARTS TOTAL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PATTERN PARTS TOTAL <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={"0"}
                  step={"1"}
                  required
                  value={merchantDetails?.pattern_parts_total || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (
                      /^\d*$/.test(val) &&
                      (val === "" || parseInt(val, 10) >= 0)
                    ) {
                      setMerchantDetails((prev) =>
                        prev
                          ? {
                              ...prev,
                              pattern_parts_total: Number(val),
                            }
                          : null
                      );
                    }
                  }}
                  disabled={isMerchantSectionCreated && !isMerchantEditMode}
                  className="w-full border border-gray-300  px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Enter total pattern parts"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border border-gray-200 p-4 mb-4 bg-white">
            {/* Left Side - Production Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-center text-2xl font-semibold">
                MASTER JI DETAILS
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stitch Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={masterJiDetails?.stitch_time || ""}
                  onChange={(e) =>
                    setMasterJiDetails((prev) =>
                      prev
                        ? {
                            ...prev,
                            stitch_time: e.target.value,
                          }
                        : null
                    )
                  }
                  disabled={isMasterJiSectionCreated && !isMasterJiEditMode}
                  className="w-full border border-gray-300  px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="e.g., 2 hours, 30 minutes"
                />
              </div>

              {/* Stitch Cost */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stitch Cost <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={masterJiDetails?.stitch_cost || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*\.?\d{0,2}$/.test(val)) {
                      setMasterJiDetails((prev) =>
                        prev
                          ? {
                              ...prev,
                              stitch_cost: Number(val),
                            }
                          : null
                      );
                    }
                  }}
                  disabled={isMasterJiSectionCreated && !isMasterJiEditMode}
                  className="w-full border border-gray-300  px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Enter stitch cost"
                />
              </div>

              {/* Cut Cost */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cut Cost <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={masterJiDetails?.cut_cost || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*\.?\d{0,2}$/.test(val)) {
                      setMasterJiDetails((prev) =>
                        prev
                          ? {
                              ...prev,
                              cut_cost: Number(val),
                            }
                          : null
                      );
                    }
                  }}
                  disabled={isMasterJiSectionCreated && !isMasterJiEditMode}
                  className="w-full border border-gray-300  px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Enter cutting cost"
                />
              </div>

              <div></div>
            </div>
          </div>

          {/* QR Code Card (if available) */}
          {protoData?.proto?.qr_image && (
            <div className="bg-white rounded-lg shadow-sm mb-4 p-4">
              <h3 className="font-semibold text-lg text-gray-900 mb-3 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
                QR Code
              </h3>
              <div className="flex justify-center">
                <img
                  src={protoData.proto.qr_image}
                  alt="QR Code"
                  className="w-full object-contain border border-gray-200 "
                />
              </div>
            </div>
          )}

          {/* Success Messages */}
          {showSuccessMessage && (
            <div className="fixed top-4 left-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
              Details saved successfully!
            </div>
          )}

          {showCopySuccessMessage && (
            <div className="fixed top-4 left-4 right-4 z-50 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-lg">
              Data filled successfully from previous proto!
            </div>
          )}
        </div>
      ) : (
        <div className="w-full mx-auto px-4 py-6 ">
          {/* Page Loading State */}
          {isLoading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-lg font-medium text-gray-700">
                  Loading proto details...
                </p>
              </div>
            </div>
          )}

          {/* Page Error State */}
          {error && (
            <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <div className="flex items-center">
                <svg
                  className="w-6 h-6 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </div>
              <button
                onClick={() => {
                  setError(null);
                  getProtoDetails();
                }}
                className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Header */}
          <div className="bg-white p-6 mb-8 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <button
                onClick={() => window.history.back()}
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
              <div className="flex flex-1 justify-between items-start">
                <div className="flex flex-col items-center flex-1 gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {protoData?.collection?.collection_name}
                  </h1>
                  <h2 className="text-xl font-bold  text-red-500">
                    Sampling Merchant :{" "}
                    {protoData?.collection?.sampling_merchant_name}
                  </h2>
                  <p className="text-lg text-gray-500">
                    Proto #{protoData?.proto?.proto_number}
                  </p>
                  <p className="text-lg text-gray-500">
                    QR Code: {protoData?.proto?.qr_code}
                  </p>
                </div>
                <div className="flex gap-4 max-w-[40%] align-baseline text-gray-700 p-4 border border-dashed border-gray-300 bg-blue-50">
                  <h3 className="font-semibold text-lg mb-3 text-gray-900 uppercase">
                    MSR Cycles
                  </h3>
                  <div className="space-y-2">
                    {protoData?.development_cycles?.map((cycle) => (
                      <div
                        key={cycle?.development_cycle_id}
                        className="p-2 border bg-red-200"
                      >
                        <p className="font-medium capitalize">
                          {cycle?.development_cycle_name}
                        </p>
                      </div>
                    )) || (
                      <p className="text-gray-500">
                        No development cycles assigned
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPrintModal(true)}
                className="bg-sky-500 hover:bg-sky-600 text-white font-medium px-4 py-2 transition-colors cursor-pointer"
                title="Print this proto"
              >
                Print Management
              </button>
              <button
                onClick={handleAddFabrics}
                className="bg-sky-500 hover:bg-sky-600 text-white font-medium px-4 py-2 transition-colors cursor-pointer"
                title="Browse and add materials from the materials library"
              >
                Manage Materials
              </button>
              <button
                onClick={handleSeeSpecs}
                className="px-4 py-2 border cursor-pointer bg-sky-500 text-white hover:bg-sky-600 transition-colors"
                title="View and manage comments for this proto"
              >
                Specs
              </button>
              <button
                onClick={handleSeeComments}
                className="px-4 py-2 border cursor-pointer bg-sky-500 text-white hover:bg-sky-600 transition-colors"
                title="View and manage comments for this proto"
              >
                Comments
              </button>

              <div className="relative">
                {statusUpdateMessage && (
                  <div
                    className={`absolute right-0 top-full mt-2 p-2 text-sm rounded z-10 ${
                      statusUpdateMessage.type === "success"
                        ? "bg-green-100 text-green-800 border border-green-300"
                        : "bg-red-100 text-red-800 border border-red-300"
                    }`}
                  >
                    {statusUpdateMessage.message}
                  </div>
                )}

                <select
                  name="lock-proto"
                  id="lock-proto"
                  value={protoData?.proto?.proto_status || ""}
                  onChange={handleStatusChange}
                  disabled={
                    isStatusUpdating ||
                    !protoData?.proto?.permission?.can_update_status
                  }
                  className={`px-2 py-2 border ${
                    protoData?.proto?.permission?.can_update_status
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-75"
                  }`}
                >
                  <option value="">Select Status</option>
                  {status?.map((statusItem, index) => (
                    <option key={index} value={statusItem[0]}>
                      {statusItem[1]}
                    </option>
                  ))}
                </select>

                {isStatusUpdating && (
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 mr-8">
                    <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-gray-700 p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
              <h1 className="text-center text-red-400 text-xl font-bold">
                Style Remark :{" "}
                {protoData?.collection?.remarks !== ""
                  ? protoData?.collection.remarks
                  : "No Remarks"}
              </h1>
            </div>
          </div>

          {/* Success Message */}
          {showSuccessMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 ">
              Details saved successfully!
            </div>
          )}

          {/* Copy Success Message */}
          {showCopySuccessMessage && (
            <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 ">
              Data filled successfully from previous proto!
            </div>
          )}

          <div className="flex flex-col gap-10 justify-center">
            {/* Details Section */}
            <section className="proto-meta flex gap-4 border text-lg p-6 bg-white shadow-sm mb-5">
              <div className="flex flex-1 flex-col gap-4">
                <div className="proto-meta-header flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700">
                    {isMerchantEditMode
                      ? "UPDATE STYLE DETAILS"
                      : "STYLE DETAILS"}
                  </h3>
                  <div className="flex gap-4">
                    {isMerchantSectionCreated &&
                      !isMerchantEditMode &&
                      protoData?.proto?.permission
                        ?.can_update_merchant_section && (
                        <button
                          onClick={() => setIsMerchantEditMode(true)}
                          className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2  text-sm font-medium transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                      )}
                    {!isMerchantSectionCreated &&
                      protoData?.proto?.permission
                        ?.can_create_merchant_section &&
                      protoData?.proto?.proto_number !== 1 && (
                        <button
                          onClick={handleCopyMerchantFromPreviousProto}
                          disabled={isPrevProtoLoading}
                          className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2  text-sm font-medium transition-colors cursor-pointer"
                        >
                          {isPrevProtoLoading
                            ? "Loading..."
                            : "Copy from Previous Proto"}
                        </button>
                      )}
                  </div>
                </div>

                {/* Merchant Section Errors */}
                {sectionErrors.merchant && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700">
                    {sectionErrors.merchant}
                  </div>
                )}

                {/* Form - Always Visible */}
                <form
                  className="space-y-4 mb-6"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (isMerchantSectionCreated) {
                      handleSaveMerchantSection(undefined, true);
                    } else {
                      handleSaveMerchantSection(undefined, false);
                    }
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Right Side */}
                    <div className="space-y-4">
                      {/* DATE START */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          DATE START <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={merchantDetails?.date_started || ""}
                          onChange={(e) =>
                            setMerchantDetails((prev) => {
                              if (!prev) return null;
                              const newStart = e.target.value;

                              const newEnd =
                                prev.date_end &&
                                newStart &&
                                prev.date_end < newStart
                                  ? ""
                                  : prev.date_end;
                              return {
                                ...prev,
                                date_started: newStart,
                                date_end: newEnd,
                              };
                            })
                          }
                          disabled={
                            isMerchantSectionCreated && !isMerchantEditMode
                          }
                          className="w-full border border-gray-300  px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>

                      {/* DATE END */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          DATE END <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={merchantDetails?.date_end || ""}
                          onChange={(e) =>
                            setMerchantDetails((prev) => {
                              if (!prev) return null;
                              const newEnd = e.target.value;
                              // If new end date is before start date, clear it
                              if (
                                prev.date_started &&
                                newEnd < prev.date_started
                              ) {
                                return {
                                  ...prev,
                                  date_end: "",
                                };
                              }
                              return {
                                ...prev,
                                date_end: newEnd,
                              };
                            })
                          }
                          min={merchantDetails?.date_started || ""}
                          disabled={
                            isMerchantSectionCreated && !isMerchantEditMode
                          }
                          className="w-full border border-gray-300  px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        {merchantDetails?.date_end &&
                          merchantDetails?.date_started &&
                          merchantDetails.date_end <
                            merchantDetails.date_started && (
                            <div className="text-xs text-red-500 mt-1">
                              End date cannot be before start date.
                            </div>
                          )}
                      </div>

                      {/* PATTERN MASTER */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PATTERN MASTER <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={merchantDetails?.pattern_master_id || ""}
                          onChange={(e) =>
                            setMerchantDetails((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    pattern_master_id: e.target.value,
                                  }
                                : null
                            )
                          }
                          disabled={
                            isMerchantSectionCreated && !isMerchantEditMode
                          }
                          className="w-full border border-gray-300  px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                          <option className="text-gray-700" value="">
                            Select Pattern Master
                          </option>
                          {patternMasterOptions?.map((master) => (
                            <option
                              key={master.user_id}
                              className="text-gray-700"
                              value={master.user_id}
                            >
                              {master.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* CUT MASTER */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CUT MASTER <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={merchantDetails?.cutting_master_id || ""}
                          onChange={(e) =>
                            setMerchantDetails((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    cutting_master_id: e.target.value,
                                  }
                                : null
                            )
                          }
                          disabled={
                            isMerchantSectionCreated && !isMerchantEditMode
                          }
                          className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                          <option className="text-gray-700" value="">
                            Select Cut Master
                          </option>
                          {cutMasterOptions?.map((master) => (
                            <option
                              key={master.user_id}
                              className="text-gray-700"
                              value={master.user_id}
                            >
                              {master.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* TAILOR */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          TAILOR <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={merchantDetails?.tailor || ""}
                          onChange={(e) =>
                            setMerchantDetails((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    tailor: e.target.value,
                                  }
                                : null
                            )
                          }
                          disabled={
                            isMerchantSectionCreated && !isMerchantEditMode
                          }
                          className="w-full border border-gray-300  px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                          placeholder="Enter tailor name"
                        />
                      </div>
                    </div>
                    {/* Left Side */}
                    <div className="space-y-4">
                      {/* TIME START */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          TIME START <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          required
                          value={merchantDetails?.time_start || ""}
                          onChange={(e) =>
                            setMerchantDetails((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    time_start: e.target.value,
                                  }
                                : null
                            )
                          }
                          disabled={
                            isMerchantSectionCreated && !isMerchantEditMode
                          }
                          className="w-full border border-gray-300  px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        {merchantDetails?.time_start && (
                          <div className="text-xs text-gray-500 mt-1">
                            {formatTime12Hour(merchantDetails.time_start)}
                          </div>
                        )}
                      </div>

                      {/* TIME END - NOT REQUIRED */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          TIME END
                        </label>
                        <input
                          type="time"
                          value={merchantDetails?.time_end || ""}
                          onChange={(e) =>
                            setMerchantDetails((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    time_end: e.target.value,
                                  }
                                : null
                            )
                          }
                          disabled={
                            isMerchantSectionCreated && !isMerchantEditMode
                          }
                          className="w-full border border-gray-300  px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        {merchantDetails?.time_end && (
                          <div className="text-xs text-gray-500 mt-1">
                            {formatTime12Hour(merchantDetails.time_end)}
                          </div>
                        )}
                      </div>

                      {/* PATTERN PARTS TOTAL */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PATTERN PARTS TOTAL{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min={"0"}
                          step={"1"}
                          required
                          value={merchantDetails?.pattern_parts_total || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (
                              /^\d*$/.test(val) &&
                              (val === "" || parseInt(val, 10) >= 0)
                            ) {
                              setMerchantDetails((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      pattern_parts_total: Number(val),
                                    }
                                  : null
                              );
                            }
                          }}
                          disabled={
                            isMerchantSectionCreated && !isMerchantEditMode
                          }
                          className="w-full border border-gray-300  px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                          placeholder="Enter total pattern parts"
                        />
                      </div>

                      {/* QR Image */}
                      <div className="flex justify-center items-end flex-col gap-2">
                        {protoData?.proto?.qr_image ? (
                          <>
                            <img
                              src={protoData.proto.qr_image}
                              alt="QR Code"
                              className="h-[200px] object-cover border border-dashed border-gray-500 cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <p>Proto QR</p>
                          </>
                        ) : (
                          <div className="text-gray-400 text-xs text-center">
                            No QR Image
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  {(!isMerchantSectionCreated || isMerchantEditMode) &&
                    (protoData?.proto?.permission
                      ?.can_update_merchant_section ||
                      protoData?.proto?.permission
                        ?.can_create_merchant_section) && (
                      <div className="flex gap-2 pt-4">
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white px-4 py-2  text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                          {isSaving
                            ? "Saving..."
                            : isMerchantEditMode
                            ? "Update Details"
                            : "Save Details"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (isMerchantEditMode)
                              setIsMerchantEditMode(false);
                            handleCancel("merchant");
                          }}
                          disabled={isSaving}
                          className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2  text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                </form>
              </div>

              {/* Image Upload Section */}
              <div className="w-[20%]">
                <div className="relative mb-4">
                  {protoImagePreview ? (
                    <div className="relative">
                      <img
                        src={protoImagePreview}
                        alt={
                          Array.isArray(protoId) ? protoId.join(", ") : protoId
                        }
                        style={{ aspectRatio: "9/16" }}
                        className="w-full h-100 object-cover border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openPhotoModal(protoImagePreview!)}
                      />
                      {protoData?.proto?.permission
                        ?.can_update_merchant_section && (
                        <button
                          onClick={() => {
                            setProtoImagePreview(null);
                            setProtoImage(null);
                          }}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 flex items-center justify-center text-xs cursor-pointer"
                          title="Remove image"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ) : protoData?.proto?.permission
                      ?.can_create_merchant_section ? (
                    <div
                      style={{ aspectRatio: "9/16" }}
                      className="w-full h-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() =>
                        document.getElementById("main-image-upload")?.click()
                      }
                    >
                      <div className="text-center p-4">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400 mb-2"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <button className="text-md text-gray-800 mb-1 border p-4 bg-blue-200 cursor-pointer">
                          Click to upload image
                        </button>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                      <p className="text-gray-500 text-sm">No Image Found</p>
                    </div>
                  )}

                  <input
                    id="main-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setProtoImage(file);
                          setProtoImagePreview(event.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />

                  {protoImage?.name && (
                    <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 mt-2">
                      {protoImage?.name}
                    </div>
                  )}
                </div>

                {/* Show button only if a new image is selected and permission exists */}
                {protoData?.proto?.permission?.can_create_merchant_section &&
                  protoImage &&
                  !isImageuploadSuccess && (
                    <button
                      onClick={handleProtoImageUpload}
                      disabled={isImageUploading}
                      className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium px-4 py-2 mb-6 transition-colors cursor-pointer"
                    >
                      {isImageUploading ? "Uploading..." : "Upload Proto Image"}
                    </button>
                  )}

                {/* Show permission error if no permission */}
                {!protoData?.proto?.permission?.can_create_merchant_section && (
                  <p className="text-red-500 text-center text-sm">
                    You do not have permission to upload image
                  </p>
                )}
              </div>
            </section>

            {/* Master Ji Section */}
            <section className="merchant-section mb-8">
              <div className="border -lg p-6 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-700">
                    MASTER JI TO FILL
                  </h3>
                  <div className="flex gap-4">
                    {isMasterJiSectionCreated &&
                      !isMasterJiEditMode &&
                      protoData?.proto?.permission
                        ?.can_update_master_ji_section && (
                        <button
                          onClick={() => setIsMasterJiEditMode(true)}
                          className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2  text-sm font-medium transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                      )}
                    {!isMasterJiSectionCreated &&
                      protoData?.proto?.permission
                        ?.can_create_master_ji_section &&
                      protoData?.proto?.proto_number !== 1 && (
                        <button
                          onClick={handleCopyMasterJiFromPreviousProto}
                          disabled={isPrevProtoLoading}
                          className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2  text-sm font-medium transition-colors cursor-pointer"
                        >
                          {isPrevProtoLoading
                            ? "Loading..."
                            : "Copy from Previous Proto"}
                        </button>
                      )}
                  </div>
                </div>

                {/* Master Ji Section Errors */}
                {sectionErrors.masterji && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700">
                    {sectionErrors.masterji}
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (isMasterJiSectionCreated) {
                      handleSaveMasterJiSection(undefined, true);
                    } else {
                      handleSaveMasterJiSection(undefined, false);
                    }
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Side - Production Details */}
                    <div className="space-y-4">
                      {/* Stitch Time */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stitch Time <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          required
                          value={masterJiDetails?.stitch_time || ""}
                          onChange={(e) =>
                            setMasterJiDetails((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    stitch_time: e.target.value,
                                  }
                                : null
                            )
                          }
                          disabled={
                            isMasterJiSectionCreated && !isMasterJiEditMode
                          }
                          className="w-full border border-gray-300  px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                          placeholder="e.g., 2 hours, 30 minutes"
                        />
                      </div>

                      {/* Stitch Cost */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stitch Cost <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={masterJiDetails?.stitch_cost || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^\d*\.?\d{0,2}$/.test(val)) {
                              setMasterJiDetails((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      stitch_cost: Number(val),
                                    }
                                  : null
                              );
                            }
                          }}
                          disabled={
                            isMasterJiSectionCreated && !isMasterJiEditMode
                          }
                          className="w-full border border-gray-300  px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                          placeholder="Enter stitch cost"
                        />
                      </div>

                      {/* Cut Cost */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cut Cost <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          step="0.01"
                          value={masterJiDetails?.cut_cost || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^\d*\.?\d{0,2}$/.test(val)) {
                              setMasterJiDetails((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      cut_cost: Number(val),
                                    }
                                  : null
                              );
                            }
                          }}
                          disabled={
                            isMasterJiSectionCreated && !isMasterJiEditMode
                          }
                          className="w-full border border-gray-300  px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                          placeholder="Enter cutting cost"
                        />
                      </div>

                      {/* Needle Type */}
                      <div className="border border-black-300  px-3 py-2">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Needle Type <span className="text-red-500">*</span>
                          </label>
                          {(!isMasterJiSectionCreated ||
                            isMasterJiEditMode) && (
                            <button
                              onClick={() =>
                                setNeedleTypeRows((prev) => prev + 1)
                              }
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1  text-xs font-medium transition-colors cursor-pointer"
                            >
                              Add Needle Type
                            </button>
                          )}
                        </div>
                        <div className="border border-gray-300  overflow-hidden">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                                  Fabric Type
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Needle Type
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {Array.from(
                                { length: needleTypeRows },
                                (_, index) => {
                                  // Access through extra_data
                                  const currentNeedleType = masterJiDetails
                                    ?.extra_data?.needle_type?.[index] || {
                                    fabric_type: "",
                                    needle_type: "",
                                  };

                                  return (
                                    <tr key={index}>
                                      <td className="px-3 py-2 border-r border-gray-300">
                                        <input
                                          type="text"
                                          required
                                          value={currentNeedleType.fabric_type}
                                          onChange={(e) => {
                                            setMasterJiDetails((prev) => {
                                              if (!prev)
                                                return getEmptyMasterJiDetails();

                                              console.log("prev", prev);

                                              const needleTypes =
                                                prev?.extra_data?.needle_type ||
                                                [];

                                              const updatedNeedleTypes = [
                                                ...needleTypes,
                                              ];

                                              // Ensure we have enough elements
                                              while (
                                                updatedNeedleTypes.length <=
                                                index
                                              ) {
                                                updatedNeedleTypes.push({
                                                  fabric_type: "",
                                                  needle_type: "",
                                                });
                                              }

                                              updatedNeedleTypes[index] = {
                                                ...updatedNeedleTypes[index],
                                                fabric_type: e.target.value,
                                              };

                                              return {
                                                ...prev,
                                                extra_data: {
                                                  ...prev.extra_data,
                                                  needle_type:
                                                    updatedNeedleTypes,
                                                },
                                              };
                                            });
                                          }}
                                          disabled={
                                            isMasterJiSectionCreated &&
                                            !isMasterJiEditMode
                                          }
                                          placeholder="Enter fabric type"
                                          className="w-full border-0 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                                        />
                                      </td>
                                      <td className="px-3 py-2 flex items-center gap-2">
                                        <select
                                          required
                                          value={currentNeedleType.needle_type}
                                          onChange={(e) => {
                                            setMasterJiDetails((prev) => {
                                              if (!prev)
                                                return getEmptyMasterJiDetails();

                                              const updatedNeedleTypes = [
                                                ...(prev.extra_data
                                                  ?.needle_type || []),
                                              ];

                                              while (
                                                updatedNeedleTypes.length <=
                                                index
                                              ) {
                                                updatedNeedleTypes.push({
                                                  fabric_type: "",
                                                  needle_type: "",
                                                });
                                              }

                                              updatedNeedleTypes[index] = {
                                                ...updatedNeedleTypes[index],
                                                needle_type: e.target.value,
                                              };

                                              return {
                                                ...prev,
                                                extra_data: {
                                                  ...prev.extra_data,
                                                  needle_type:
                                                    updatedNeedleTypes,
                                                },
                                              };
                                            });
                                          }}
                                          disabled={
                                            isMasterJiSectionCreated &&
                                            !isMasterJiEditMode
                                          }
                                          className="w-full border-0 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                                        >
                                          <option value="">
                                            Select needle type
                                          </option>
                                          {needleTypeOptions?.map((needle) => (
                                            <option
                                              key={needle.needle_id}
                                              value={needle.name}
                                            >
                                              {needle.name}
                                            </option>
                                          ))}
                                        </select>
                                        {(!isMasterJiSectionCreated ||
                                          isMasterJiEditMode) &&
                                          needleTypeRows > 1 && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setMasterJiDetails((prev) => {
                                                  if (!prev) return prev;
                                                  const updated = [
                                                    ...(prev.extra_data
                                                      ?.needle_type || []),
                                                  ];
                                                  updated.splice(index, 1);
                                                  return {
                                                    ...prev,
                                                    extra_data: {
                                                      ...prev.extra_data,
                                                      needle_type: updated,
                                                    },
                                                  };
                                                });
                                                setNeedleTypeRows((prev) =>
                                                  Math.max(1, prev - 1)
                                                );
                                              }}
                                              className="text-red-500 hover:text-red-700 px-2 py-1 text-xs font-medium cursor-pointer"
                                            >
                                              Remove
                                            </button>
                                          )}
                                      </td>
                                    </tr>
                                  );
                                }
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Gross Weight */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gross Weight <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            required
                            step="0.01"
                            value={masterJiDetails?.gross_weight || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^\d*\.?\d{0,2}$/.test(val)) {
                                setMasterJiDetails((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        gross_weight: Number(val),
                                      }
                                    : null
                                );
                              }
                            }}
                            disabled={
                              isMasterJiSectionCreated && !isMasterJiEditMode
                            }
                            className="flex-1 border border-gray-300  px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                            placeholder="Enter weight"
                          />
                          <select
                            required
                            value={masterJiDetails?.gross_weight_unit || ""}
                            onChange={(e) =>
                              setMasterJiDetails((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      gross_weight_unit: e.target.value,
                                    }
                                  : null
                              )
                            }
                            disabled={
                              isMasterJiSectionCreated && !isMasterJiEditMode
                            }
                            className="border border-gray-300  px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                          >
                            <option value="">Select Unit</option>
                            <option value="grams">grams</option>
                            <option value="kg">kg</option>
                            <option value="oz">oz</option>
                            <option value="lbs">lbs</option>
                          </select>
                        </div>
                      </div>

                      {/* Tuk File */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tuka File <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                          {/* If section is created and tuk_file is present, show file name and download */}
                          {isMasterJiSectionCreated &&
                          masterJiDetails?.tuka_file &&
                          !isMasterJiEditMode ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1">
                                {masterJiDetails.tuka_file.split("/").pop()}
                              </span>
                              <a
                                href={masterJiDetails.tuka_file}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-sky-500 hover:bg-sky-600 text-white px-3 py-1 text-xs font-medium rounded transition-colors"
                              >
                                Download
                              </a>
                            </div>
                          ) : isMasterJiSectionCreated &&
                            masterJiDetails?.tuka_file &&
                            isMasterJiEditMode ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1">
                                {masterJiDetails.tuka_file.split("/").pop()}
                              </span>
                              <div className="flex gap-2">
                                <a
                                  href={masterJiDetails.tuka_file}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-sky-500 hover:bg-sky-600 text-white px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer"
                                >
                                  Download
                                </a>
                                <button
                                  onClick={() => {
                                    setTukFileObject(null);
                                    setMasterJiDetails((prev) =>
                                      prev ? { ...prev, tuka_file: null } : null
                                    );
                                  }}
                                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            // Otherwise, show file input for upload
                            <>
                              {protoData?.proto?.permission
                                ?.can_create_master_ji_section && (
                                <input
                                  type="file"
                                  required
                                  accept=".tuk,.pdf,.doc,.docx,.txt"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setTukFileObject(file);
                                      setMasterJiDetails((prev) =>
                                        prev
                                          ? { ...prev, tuk_file: file.name }
                                          : null
                                      );
                                    }
                                  }}
                                  disabled={
                                    isMasterJiSectionCreated &&
                                    !isMasterJiEditMode
                                  }
                                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 file:mr-4 file:py-1 file:px-2 file:border-0 file:text-sm file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                                />
                              )}
                              {masterJiDetails?.tuka_file ? (
                                <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 ">
                                  Selected: {masterJiDetails?.tuka_file}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-500">
                                  No Tuka File Found
                                </p>
                              )}
                              <p className="text-xs text-gray-500">
                                Upload tuka file (.tuk, .pdf, .doc, .docx, .txt)
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 ">
                      <div className="mt-3 border -lg p-3 bg-white shadow-sm mb-10">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          OVERLOCK TYPE <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-3">
                          {/* Display existing overlock fields */}
                          {Array.isArray(
                            masterJiDetails?.extra_data?.overlock_type
                          ) &&
                            masterJiDetails?.extra_data?.overlock_type?.map(
                              (field, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-3 p-2 border bg-gray-50"
                                >
                                  <span className="flex-1 text-sm font-medium text-gray-700 uppercase">
                                    {field.overlock_type}:
                                  </span>
                                  <input
                                    type="text"
                                    required={true}
                                    value={field.value || ""}
                                    onChange={(e) => {
                                      setMasterJiDetails((prev) => {
                                        if (!prev || !prev.extra_data)
                                          return prev;

                                        const updatedFields = [
                                          ...(prev.extra_data.overlock_type ||
                                            []),
                                        ];
                                        updatedFields[index] = {
                                          ...field,
                                          value: e.target.value,
                                        };

                                        return {
                                          ...prev,
                                          extra_data: {
                                            ...prev.extra_data,
                                            overlock_type: updatedFields,
                                          },
                                        };
                                      });
                                    }}
                                    disabled={
                                      isMasterJiSectionCreated &&
                                      !isMasterJiEditMode
                                    }
                                    className="flex-1 border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    placeholder="Enter value"
                                  />
                                  {(!isMasterJiSectionCreated ||
                                    isMasterJiEditMode) && (
                                    <button
                                      onClick={() => {
                                        setMasterJiDetails((prev) => {
                                          if (!prev || !prev.extra_data)
                                            return prev;

                                          const updatedFields =
                                            prev.extra_data.overlock_type.filter(
                                              (_, i) => i !== index
                                            );

                                          return {
                                            ...prev,
                                            extra_data: {
                                              ...prev.extra_data,
                                              overlock_type: updatedFields,
                                            },
                                          };
                                        });
                                      }}
                                      className="text-red-500 hover:text-red-600 px-2 py-1 text-sm font-medium cursor-pointer"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              )
                            )}

                          {/* Add new overlock field */}
                          {(!isMasterJiSectionCreated ||
                            isMasterJiEditMode) && (
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-3">
                                <select
                                  required={
                                    masterJiDetails?.extra_data?.overlock_type
                                      ?.length === 0
                                  }
                                  value={selectedOverlockType}
                                  onChange={(e) =>
                                    setSelectedOverlockType(e.target.value)
                                  }
                                  className="flex-1 border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                >
                                  <option value="">Choose overlock type</option>
                                  {overlockTypeOptions?.map((overlock) => (
                                    <option
                                      key={overlock.overlock_id}
                                      value={overlock.name}
                                    >
                                      {overlock.name}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => {
                                    if (selectedOverlockType) {
                                      setMasterJiDetails((prev) => {
                                        if (!prev)
                                          return getEmptyMasterJiDetails();

                                        return {
                                          ...prev,
                                          extra_data: {
                                            ...prev.extra_data,
                                            overlock_type: [
                                              ...(prev.extra_data
                                                ?.overlock_type || []),
                                              {
                                                overlock_type:
                                                  selectedOverlockType,
                                                value: "",
                                              },
                                            ],
                                          },
                                        };
                                      });
                                      setSelectedOverlockType("");
                                    }
                                  }}
                                  disabled={!selectedOverlockType}
                                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
                                >
                                  Add more option
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* TUKA Efficiency Section */}
                      <div className="mt-3 border -lg p-3 bg-white shadow-sm mb-10">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between pb-2">
                            <h4 className="text-sm font-medium">
                              EFFICIENCY <span className="text-red-500">*</span>
                            </h4>
                            {(!isMasterJiSectionCreated ||
                              isMasterJiEditMode) && (
                              <button
                                onClick={() =>
                                  setTukaEfficiencyRows((prev) => prev + 1)
                                }
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1  text-xs font-medium transition-colors cursor-pointer"
                              >
                                Add EFFICIENCY
                              </button>
                            )}
                          </div>

                          <div className="border border-gray-300  overflow-hidden">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                                    Percentage
                                  </th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Efficiency Type
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {Array.from(
                                  { length: tukaEfficiencyRows },
                                  (_, index) => {
                                    const currentEfficiency = masterJiDetails
                                      ?.extra_data?.efficiency_type?.[
                                      index
                                    ] || {
                                      value: null,
                                      efficiency_type: "",
                                    };

                                    return (
                                      <tr key={index}>
                                        <td className="px-3 py-2 border-r border-gray-300">
                                          <input
                                            type="number"
                                            required
                                            value={
                                              currentEfficiency.value || ""
                                            }
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              // Add validation for 2 decimal places
                                              if (
                                                val === "" ||
                                                /^\d*\.?\d{0,2}$/.test(val)
                                              ) {
                                                setMasterJiDetails((prev) => {
                                                  if (!prev)
                                                    return getEmptyMasterJiDetails();
                                                  const updatedEfficiency = [
                                                    ...(prev.extra_data
                                                      ?.efficiency_type || []),
                                                  ];
                                                  while (
                                                    updatedEfficiency.length <=
                                                    index
                                                  ) {
                                                    updatedEfficiency.push({
                                                      value: null,
                                                      efficiency_type: "",
                                                    });
                                                  }
                                                  updatedEfficiency[index] = {
                                                    ...updatedEfficiency[index],
                                                    value: val
                                                      ? Number(val)
                                                      : null,
                                                  };
                                                  return {
                                                    ...prev,
                                                    extra_data: {
                                                      ...prev.extra_data,
                                                      efficiency_type:
                                                        updatedEfficiency,
                                                    },
                                                  };
                                                });
                                              }
                                            }}
                                            disabled={
                                              isMasterJiSectionCreated &&
                                              !isMasterJiEditMode
                                            }
                                            placeholder="Enter percentage"
                                            className="w-full border-0 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                                          />
                                        </td>
                                        <td className="px-3 py-2 flex item-center gap-2">
                                          <select
                                            required
                                            value={
                                              currentEfficiency.efficiency_type ||
                                              ""
                                            }
                                            onChange={(e) => {
                                              setMasterJiDetails((prev) => {
                                                if (!prev)
                                                  return getEmptyMasterJiDetails();
                                                const updatedEfficiency = [
                                                  ...(prev.extra_data
                                                    ?.efficiency_type || []),
                                                ];
                                                while (
                                                  updatedEfficiency.length <=
                                                  index
                                                ) {
                                                  updatedEfficiency.push({
                                                    value: null,
                                                    efficiency_type: "",
                                                  });
                                                }
                                                updatedEfficiency[index] = {
                                                  ...updatedEfficiency[index],
                                                  efficiency_type:
                                                    e.target.value,
                                                };
                                                return {
                                                  ...prev,
                                                  extra_data: {
                                                    ...prev.extra_data,
                                                    efficiency_type:
                                                      updatedEfficiency,
                                                  },
                                                };
                                              });
                                            }}
                                            disabled={
                                              isMasterJiSectionCreated &&
                                              !isMasterJiEditMode
                                            }
                                            className="w-full border-0 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                                          >
                                            <option value="">
                                              Select efficiency type
                                            </option>
                                            {efficiencyTypeOptions?.map(
                                              (option, idx) => (
                                                <option
                                                  key={
                                                    option.efficiency_type_id ||
                                                    idx
                                                  }
                                                  value={option.name}
                                                >
                                                  {option.name}
                                                </option>
                                              )
                                            )}
                                          </select>
                                          {(!isMasterJiSectionCreated ||
                                            isMasterJiEditMode) &&
                                            tukaEfficiencyRows > 1 && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setMasterJiDetails((prev) => {
                                                    if (!prev) return prev;
                                                    const updated = [
                                                      ...(prev.extra_data
                                                        ?.efficiency_type ||
                                                        []),
                                                    ];
                                                    updated.splice(index, 1);
                                                    return {
                                                      ...prev,
                                                      extra_data: {
                                                        ...prev.extra_data,
                                                        efficiency_type:
                                                          updated,
                                                      },
                                                    };
                                                  });
                                                  setTukaEfficiencyRows(
                                                    (prev) =>
                                                      Math.max(1, prev - 1)
                                                  );
                                                }}
                                                className="text-red-500 hover:text-red-700 px-2 py-1 text-xs font-medium cursor-pointer"
                                              >
                                                Remove
                                              </button>
                                            )}
                                        </td>
                                      </tr>
                                    );
                                  }
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* Dependent Dropdown Section */}
                      <div className="mt-3 border -lg p-3 bg-white shadow-sm mb-10">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between pb-2">
                            <h4 className="text-sm font-medium">
                              FLAT LOCK <span className="text-red-500">*</span>
                            </h4>
                            {(!isMasterJiSectionCreated ||
                              isMasterJiEditMode) && (
                              <button
                                onClick={() =>
                                  setFlatLockRows((prev) => prev + 1)
                                }
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1  text-xs font-medium transition-colors cursor-pointer"
                              >
                                Add Flat Lock
                              </button>
                            )}
                          </div>

                          <div className="border border-gray-300  overflow-hidden">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                                    Placement
                                  </th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                                    Folder Type
                                  </th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                                    No of Threads
                                  </th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Folder Size
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {Array.from(
                                  { length: flatLockRows },
                                  (_, index) => (
                                    <tr key={index}>
                                      <td className="px-3 py-2 border-r border-gray-300">
                                        <input
                                          type="text"
                                          required
                                          value={
                                            masterJiDetails?.extra_data
                                              ?.flat_lock[index]?.placement ||
                                            ""
                                          }
                                          onChange={(e) => {
                                            setMasterJiDetails((prev) => {
                                              if (!prev)
                                                return getEmptyMasterJiDetails();
                                              const updatedFlatLock = [
                                                ...(prev.extra_data
                                                  ?.flat_lock || []),
                                              ];
                                              while (
                                                updatedFlatLock.length <= index
                                              ) {
                                                updatedFlatLock.push({
                                                  placement: "",
                                                  type: "",
                                                  folder_size: "",
                                                  no_of_threads: "",
                                                });
                                              }
                                              updatedFlatLock[index] = {
                                                ...updatedFlatLock[index],
                                                placement: e.target.value,
                                              };
                                              return {
                                                ...prev,
                                                extra_data: {
                                                  ...prev.extra_data,
                                                  flat_lock: updatedFlatLock,
                                                },
                                              };
                                            });
                                          }}
                                          disabled={
                                            isMasterJiSectionCreated &&
                                            !isMasterJiEditMode
                                          }
                                          placeholder="Enter placement"
                                          className="w-full border-0 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                                        />
                                      </td>
                                      <td className="px-3 py-2 border-r border-gray-300">
                                        <select
                                          required
                                          value={
                                            masterJiDetails?.extra_data
                                              ?.flat_lock[index]?.type ||
                                            folderType[index] ||
                                            ""
                                          }
                                          onChange={(e) => {
                                            const updated = [...folderType];
                                            updated[index] = e.target.value;
                                            setFolderType(updated);

                                            setMasterJiDetails((prev) => {
                                              if (!prev)
                                                return getEmptyMasterJiDetails();
                                              const updatedFlatLock = [
                                                ...(prev.extra_data
                                                  ?.flat_lock || []),
                                              ];
                                              while (
                                                updatedFlatLock.length <= index
                                              ) {
                                                updatedFlatLock.push({
                                                  placement: "",
                                                  type: "",
                                                  folder_size: "",
                                                  no_of_threads: "",
                                                });
                                              }
                                              updatedFlatLock[index] = {
                                                ...updatedFlatLock[index],
                                                type: e.target.value,
                                              };
                                              return {
                                                ...prev,
                                                extra_data: {
                                                  ...prev.extra_data,
                                                  flat_lock: updatedFlatLock,
                                                },
                                              };
                                            });
                                          }}
                                          disabled={
                                            isMasterJiSectionCreated &&
                                            !isMasterJiEditMode
                                          }
                                          className="w-full border-0 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                                        >
                                          <option value="">
                                            Select Folder Type
                                          </option>
                                          <option value="with-folder">
                                            With Folder
                                          </option>
                                          <option value="without-folder">
                                            Without Folder
                                          </option>
                                        </select>
                                      </td>
                                      <td className="px-3 py-2 border-r border-gray-300">
                                        <select
                                          required
                                          value={
                                            masterJiDetails?.extra_data
                                              ?.flat_lock[index]
                                              ?.no_of_threads || ""
                                          }
                                          onChange={(e) => {
                                            setMasterJiDetails((prev) => {
                                              if (!prev)
                                                return getEmptyMasterJiDetails();
                                              const updatedFlatLock = [
                                                ...(prev.extra_data
                                                  ?.flat_lock || []),
                                              ];
                                              while (
                                                updatedFlatLock.length <= index
                                              ) {
                                                updatedFlatLock.push({
                                                  placement: "",
                                                  type: "",
                                                  folder_size: "",
                                                  no_of_threads: "",
                                                });
                                              }
                                              updatedFlatLock[index] = {
                                                ...updatedFlatLock[index],
                                                no_of_threads: e.target.value,
                                              };
                                              return {
                                                ...prev,
                                                extra_data: {
                                                  ...prev.extra_data,
                                                  flat_lock: updatedFlatLock,
                                                },
                                              };
                                            });
                                          }}
                                          disabled={
                                            isMasterJiSectionCreated &&
                                            !isMasterJiEditMode
                                          }
                                          className="w-full border-0 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                                        >
                                          <option value="">
                                            Select Threads
                                          </option>
                                          <option value="2">2 Threads</option>
                                          <option value="3">3 Threads</option>
                                          <option value="4">4 Threads</option>
                                          <option value="5">5 Threads</option>
                                        </select>
                                      </td>
                                      <td className="px-3 py-2 flex items-center gap-2">
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={
                                            masterJiDetails?.extra_data
                                              ?.flat_lock[index]?.folder_size ||
                                            ""
                                          }
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            if (/^\d*\.?\d{0,2}$/.test(val)) {
                                              setMasterJiDetails((prev) => {
                                                if (!prev)
                                                  return getEmptyMasterJiDetails();

                                                const updatedFlatLock = [
                                                  ...(prev.extra_data
                                                    ?.flat_lock || []),
                                                ];

                                                // Ensure the array has enough elements
                                                while (
                                                  updatedFlatLock.length <=
                                                  index
                                                ) {
                                                  updatedFlatLock.push({
                                                    placement: "",
                                                    type: "",
                                                    folder_size: "",
                                                    no_of_threads: "",
                                                  });
                                                }

                                                updatedFlatLock[index] = {
                                                  ...updatedFlatLock[index],
                                                  folder_size: val,
                                                };

                                                return {
                                                  ...prev,
                                                  extra_data: {
                                                    ...prev.extra_data,
                                                    flat_lock: updatedFlatLock,
                                                  },
                                                };
                                              });
                                            }
                                          }}
                                          readOnly={
                                            isMasterJiSectionCreated &&
                                            !isMasterJiEditMode
                                          }
                                          className={`w-full border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:bg-gray-300 disabled:cursor-not-allowed`}
                                          placeholder="Enter folder size"
                                          disabled={
                                            masterJiDetails?.extra_data
                                              ?.flat_lock?.[index]?.type ===
                                              "without-folder" ||
                                            folderType[index] ===
                                              "without-folder"
                                          }
                                        />
                                        {(!isMasterJiSectionCreated ||
                                          isMasterJiEditMode) &&
                                          flatLockRows > 1 && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setMasterJiDetails((prev) => {
                                                  if (!prev) return prev;
                                                  const updated = [
                                                    ...(prev.extra_data
                                                      ?.flat_lock || []),
                                                  ];
                                                  updated.splice(index, 1);
                                                  return {
                                                    ...prev,
                                                    extra_data: {
                                                      ...prev.extra_data,
                                                      flat_lock: updated,
                                                    },
                                                  };
                                                });
                                                setFlatLockRows((prev) =>
                                                  Math.max(1, prev - 1)
                                                );
                                              }}
                                              className="text-red-500 hover:text-red-700 px-2 py-1 text-xs font-medium cursor-pointer"
                                            >
                                              Remove
                                            </button>
                                          )}
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  {(!isMasterJiSectionCreated || isMasterJiEditMode) &&
                    (protoData?.proto?.permission
                      ?.can_create_master_ji_section ||
                      protoData?.proto?.permission
                        ?.can_update_master_ji_section) && (
                      <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                          {isSaving
                            ? "Saving..."
                            : isMasterJiEditMode
                            ? "Update Section"
                            : "Save Section"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (isMasterJiEditMode)
                              setIsMasterJiEditMode(false);
                            handleCancel("masterji");
                          }}
                          disabled={isSaving}
                          className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2  text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                </form>
              </div>
            </section>
          </div>

          {/* Print Modal */}
          {showPrintModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-xs flex flex-col items-center gap-6">
                <h2 className="text-xl font-semibold mb-2">Print Options</h2>
                <button
                  className="w-full bg-red-400 hover:bg-red-600 text-white font-medium px-4 py-2 rounded transition-colors cursor-pointer"
                  onClick={() =>
                    router.replace("/print/proto/" + protoData?.proto?.proto_id)
                  }
                >
                  Proto Details
                </button>
                <button
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium px-4 py-2 rounded transition-colors"
                  onClick={() => {
                    setShowPrintModal(false);
                    setShowPrintView(true);
                  }}
                >
                  Print Form
                </button>
                <button
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded transition-colors"
                  onClick={() => {
                    setShowPrintModal(false);
                    // Implement Print QR logic here
                    setQrprintmodal(true);
                  }}
                >
                  Print QR
                </button>
                <button
                  className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium px-4 py-2 rounded transition-colors"
                  onClick={() => setShowPrintModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <PhotoModal />
        </div>
      )}

      {qrprintmodal && (
        <QrPrintModal imageurl={protoData?.proto?.qr_image || ""} />
      )}
    </>
  );
};

export default LayoutComponents(ProtoDetailPage);
