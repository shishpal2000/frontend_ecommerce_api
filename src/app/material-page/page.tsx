/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, Suspense } from "react";
import ReadOnlyProcess from "../../components/ReadOnlyProcess";
import { useRouter, useSearchParams } from "next/navigation";
import { useGeneralApiCall } from "../../services/useGeneralApiCall";
import { injectPrintStyles as portraitPrintStyles } from "./PotrateView";
import { injectPrintStyles as landscapePrintStyles } from "./PrintStyles";
import LayoutComponents from "../layoutComponents";

interface ProcessField {
  field_id: string;
  field_name: string;
  data_type: string;
  is_required: boolean;
  units: string[];
}

interface ProcessWithFields {
  process_id: string;
  process_name: string;
  fields: ProcessField[];
}

interface Process {
  process_id: string;
  name: string;
  fields?: ProcessField[];
}

type MaterialForm = {
  id: string;
  type: string;
  name: string;
  placement: string;
  processes: Process[];
  isFromPrevProto?: boolean;
};

function MaterialsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Print state
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [printOrientation, setPrintOrientation] = useState<string>("portrait");

  // State for fetched processes and material categories from API
  const [availableProcesses, setAvailableProcesses] = useState<Process[]>([]);
  const [materialCategories, setMaterialCategories] = useState<
    { id: number; name: string }[]
  >([]);

  // Get the API call helper
  const { getApi } = useGeneralApiCall();

  // Enhanced print styles injection with proper cleanup
  useEffect(() => {
    // Remove all existing print styles first
    const removeExistingPrintStyles = () => {
      // Remove portrait print styles
      const portraitStyles = document.getElementById("portrait-print-styles");
      if (portraitStyles) {
        portraitStyles.remove();
      }

      // Remove landscape print styles
      const landscapeStyles = document.getElementById("landscape-print-styles");
      if (landscapeStyles) {
        landscapeStyles.remove();
      }

      // Remove any generic print styles
      const genericStyles = document.getElementById("print-styles");
      if (genericStyles) {
        genericStyles.remove();
      }
    };

    // Clean up existing styles
    removeExistingPrintStyles();

    // Add a small delay to ensure cleanup is complete
    const timer = setTimeout(() => {
      if (printOrientation === "portrait") {
        portraitPrintStyles();
      } else {
        landscapePrintStyles();
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      removeExistingPrintStyles();
    };
  }, [printOrientation]);

  // Print functions
  const handlePrint = () => {
    // Force re-injection of correct styles before printing
    if (printOrientation === "portrait") {
      portraitPrintStyles();
    } else {
      landscapePrintStyles();
    }

    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setIsPrintMode(false);
      }, 200);
    }, 100);
  };

  // Fetch material categories from API
  useEffect(() => {
    const fetchMaterialCategories = async () => {
      try {
        const response = await getApi<{
          data: { id: number; name: string }[];
          error_status: boolean;
        }>("raw-material/list-categories/");
        if (
          response &&
          !response.error_status &&
          Array.isArray(response.data)
        ) {
          setMaterialCategories(response.data);
        }
      } catch (error) {
        console.error("Error fetching material categories:", error);
      }
    };

    fetchMaterialCategories();
  }, [getApi]);

  // Fetch processes from API using useGeneralApiCall
  useEffect(() => {
    let isMounted = true;
    const fetchProcesses = async () => {
      try {
        const result = await getApi<Process[]>("/process/list/");
        if (result && "data" in result && isMounted) {
          setAvailableProcesses(result.data);
        }
      } catch (error) {
        console.error("Error fetching processes:", error);
        if (isMounted) {
          setAvailableProcesses([
            { process_id: "1", name: "RFD" },
            { process_id: "2", name: "Dyeing" },
            { process_id: "3", name: "EMB" },
          ]);
        }
      }
    };

    if (isMounted) {
      fetchProcesses();
    }

    return () => {
      isMounted = false;
    };
  }, [getApi]);

  // Get proto parameters from URL
  const protoId = searchParams.get("protoId") || "proto-1";
  const protoName = searchParams.get("protoName") || "Default Proto";

  // Initialize state with selected processes
  const [selectedProcesses, setSelectedProcesses] = useState<{
    [key: string]: Process;
  }>({});

  // State for Previous Proto materials
  const [prevProtoMaterials, setPrevProtoMaterials] = useState<MaterialForm[]>([
    {
      id: "prev-material-1",
      type: "Cotton",
      name: "Premium Cotton 60s",
      placement: "Body",
      processes: [
        {
          process_id: "1",
          name: "RFD",
          fields: [
            {
              field_id: "field-1",
              field_name: "Temperature",
              data_type: "text",
              is_required: true,
              units: ["°C", "°F"],
            },
            {
              field_id: "field-2",
              field_name: "Duration",
              data_type: "time",
              is_required: true,
              units: ["hours"],
            },
          ],
        },
        {
          process_id: "2",
          name: "Dyeing",
          fields: [
            {
              field_id: "field-3",
              field_name: "Color Code",
              data_type: "text",
              is_required: true,
              units: [],
            },
          ],
        },
      ],
      isFromPrevProto: true,
    },
    {
      id: "prev-material-2",
      type: "Polyester",
      name: "Sports Mesh",
      placement: "Sleeves",
      processes: [
        {
          process_id: "3",
          name: "EMB",
          fields: [
            {
              field_id: "field-4",
              field_name: "Design Code",
              data_type: "text",
              is_required: true,
              units: [],
            },
            {
              field_id: "field-5",
              field_name: "Stitch Count",
              data_type: "text",
              is_required: true,
              units: ["per inch"],
            },
          ],
        },
      ],
      isFromPrevProto: true,
    },
    {
      id: "prev-material-3",
      type: "Linen",
      name: "Fine Linen 80s",
      placement: "Collar",
      processes: [
        {
          process_id: "1",
          name: "RFD",
          fields: [
            {
              field_id: "field-6",
              field_name: "Temperature",
              data_type: "text",
              is_required: true,
              units: ["°C", "°F"],
            },
          ],
        },
      ],
      isFromPrevProto: true,
    },
  ]);

  // Initialize materials state
  const [materials, setMaterials] = useState<MaterialForm[]>([
    {
      id: "material-1",
      type: "Cotton",
      name: "Premium Cotton 60s",
      placement: "Body",
      processes: [
        {
          process_id: "1",
          name: "RFD",
          fields: [
            {
              field_id: "field-1",
              field_name: "Temperature",
              data_type: "text",
              is_required: true,
              units: ["°C", "°F"],
            },
            {
              field_id: "field-2",
              field_name: "Duration",
              data_type: "time",
              is_required: true,
              units: ["hours"],
            },
          ],
        },
        {
          process_id: "2",
          name: "Dyeing",
          fields: [
            {
              field_id: "field-3",
              field_name: "Color Code",
              data_type: "text",
              is_required: true,
              units: [],
            },
          ],
        },
      ],
      isFromPrevProto: false,
    },
    {
      id: "material-2",
      type: "Polyester",
      name: "Sports Mesh",
      placement: "Sleeves",
      processes: [
        {
          process_id: "3",
          name: "EMB",
          fields: [
            {
              field_id: "field-4",
              field_name: "Design Code",
              data_type: "text",
              is_required: true,
              units: [],
            },
            {
              field_id: "field-5",
              field_name: "Stitch Count",
              data_type: "text",
              is_required: true,
              units: ["per inch"],
            },
          ],
        },
      ],
      isFromPrevProto: false,
    },
    {
      id: "material-3",
      type: "Linen",
      name: "Fine Linen 80s",
      placement: "Collar",
      processes: [
        {
          process_id: "1",
          name: "RFD",
          fields: [
            {
              field_id: "field-6",
              field_name: "Temperature",
              data_type: "text",
              is_required: true,
              units: ["°C", "°F"],
            },
          ],
        },
      ],
      isFromPrevProto: false,
    },
  ]);

  const handleAddMaterial = () => {
    const defaultType =
      materialCategories.length > 0 ? materialCategories[0].name : "";
    const newMaterial: MaterialForm = {
      id: `material-${Date.now()}`,
      type: defaultType,
      name: "",
      placement: "Body",
      processes: [],
      isFromPrevProto: false,
    };

    if (defaultType) {
      const selectedCategory = materialCategories.find(
        (cat) => cat.name === defaultType
      );
      if (selectedCategory) {
        fetchMaterialsByCategory(selectedCategory.id);
      }
    }

    setMaterials((prev) => [...prev, newMaterial]);
  };

  const [materialNames, setMaterialNames] = useState<{
    [key: string]: { id: number; name: string }[];
  }>({});

  const fetchMaterialsByCategory = async (categoryId: number) => {
    try {
      const response = await getApi<{
        data: { id: number; name: string }[];
        error_status: boolean;
      }>(`raw-material/list-materials/${categoryId}`);
      if (response && !response.error_status && Array.isArray(response.data)) {
        setMaterialNames((prev) => ({
          ...prev,
          [categoryId]: response.data,
        }));
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const handleChange = async (
    index: number,
    field: keyof MaterialForm,
    value: any
  ) => {
    const updated = [...materials];
    (updated[index] as any)[field] = value;
    setMaterials(updated);

    if (field === "type") {
      const selectedCategory = materialCategories.find(
        (cat) => cat.name === value
      );
      if (selectedCategory) {
        await fetchMaterialsByCategory(selectedCategory.id);
      }
    }
  };

  const handleRemoveMaterial = (index: number) => {
    const updated = [...materials];
    updated.splice(index, 1);
    setMaterials(updated);
  };

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "globalProcesses" && e.newValue) {
        try {
          const parsedProcesses = JSON.parse(e.newValue);
          const processes = parsedProcesses
            .filter((p: any) => p && p.process_id && p.name)
            .map((p: any) => ({
              process_id: p.process_id.toString(),
              name: p.name,
            }));
          setAvailableProcesses(processes);
        } catch (error) {
          console.error("Error syncing global processes:", error);
        }
      }
    };

    const handleCustomStorageChange = () => {
      if (typeof window !== "undefined") {
        const savedProcesses = localStorage.getItem("globalProcesses");
        if (savedProcesses) {
          try {
            const parsedProcesses = JSON.parse(savedProcesses);
            const processes = parsedProcesses
              .filter((p: any) => p && p.process_id && p.name)
              .map((p: any) => ({
                process_id: p.process_id.toString(),
                name: p.name,
              }));
            setAvailableProcesses(processes);
          } catch (error) {
            console.error("Error syncing global processes:", error);
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("processesUpdated", handleCustomStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("processesUpdated", handleCustomStorageChange);
    };
  }, []);

  const getMaterialColor = (index: number) => {
    const colors = [
      "bg-blue-50 border-blue-200",
      "bg-green-50 border-green-200",
      "bg-purple-50 border-purple-200",
      "bg-orange-50 border-orange-200",
      "bg-pink-50 border-pink-200",
      "bg-cyan-50 border-cyan-200",
      "bg-red-50 border-red-200",
      "bg-yellow-50 border-yellow-200",
    ];
    return colors[index % colors.length];
  };

  const handleOrientationChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setPrintOrientation(event.target.value);
  };

  // Render function for print materials (landscape view)
  const renderPrintMaterial = (
    material: MaterialForm,
    index: number,
    isPrevious = false
  ) => (
    <div key={material.id} className="material-block">
      <div className="material-header">
        <div className="material-title">Material #{index + 1}</div>
        <div className={`material-badge ${isPrevious ? "previous" : "main"}`}>
          {isPrevious ? "Previous Proto" : "Main Proto"}
        </div>
      </div>

      <div className="material-info">
        <div className="material-info-item">
          <span className="material-info-label">Type:</span>
          <span className="material-info-value">{material.type}</span>
        </div>
        <div className="material-info-item">
          <span className="material-info-label">Location:</span>
          <span className="material-info-value">{material.placement}</span>
        </div>
        <div className="material-info-item" style={{ gridColumn: "1 / -1" }}>
          <span className="material-info-label">Name:</span>
          <span className="material-info-value">{material.name}</span>
        </div>
      </div>

      {material.processes.length > 0 && (
        <div className="processes">
          {material.processes.map((process) => (
            <div key={process.process_id} className="process-block">
              <div className="process-title">{process.name}</div>
              {process.fields && process.fields.length > 0 && (
                <div className="process-fields">
                  {process.fields.map((field) => (
                    <div key={field.field_id} className="field-item">
                      <div className="field-label">
                        {field.field_name} {field.is_required && "*"}
                      </div>
                      <input
                        type="text"
                        className="field-input"
                        placeholder={`Enter ${field.field_name.toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full mx-auto px-4 py-6">
      {/* Print Header - Only visible when printing */}
      {isPrintMode && (
        <>
          {/* Main Print Header with adjusted margin */}
          <div className="print-show print-header">
            <h1 className="print-title">
              Materials / Fabrics - {protoName} (ID: {protoId})
            </h1>
            <p className="print-subtitle">
              Generated on {new Date().toLocaleDateString()} •{" "}
              {printOrientation} View •{" "}
              {[...prevProtoMaterials, ...materials].length} Materials
            </p>
          </div>
        </>
      )}

      {/* Landscape Print Layout - Only visible when printing in landscape */}
      {isPrintMode && printOrientation === "landscape" && (
        <>
          <div className="print-show print-container">
            {/* Previous Proto Column */}
            <div className="print-column previous-proto">
              <div className="print-column-header">
                Material Form - {protoName}
              </div>
              {prevProtoMaterials.length === 0 ? (
                <div className="empty-state">
                  No materials in previous proto
                </div>
              ) : (
                prevProtoMaterials.map((material, index) =>
                  renderPrintMaterial(material, index, true)
                )
              )}
            </div>

            {/* Main Proto Column */}
            <div className="print-column main-proto">
              <div className="print-column-header">
                Material Form - {protoName} <small>Main Proto</small>
              </div>
              {materials.length === 0 ? (
                <div className="empty-state">No materials added yet</div>
              ) : (
                materials.map((material, index) =>
                  renderPrintMaterial(material, index, false)
                )
              )}
            </div>
          </div>
        </>
      )}

      {!isPrintMode && (
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3 mb-6">
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
            <h1 className="font-bold text-lg">
              Materials / Fabrics - {protoName} (ID: {protoId})
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <select
              className="border py-1 px-2"
              value={printOrientation}
              onChange={handleOrientationChange}
            >
              <option className="border" value="landscape">
                Landscape
              </option>
              <option className="border" value="portrait">
                Portrait
              </option>
            </select>
            <button
              className="px-3 py-1 border  bg-gray-100 hover:bg-gray-200"
              onClick={handlePrint}
            >
              Print
            </button>
          </div>
        </div>
      )}

      {/* Screen Layout - Show for screen view and portrait print */}
      {(!isPrintMode || (isPrintMode && printOrientation === "portrait")) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Material Form */}
          <div className="bg-white border rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                Material Form - {protoName}
              </h2>
            </div>

            {prevProtoMaterials.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <div className="text-gray-500 text-sm">
                  <svg
                    className="mx-auto w-12 h-12 text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  No materials in previous proto
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {prevProtoMaterials.map((material, index) => (
                  <div
                    key={material.id}
                    className={`material-block mb-6 p-4 rounded-lg border-2 ${getMaterialColor(
                      index
                    )}`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="font-semibold text-gray-800">
                        Material #{index + 1}
                        <span className="text-sm text-orange-600 ml-2">
                          (Previous Proto Material)
                        </span>
                      </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type
                        </label>
                        <input
                          type="text"
                          value={material.type}
                          disabled
                          className="w-full border border-gray-300 px-3 py-2 text-sm bg-gray-100 cursor-not-allowed rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Placement Location
                        </label>
                        <input
                          type="text"
                          value={material.placement}
                          disabled
                          className="w-full border border-gray-300 px-3 py-2 text-sm bg-gray-100 cursor-not-allowed rounded"
                        />
                      </div>
                      <div className="flex items-center">
                        <label className="w-[30%] text-sm font-medium text-gray-700 mb-2">
                          Name:
                        </label>
                        <input
                          type="text"
                          value={material.name}
                          disabled
                          className="w-full border border-gray-300 px-3 py-2 text-sm bg-gray-100 cursor-not-allowed rounded"
                        />
                      </div>
                    </div>

                    {material.processes.length > 0 && (
                      <div className="mt-4 space-y-4">
                        {material.processes.map((process) => (
                          <div
                            key={process.process_id}
                            className="border rounded-lg p-4 bg-white"
                          >
                            <h3 className="font-semibold text-gray-800 mb-3">
                              {process.name}
                            </h3>
                            {process.fields &&
                              process.fields.map((field) => (
                                <div key={field.field_id} className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {field.field_name}
                                    {field.is_required && (
                                      <span className="text-red-500 ml-1">
                                        *
                                      </span>
                                    )}
                                  </label>
                                  {field.data_type.toLowerCase() === "date" ? (
                                    <input
                                      type="date"
                                      disabled
                                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      required={field.is_required}
                                    />
                                  ) : field.data_type.toLowerCase() ===
                                    "time" ? (
                                    <input
                                      type="time"
                                      disabled
                                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      required={field.is_required}
                                    />
                                  ) : (
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        disabled
                                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required={field.is_required}
                                        placeholder={`Enter ${field.field_name.toLowerCase()}`}
                                      />
                                      {field.units &&
                                        field.units.length > 0 && (
                                          <select
                                            disabled
                                            className="border border-gray-300 rounded px-2 py-2 text-sm bg-gray-50"
                                            defaultValue={field.units[0]}
                                          >
                                            {field.units.map(
                                              (unit, unitIndex) => (
                                                <option
                                                  key={unitIndex}
                                                  value={unit}
                                                >
                                                  {unit}
                                                </option>
                                              )
                                            )}
                                          </select>
                                        )}
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Material Form */}
          <div className="bg-white border rounded-lg p-6  page-break-before">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                Material Form - {protoName}
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded ml-2">
                  Main Proto
                </span>
              </h2>
            </div>

            {materials.length === 0 && prevProtoMaterials.length > 0 && (
              <div className="text-center py-12 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
                <div className="text-blue-600 text-sm mb-4">
                  <svg
                    className="mx-auto w-12 h-12 text-blue-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Previous Proto has {prevProtoMaterials.length} material
                  {prevProtoMaterials.length !== 1 ? "s" : ""} but Material Form
                  is empty.
                </div>
                <button
                  onClick={handleAddMaterial}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Add materials to Material Form to balance the structure
                </button>
              </div>
            )}

            {materials.length === 0 && prevProtoMaterials.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
                <div className="text-blue-600 text-sm">
                  <svg
                    className="mx-auto w-12 h-12 text-blue-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  No materials added yet. Start by adding a material.
                </div>
              </div>
            )}

            {materials.map((material, index) => (
              <div
                key={material.id}
                className={`material-block mb-6 p-4 rounded-lg border-2 ${getMaterialColor(
                  index
                )}`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold text-gray-800">
                    Material #{index + 1}
                    {material.isFromPrevProto && (
                      <span className="text-sm text-orange-600 ml-2">
                        (From Previous Proto - Processes Only)
                      </span>
                    )}
                    {!material.isFromPrevProto && (
                      <span className="text-sm text-green-600 ml-2">
                        (Fully Editable)
                      </span>
                    )}
                  </h2>
                  {!material.isFromPrevProto && (
                    <button
                      onClick={() => handleRemoveMaterial(index)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                  {material.isFromPrevProto && (
                    <span className="text-gray-400 text-sm font-medium">
                      Cannot Remove
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={material.type}
                      onChange={(e) =>
                        handleChange(index, "type", e.target.value)
                      }
                      disabled={material.isFromPrevProto}
                      className={`w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        material.isFromPrevProto
                          ? "bg-gray-100 cursor-not-allowed"
                          : "bg-white"
                      }`}
                    >
                      <option value="">Select Type</option>
                      {materialCategories.map((category) => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Placement Location
                    </label>
                    <select
                      value={material.placement}
                      onChange={(e) =>
                        handleChange(index, "placement", e.target.value)
                      }
                      disabled={material.isFromPrevProto}
                      className={`w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        material.isFromPrevProto
                          ? "bg-gray-100 cursor-not-allowed"
                          : "bg-white"
                      }`}
                    >
                      <option value="Body">Body</option>
                      <option value="Collar">Collar</option>
                      <option value="Tag">Tag</option>
                      <option value="Front Placket">Front Placket</option>
                      <option value="Sleeves">Sleeves</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="w-[30%] text-sm font-medium text-gray-700 mb-2">
                      Name :
                    </label>
                    <select
                      className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none"
                      value={material.name}
                      onChange={(e) =>
                        handleChange(index, "name", e.target.value)
                      }
                      disabled={!material.type}
                    >
                      <option value="">Select Material</option>
                      {material.type &&
                        (() => {
                          const selectedCategory = materialCategories.find(
                            (cat) => cat.name === material.type
                          );
                          const materialsForType = selectedCategory
                            ? materialNames[selectedCategory.id] || []
                            : [];
                          return materialsForType.map((mat) => (
                            <option key={mat.id} value={mat.name}>
                              {mat.name}
                            </option>
                          ));
                        })()}
                    </select>
                  </div>
                </div>

                {material.processes.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {material.processes.map((process) => (
                      <ReadOnlyProcess
                        key={process.process_id}
                        process={process}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="border-t border-gray-200 pt-6 mt-6">
              {materials.length > 0 && (
                <div className="text-center text-xs text-gray-500 mb-4">
                  {materials.length} material{materials.length !== 1 ? "s" : ""}{" "}
                  ready for processing • Synced with Previous Proto
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleAddMaterial}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 transition-colors print-hide"
                >
                  + Add material
                </button>

                <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 transition-colors print-hide">
                  Save
                </button>
                <button
                  onClick={() => router.back()}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium border border-gray-300 hover:bg-gray-50 print-hide"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const MaterialsPage = () => {
  return (
    <Suspense fallback={<div className="p-6">Loading materials...</div>}>
      <MaterialsPageContent />
    </Suspense>
  );
};

export default LayoutComponents(MaterialsPage);
