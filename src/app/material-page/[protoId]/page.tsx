/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { useGeneralApiCall } from "../../../services/useGeneralApiCall";
import LayoutComponents from "@/app/layoutComponents";

interface ProcessField {
  field_id: string;
  field_name: string;
  data_type: string;
  is_required: boolean;
  field_value: string; // Added to hold the value for the field's
  field_chosen_unit: string; // Added to hold the chosen unit for the field
  units: string[];
}
interface ProcessFieldForSave {
  field_id: string;
  field_name: string;
  data_type: string;
  is_required: boolean;
  field_value: string; // Added to hold the value for the field's
  field_chosen_unit: string; // Added to hold the chosen unit for the field
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
  visibility?: boolean;
  process_fields?: ProcessField[];
}
interface Processforsave {
  process_id: string;
  process_fields?: ProcessFieldForSave[];
}
type MaterialForm = {
  composition_id: string;
  raw_material_category_id: string;
  raw_material_id: string;
  placement_id: string;
  name: string;
  processes_data: Process[];
  isFromPrevProto?: boolean; // Track if this material came from Previous Proto
};
type MaterialFormForSave = {
  raw_material_id: string;
  placement_id: string;
  processes_data: Processforsave[];
};
export interface PlacementLocation {
  placement_location_id: string;
  placement_location: number;
  name: string;
}

function MaterialsPageContent() {
  const router = useRouter();
  // console.log(params)
  // const { protoId } = params;

  const params = useParams();
  const protoId = params.protoId;
  console.log(protoId);

  const [placements, setPlacements] = useState<PlacementLocation[]>([]);
  const [collectionname, setcollectionname] = useState("");
  const [protonumber, setprotoNumber] = useState("");
  const [sampling_merchant_name, setsampling_merchant_name] = useState("j");
  interface DevelopmentCycle {
    development_cycle_id: string | number;
    development_cycle_name: string;
    // Add other properties if needed
  }
  const [devlopementcycles, setdevlopementcycles] = useState<
    DevelopmentCycle[]
  >([]);
  const [materialssave, setMaterialssave] = useState<MaterialFormForSave[]>([]);
  // State for fetched processes and material categories from API
  const [availableProcesses, setAvailableProcesses] = useState<Process[]>([]);
  const [materialdata, setmaterialdata] = useState<MaterialForm[]>([]);
  const [materialCategories, setMaterialCategories] = useState<
    { raw_material_category_id: number; name: string }[]
  >([]);
  const handleRemoveProcessFromMaterial = (
    materialIndex: number,
    processIndex: number
  ) => {
    // Check if the process exists in prevProtoMaterials with visibility true
    const processInPrevProto =
      prevProtoMaterials[materialIndex]?.processes_data?.[processIndex]
        ?.visibility;
    console.log(processInPrevProto);

    const updatedMaterials = [...materials];
    const prevProtoMaterials1 = [...prevProtoMaterials];

    if (!processInPrevProto) {
      if (
        processInPrevProto !== undefined &&
        prevProtoMaterials1[materialIndex].composition_id ===
          materials[materialIndex].composition_id
      ) {
        updatedMaterials[materialIndex].processes_data[
          processIndex
        ].visibility = true;
      }

      updatedMaterials[materialIndex].processes_data.splice(processIndex, 1);
    } else {
      // If not in prevProtoMaterials with visibility, remove it completely
      updatedMaterials[materialIndex].processes_data.splice(processIndex, 1);
      prevProtoMaterials1[materialIndex].processes_data.splice(processIndex, 1);
    }

    setMaterials(updatedMaterials);
  };
  // Get the API call helper
  const { getApi, postApi } = useGeneralApiCall();
  async function fetchData() {
    const res: {
      data: any;
      error_status: boolean;
      message: string;
    } = await getApi("/proto-composition/" + protoId + "/");
    setsampling_merchant_name(res.data.sampling_merchant_name);
    setprotoNumber(res.data.proto_number);
    setcollectionname(res.data.collection_name);
    setdevlopementcycles(res.data.development_cycles);
    if (!res.error_status) {
      // If compositions is empty, show the structure of previous composition (not data)
      if (!res.data.compositions || res.data.compositions.length === 0) {
        const resq: {
          data: any;
          error_status: boolean;
          message: string;
        } = await getApi(
          "/proto-composition/" + res.data.previous_proto_id + "/"
        );

        setPrevProtoMaterials(resq.data.compositions || []);
        // Set materials to an array of empty objects with the same structure as previous proto compositions
        if (
          Array.isArray(resq.data.compositions) &&
          resq.data.compositions.length > 0
        ) {
          const emptyStructure = resq.data.compositions.map((mat: any) => ({
            ...mat,
            raw_material_category_id: "",
            raw_material_id: "",
            placement_id: mat.placement_id || "",
            processes_data: (mat.processes_data || []).map((proc: any) => ({
              ...proc,
              process_fields: (proc.process_fields || []).map((field: any) => ({
                ...field,
                field_value: "",
                field_chosen_unit:
                  field.units && field.units.length > 0 ? field.units[0] : "",
              })),
            })),
            isFromPrevProto: false,
          }));
          if (Array.isArray(resq.data.compositions)) {
            resq.data.compositions.forEach((mat: any, idx: number) => {
              // Try to get category id from type or raw_material_category_id

              let categoryId = mat.raw_material_category_id;
              // If not present, try to resolve from type string (if your type is a category name)
              if (
                !categoryId &&
                mat.type &&
                Array.isArray(materialCategories)
              ) {
                const found = materialCategories.find(
                  (cat) => cat.name === mat.type
                );
                if (found) categoryId = found.raw_material_category_id;
              }
              if (categoryId) {
                fetchMaterialsByCategory1(categoryId, idx);
              }
            });
          }
          setMaterials(emptyStructure);
          setmaterialdata(emptyStructure);
          setMaterialssave(emptyStructure);
        }
      } else {
        // Normal case: compositions exist
        setMaterials(res.data.compositions);
        setmaterialdata(res.data.compositions);
        setMaterialssave(res.data.compositions);

        try {
          const resq: {
            data: any;
            error_status: boolean;
            message: string;
          } = await getApi(
            "/proto-composition/" + res.data.previous_proto_id + "/"
          );
          setPrevProtoMaterials(resq.data.compositions || []);
          if (Array.isArray(resq.data.compositions)) {
            resq.data.compositions.forEach((mat: any, idx: number) => {
              // Try to get category id from type or raw_material_category_id

              let categoryId = mat.raw_material_category_id;
              // If not present, try to resolve from type string (if your type is a category name)
              if (
                !categoryId &&
                mat.type &&
                Array.isArray(materialCategories)
              ) {
                const found = materialCategories.find(
                  (cat) => cat.name === mat.type
                );
                if (found) categoryId = found.raw_material_category_id;
              }
              if (categoryId) {
                fetchMaterialsByCategory1(categoryId, idx);
              }
            });
          }
        } catch (error) {
          console.error("Error fetching previous proto materials:", error);
        }
        // For each material, if it has a type or raw_material_category_id, fetch its names
        if (Array.isArray(res.data.compositions)) {
          res.data.compositions.forEach((mat: any, idx: number) => {
            // Try to get category id from type or raw_material_category_id
            let categoryId = mat.raw_material_category_id;
            console.log(categoryId + "ok");
            // If not present, try to resolve from type string (if your type is a category name)
            if (!categoryId && mat.type && Array.isArray(materialCategories)) {
              const found = materialCategories.find(
                (cat) => cat.name === mat.type
              );
              if (found) categoryId = found.raw_material_category_id;
            }
            if (categoryId) {
              fetchMaterialsByCategory(categoryId, idx);
            }
          });
        }
      }
    }
  }
  useEffect(() => {
    fetchData();
  }, [getApi, materialCategories]);

  const [saveMessage, setSaveMessage] = useState<string>("");
  function handleSave() {
    setSaveMessage("");
    const payload = materials.map((mat: any) => {
      const includeCompositionId =
        mat.composition_id &&
        !String(mat.composition_id).startsWith("material");
      return {
        ...(includeCompositionId && { composition_id: mat.composition_id }),
        raw_material_id: mat.raw_material_id,
        placement_id: mat.placement_id,
        processes_data: (mat.processes_data || [])
          .filter((proc: any) => !proc.visibility === true) // Only include processes with visibility=true
          .map((proc: any) => ({
            ...(proc.proto_composition_process_id && {
              proto_composition_process_id: proc.proto_composition_process_id,
            }),
            process_id: proc.process_id,
            process_fields: (proc.process_fields || []).map((field: any) => ({
              field_id: field.field_id,
              field_value: field.field_value || "",
              field_chosen_unit: field.field_chosen_unit || "",
            })),
          })),
      };
    });
    const res = postApi("/proto-composition/" + protoId + "/save/", {
      materialssave: payload,
    });
    res
      .then((r) => {
        setSaveMessage(r.message || "Materials saved successfully");
        fetchData();
        setTimeout(() => setSaveMessage(""), 3000);
      })
      .catch((e) => {
        setSaveMessage(
          e instanceof Error ? e.message : "Failed to save materials"
        );
        setTimeout(() => setSaveMessage(""), 3000);
      });
  }
  useEffect(() => {
    const fetchPlacements = async () => {
      try {
        const response: {
          data: { placement_location: PlacementLocation[] };
          error_status: boolean;
          message: string;
        } = await getApi("placement-location/list/");
        console.log(response.data.placement_location);
        if (
          !response.error_status &&
          Array.isArray(response.data.placement_location)
        ) {
          setPlacements(response.data.placement_location);
        } else {
        }
      } catch (error) {
        console.error("Error fetching placement locations:", error);
      }
    };
    fetchPlacements();
  }, [getApi]);

  // Fetch material categories from API
  useEffect(() => {
    const fetchMaterialCategories = async () => {
      try {
        const response = await getApi<any>("raw-material/list-categories/");
        console.log(response.data.raw_material_categories);
        if (
          response &&
          !response.error_status &&
          Array.isArray(response.data.raw_material_categories)
        ) {
          setMaterialCategories(response.data.raw_material_categories);
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
        // Fallback to default processes if API fails
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
  }, [getApi]); // Include getApi in dependencies

  // Get proto parameters from URL

  // Default materials data (used only if no localStorage data exists)
  const getDefaultMaterials = (): MaterialForm[] => [
    // Default materials for a new proto
  ];

  // Initialize state with localStorage data if available, otherwise use defaults
  const [selectedProcesses, setSelectedProcesses] = useState<{
    [key: string]: Process;
  }>({}); // Start with empty object

  // State for Previous Proto materials - load from localStorage of previous proto
  const [prevProtoMaterials, setPrevProtoMaterials] = useState<MaterialForm[]>(
    []
  );

  // Initialize materials state with localStorage data for current proto
  const [materials, setMaterials] = useState<MaterialForm[]>([]);

  const handleAddMaterial = () => {
    const defaultType =
      materialCategories.length > 0 ? materialCategories[0].name : "TRIMS";
    const newMaterial: MaterialForm = {
      composition_id: `material-${Date.now()}`,
      raw_material_category_id: defaultType,
      raw_material_id: "",
      placement_id: "Body",
      processes_data: [],
      name: "",
      isFromPrevProto: false,
    };
    const materialForSave: MaterialFormForSave = {
      raw_material_id: "",
      placement_id: "",
      processes_data: [],
    };
    // If we have a default type, fetch its materials for the new material index
    if (defaultType) {
      const selectedCategory = materialCategories.find(
        (cat) => cat.name === defaultType
      );
      if (selectedCategory) {
        fetchMaterialsByCategory(
          selectedCategory.raw_material_category_id,
          materials.length
        );
      }
    }
    setMaterials((prev) => [...prev, newMaterial]);
    setMaterialssave((prev) => [...prev, materialForSave]);
  };

  // Store material names per material index
  const [materialNames, setMaterialNames] = useState<{ [key: number]: any[] }>(
    {}
  );
  const [materialNamesprev, setMaterialNamesprev] = useState<{
    [key: number]: any[];
  }>({});
  // Search states for material dropdowns
  const [materialSearchTerms, setMaterialSearchTerms] = useState<{
    [key: number]: string;
  }>({});
  const [showMaterialDropdowns, setShowMaterialDropdowns] = useState<{
    [key: number]: boolean;
  }>({});
  // Search states for placement dropdowns
  const [placementSearchTerms, setPlacementSearchTerms] = useState<{
    [key: number]: string;
  }>({});
  const [showPlacementDropdowns, setShowPlacementDropdowns] = useState<{
    [key: number]: boolean;
  }>({});
  // Search states for material category dropdowns
  const [categorySearchTerms, setCategorySearchTerms] = useState<{
    [key: number]: string;
  }>({});
  const [showCategoryDropdowns, setShowCategoryDropdowns] = useState<{
    [key: number]: boolean;
  }>({});
  // Fetch material names for a specific material index
  const fetchMaterialsByCategory = async (
    categoryId: number,
    index: number
  ) => {
    try {
      const response = await getApi<any>(
        `raw-material/list-materials/${categoryId}`
      );
      if (
        response &&
        !response.error_status &&
        Array.isArray(response.data.materials)
      ) {
        setMaterialNames((prev) => ({
          ...prev,
          [index]: response.data.materials,
        }));
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };
  const fetchMaterialsByCategory1 = async (
    categoryId: number,
    index: number
  ) => {
    try {
      const response = await getApi<any>(
        `raw-material/list-materials/${categoryId}`
      );
      if (
        response &&
        !response.error_status &&
        Array.isArray(response.data.materials)
      ) {
        setMaterialNamesprev((prev) => ({
          ...prev,
          [index]: response.data.materials,
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
    console.log(index, field, value);
    const updated = [...materials];
    (updated[index] as any)[field] = value;
    setMaterials(updated);

    if (field === "raw_material_id" || field === "placement_id") {
      console.log("ok");
      const updated1 = [...materialssave];
      (updated1[index] as any)[field] = value;
      console.log(updated1);
      setMaterialssave(updated1);
    }

    // If type field is changed, fetch materials for that category for this material
    if (field === "raw_material_category_id") {
      const selectedCategory = materialCategories.find(
        (cat) => cat.raw_material_category_id === value
      );
      if (selectedCategory) {
        await fetchMaterialsByCategory(
          selectedCategory.raw_material_category_id,
          index
        );
        // Optionally reset the raw_material_id when type changes
        handleChange(index, "raw_material_id", "");
      }
    }
  };
  const handleChange1 = async (
    index: number,
    processindex: number,
    i: number,
    field: string,
    value: any
  ) => {
    const updated = [...materials];
    const fields = updated[index].processes_data[processindex].process_fields;
    if (!fields) return;
    fields[i].field_value = value;
    setMaterials(updated);

    const updated1 = [...materialssave];
    const fields1 = updated1[index].processes_data[processindex].process_fields;
    if (!fields1) return;
    fields1[i].field_value = value;
    setMaterialssave(updated1);
  };

  const handleProcessSelection = (index: number, process: Process) => {
    const selectedProcess = availableProcesses.find(
      (p) => p.process_id === process.process_id
    );
    if (selectedProcess) {
      setSelectedProcesses((prev) => ({
        ...prev,
        [`${index}`]: selectedProcess,
      }));
    }
  };

  const handleAddProcessToMaterial = async (materialIndex: number) => {
    const selectedProcess = selectedProcesses[`${materialIndex}`];
    if (!selectedProcess) return;

    try {
      const response = await getApi(
        `process/process-with-field/${selectedProcess.process_id}/`
      );
      console.log(response.error_status);
      if (response && !response.error_status && response.data) {
        const processData = response.data as {
          processes: [
            {
              process_id: string;
              process_name: string;
              fields: ProcessField[];
            }
          ];
        };
        // Create a new process object with fields
        const processWithFields: Process = {
          process_id: selectedProcess.process_id,
          name: selectedProcess.name,
          visibility: false, // Set visibility to false by default for new processes
          process_fields: processData.processes[0].fields,
        };
        const processWithFields1: Process = {
          process_id: selectedProcess.process_id,
          visibility: true,
          name: selectedProcess.name,
          process_fields: processData.processes[0].fields,
        };
        // Update the material's processes array with the new process including fields
        const updatedMaterials = [...materials];
        const updatedPrevProtoMaterials = [...prevProtoMaterials];
        updatedMaterials[materialIndex].processes_data.push(processWithFields);
        updatedPrevProtoMaterials[materialIndex].processes_data.push(
          processWithFields1
        );
        // console.log(updatedMaterials)
        // const updatedMaterialsforsave = [...materialssave];
        // const newprocess = {
        //   process_id: selectedProcess.process_id,
        //   process_fields: processData.processes[0].fields?.map((field) => (
        //     {
        //       field_id: field.field_id,
        //       field_value: "",
        //       field_chosen_unit: "",
        //     }
        //   )),
        // };
        // updatedMaterialsforsave[materialIndex].processes_data.push(newprocess);
        // console.log("sdfsdf"+updatedMaterialsforsave)
        // setMaterialssave(updatedMaterialsforsave);
        setMaterials(updatedMaterials);
        setPrevProtoMaterials(updatedPrevProtoMaterials);

        // Clear the selected process
        // setSelectedProcesses((prev) => {
        //   const updated = { ...prev };
        //   delete updated[`${materialIndex}`];
        //   return updated;
        // });
      } else {
        console.error("Error fetching process fields:", response?.message);
      }
    } catch (error) {
      console.error("Error adding process to material:", error);
    }
  };

  const handleRemoveMaterial = (index: number) => {
    const updated = [...materials];
    updated.splice(index, 1);
    setMaterials(updated);
    const updatedforsave = [...materialssave];
    updatedforsave.splice(index, 1);
    setMaterialssave(updatedforsave);
  };

  // Function to get different background colors for each material
  const getMaterialColor = (index: number) => {
    const colors = [
      "bg-blue-50 border-blue-200", // Light blue
      "bg-green-50 border-green-200", // Light green
      "bg-purple-50 border-purple-200", // Light purple
      "bg-orange-50 border-orange-200", // Light orange
      "bg-pink-50 border-pink-200", // Light pink
      "bg-cyan-50 border-cyan-200", // Light cyan
      "bg-red-50 border-red-200", // Light red
      "bg-yellow-50 border-yellow-200", // Light yellow
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="w-full mx-auto px-4 py-6">
      {saveMessage && (
        <div
          className={`mb-4 p-3 rounded text-center font-medium ${
            saveMessage.includes("success")
              ? "bg-green-100 text-green-700 border border-green-400"
              : "bg-red-100 text-red-700 border border-red-400"
          }`}
        >
          {saveMessage}
        </div>
      )}
      <div className="flex items-center gap-3 mb-6 justify-between print-hidden1">
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
          Materials / Fabrics - {collectionname} (ID: {protonumber})
        </h1>
        <div className="flex gap-4 align-baseline text-gray-700 p-4 border border-dashed border-gray-300 bg-blue-50">
          <h3 className="font-semibold text-lg mb-3 text-gray-900 uppercase">
            Development Cycles
          </h3>

          <div className="space-y-2 ">
            {(devlopementcycles &&
              devlopementcycles?.map((cycle, idx) => (
                <div
                  key={cycle?.development_cycle_id || idx}
                  className=" p-2 border bg-red-200"
                >
                  <p className="font-medium ">
                    {cycle?.development_cycle_name}
                  </p>
                </div>
              ))) || (
              <p className="text-gray-500">No development cycles assigned</p>
            )}
          </div>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 md:${
          prevProtoMaterials.length > 0 ? "grid-cols-2" : "grid-cols-1"
        } lg:${
          prevProtoMaterials.length > 0 ? "grid-cols-2" : "grid-cols-1"
        } gap-8 print-grid`}
      >
        {/* Current Material Form */}
        {prevProtoMaterials.length !== 0 && prevProtoMaterials.length > 0 && (
          <div
            className={`bg-white border -lg p-6 ${
              protoId === "proto-1" ? "lg:col-span-2" : ""
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                Material Form - {collectionname}
              </h2>
            </div>

            {/* Show message when no materials in Material Form but materials exist in Previous Proto */}
            {prevProtoMaterials.length === 0 &&
              prevProtoMaterials.length > 0 && (
                <div className="text-center py-12 border-2 border-dashed border-blue-300 -lg bg-blue-50">
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
                  </div>
                </div>
              )}

            {/* Show empty state when both sections are empty */}
            {prevProtoMaterials.length === 0 &&
              prevProtoMaterials.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-blue-300 -lg bg-blue-50">
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

            {prevProtoMaterials.map((prevProtoMaterials, index) => (
              <div
                key={prevProtoMaterials.composition_id}
                className={`mb-6 p-4 -lg border-2 ${getMaterialColor(index)}`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold text-gray-800">
                    Material #{index + 1}
                    {!prevProtoMaterials.isFromPrevProto && (
                      <span className="text-sm text-orange-600 ml-2">
                        (From Previous Proto - Not Editable)
                      </span>
                    )}
                  </h2>
                </div>

                {/* Three dropdowns in a row - conditionally editable */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={prevProtoMaterials.raw_material_category_id}
                      onChange={(e) =>
                        handleChange(
                          index,
                          "raw_material_category_id",
                          e.target.value
                        )
                      }
                      className={`w-full border border-gray-300  px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 cursor-not-allowed`}
                    >
                      <option value="">Select Type</option>
                      {materialCategories.map((category) => (
                        <option
                          key={category.raw_material_category_id}
                          value={category.raw_material_category_id}
                        >
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
                      disabled
                      value={prevProtoMaterials.placement_id}
                      onChange={(e) =>
                        handleChange(index, "placement_id", e.target.value)
                      }
                      className={`w-full border border-gray-300  px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 cursor-not-allowed`}
                    >
                      <option value="">Select Placement</option>
                      {placements.map((placement) => (
                        <option
                          key={placement.placement_location_id}
                          value={placement.placement_location_id}
                        >
                          {placement.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="w-[30%] text-sm font-medium text-gray-700 mb-2">
                      Name :
                    </label>
                    <select
                      className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none bg-gray-100 cursor-not-allowed"
                      value={prevProtoMaterials.raw_material_id}
                      onChange={(e) =>
                        handleChange(index, "raw_material_id", e.target.value)
                      }
                    >
                      <option value="">Select Material</option>
                      {materialNamesprev[index] &&
                        materialNamesprev[index].map((mat: any) => (
                          <option
                            key={mat.raw_material_id}
                            value={mat.raw_material_id}
                          >
                            {mat.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Display added processes and their fields */}
                {prevProtoMaterials.processes_data.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {prevProtoMaterials.processes_data.map(
                      (process, processindex) => (
                        <div
                          key={process.process_id}
                          style={{
                            backgroundColor: process.visibility
                              ? "#f3f4f6"
                              : "white",
                          }}
                          className={`border rounded-lg p-4`}
                        >
                          <h3
                            style={{
                              visibility: process.visibility
                                ? "hidden"
                                : "visible",
                            }}
                            className="font-semibold text-gray-800 mb-3"
                          >
                            {process.name || process.name}
                          </h3>
                          {process.process_fields &&
                            process.process_fields.map((field, i) => (
                              <div
                                key={field.field_id}
                                style={{
                                  visibility: process.visibility
                                    ? "hidden"
                                    : "visible",
                                }}
                                className="mb-4"
                              >
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  {field.field_name}
                                  {field.is_required && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </label>
                                {field.data_type === "date1" ? (
                                  <input
                                    onChange={(e) =>
                                      handleChange1(
                                        index,
                                        processindex,
                                        i,
                                        "field_value",
                                        e.target.value
                                      )
                                    }
                                    type="date"
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required={field.is_required}
                                  />
                                ) : field.data_type === "time1" ? (
                                  <input
                                    onChange={(e) =>
                                      handleChange1(
                                        index,
                                        processindex,
                                        i,
                                        "field_value",
                                        e.target.value
                                      )
                                    }
                                    type="time"
                                    className={`w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                      process.visibility ? "hidden" : ""
                                    }`}
                                    required={field.is_required}
                                  />
                                ) : (
                                  <div className="flex gap-2">
                                    <input
                                      disabled
                                      onChange={(e) =>
                                        handleChange1(
                                          index,
                                          processindex,
                                          i,
                                          "field_value",
                                          e.target.value
                                        )
                                      }
                                      type="text"
                                      value={field.field_value}
                                      style={{
                                        visibility: process.visibility
                                          ? "hidden"
                                          : "visible",
                                      }}
                                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 cursor-not-allowed"
                                      required={field.is_required}
                                      placeholder={`Enter ${field.field_name}`}
                                    />
                                    {field.units && field.units.length > 0 && (
                                      <select
                                        onChange={(e) =>
                                          handleChange1(
                                            index,
                                            processindex,
                                            i,
                                            "unit",
                                            e.target.value
                                          )
                                        }
                                        className="border border-gray-300 rounded px-2 py-2 text-sm bg-gray-50"
                                        defaultValue={field.units[0]}
                                      >
                                        {field.units.map((unit, unitIndex) => (
                                          <option key={unitIndex} value={unit}>
                                            {unit}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Add Process Section - Only show if there are processes left to add */}
              </div>
            ))}
          </div>
        )}
        <div
          className={`bg-white border -lg p-6 ${
            protoId === "proto-1" ? "lg:col-span-2" : ""
          }`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Material Form - {collectionname}
            </h2>
            <button
              onClick={handleAddMaterial}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2  transition-colors"
            >
              + Add Material
            </button>
          </div>

          {/* Show message when no materials in Material Form but materials exist in Previous Proto */}
          {materials.length === 0 && prevProtoMaterials.length > 0 && (
            <div className="text-center py-12 border-2 border-dashed border-blue-300 -lg bg-blue-50">
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

          {/* Show empty state when both sections are empty */}
          {materials.length === 0 && prevProtoMaterials.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-blue-300 -lg bg-blue-50">
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
              key={material.composition_id}
              className={`mb-6 p-4 -lg border-2 ${getMaterialColor(index)}`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-gray-800">
                  Material #{index + 1}
                  {material.isFromPrevProto && (
                    <span className="text-sm text-orange-600 ml-2">
                      (From Previous Proto)
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

              {/* Three dropdowns in a row - conditionally editable */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={material.raw_material_category_id}
                    onChange={(e) =>
                      handleChange(
                        index,
                        "raw_material_category_id",
                        e.target.value
                      )
                    }
                    className={`w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      material.isFromPrevProto
                        ? "bg-gray-100 cursor-not-allowed"
                        : "bg-white"
                    }`}
                    disabled={material.isFromPrevProto}
                  >
                    <option value="">Select Type</option>
                    {materialCategories.map((category) => (
                      <option
                        key={category.raw_material_category_id}
                        value={category.raw_material_category_id}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Placement Location
                  </label>
                  <div className="relative w-full">
                    <input
                      type="text"
                      disabled={
                        // Allow editing if composition_id starts with "material" (new material)
                        material.composition_id.startsWith("material")
                          ? false
                          : true
                      }
                      className={`w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        material.composition_id.startsWith("material")
                          ? "bg-white"
                          : "bg-gray-100 cursor-not-allowed"
                      }`}
                      placeholder="Search and select placement..."
                      value={
                        placementSearchTerms[index] !== undefined
                          ? placementSearchTerms[index]
                          : material.placement_id
                          ? placements.find(
                              (placement) =>
                                placement.placement_location_id ===
                                material.placement_id
                            )?.name || ""
                          : ""
                      }
                      onChange={(e) => {
                        const searchTerm = e.target.value;
                        setPlacementSearchTerms((prev) => ({
                          ...prev,
                          [index]: searchTerm,
                        }));
                        setShowPlacementDropdowns((prev) => ({
                          ...prev,
                          [index]: true,
                        }));
                        // Clear selection if search term doesn't match current selection
                        if (material.placement_id) {
                          const currentPlacement = placements.find(
                            (placement) =>
                              placement.placement_location_id ===
                              material.placement_id
                          );
                          if (
                            currentPlacement &&
                            !currentPlacement.name
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase())
                          ) {
                            handleChange(index, "placement_id", "");
                          }
                        }
                      }}
                      onFocus={() => {
                        if (material.composition_id.startsWith("material")) {
                          setShowPlacementDropdowns((prev) => ({
                            ...prev,
                            [index]: true,
                          }));
                        }
                      }}
                      onBlur={(e) => {
                        // Only hide if clicking outside the dropdown container
                        const relatedTarget = e.relatedTarget as HTMLElement;
                        if (
                          !relatedTarget ||
                          !relatedTarget.closest(".dropdown-container")
                        ) {
                          setTimeout(() => {
                            setShowPlacementDropdowns((prev) => ({
                              ...prev,
                              [index]: false,
                            }));
                          }, 150);
                        }
                      }}
                    />
                    {/* Dropdown options */}
                    {showPlacementDropdowns[index] &&
                      material.composition_id.startsWith("material") && (
                        <div
                          className="dropdown-container absolute z-20 w-full bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-hidden mt-1"
                          style={{ top: "100%" }}
                          onMouseDown={(e) => {
                            // Prevent the dropdown from closing when clicking inside it
                            e.preventDefault();
                          }}
                        >
                          {/* Search header */}
                          <div className="p-3 border-b border-gray-200 bg-gray-50">
                            <div className="relative">
                              <svg
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                              </svg>
                              <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Search placements..."
                                value={placementSearchTerms[index] || ""}
                                onChange={(e) => {
                                  const searchTerm = e.target.value;
                                  setPlacementSearchTerms((prev) => ({
                                    ...prev,
                                    [index]: searchTerm,
                                  }));
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                }}
                                onFocus={(e) => {
                                  e.stopPropagation();
                                }}
                                autoFocus
                              />
                            </div>
                          </div>

                          {/* Options list */}
                          <div className="max-h-60 overflow-y-auto">
                            {placements
                              .filter((placement) => {
                                const searchTerm =
                                  placementSearchTerms[index] || "";
                                return placement.name
                                  .toLowerCase()
                                  .includes(searchTerm.toLowerCase());
                              })
                              .map((placement) => (
                                <div
                                  key={placement.placement_location_id}
                                  className="px-4 py-3 cursor-pointer hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0 transition-colors"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleChange(
                                      index,
                                      "placement_id",
                                      placement.placement_location_id
                                    );
                                    setPlacementSearchTerms((prev) => ({
                                      ...prev,
                                      [index]: placement.name,
                                    }));
                                    setShowPlacementDropdowns((prev) => ({
                                      ...prev,
                                      [index]: false,
                                    }));
                                  }}
                                >
                                  <div className="font-medium text-gray-900">
                                    {placement.name}
                                  </div>
                                </div>
                              ))}
                            {placements.filter((placement) => {
                              const searchTerm =
                                placementSearchTerms[index] || "";
                              return placement.name
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase());
                            }).length === 0 && (
                              <div className="px-4 py-8 text-center text-sm text-gray-500">
                                No placements found matching &ldquo;
                                {placementSearchTerms[index] || ""}&rdquo;
                                <br />
                                add New Placement Location and refresh the page.
                              </div>
                            )}
                            {placements.length === 0 && (
                              <div className="px-4 py-8 text-center text-sm text-gray-500">
                                <svg
                                  className="mx-auto w-8 h-8 text-gray-300 mb-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                                No placements available
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
                <div className="flex items-center">
                  <label className="w-[30%] text-sm font-medium text-gray-700 mb-2">
                    Name :
                  </label>
                  <div className="relative w-full">
                    <input
                      type="text"
                      className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="Search and select material..."
                      value={
                        materialSearchTerms[index] !== undefined
                          ? materialSearchTerms[index]
                          : material.raw_material_id
                          ? materialNames[index]?.find(
                              (mat) =>
                                mat.raw_material_id === material.raw_material_id
                            )?.name || ""
                          : ""
                      }
                      onChange={(e) => {
                        const searchTerm = e.target.value;
                        setMaterialSearchTerms((prev) => ({
                          ...prev,
                          [index]: searchTerm,
                        }));
                        setShowMaterialDropdowns((prev) => ({
                          ...prev,
                          [index]: true,
                        }));
                        // Clear selection if search term doesn't match current selection
                        if (material.raw_material_id) {
                          const currentMaterial = materialNames[index]?.find(
                            (mat) =>
                              mat.raw_material_id === material.raw_material_id
                          );
                          if (
                            currentMaterial &&
                            !currentMaterial.name
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase())
                          ) {
                            handleChange(index, "raw_material_id", "");
                          }
                        }
                      }}
                      onFocus={() => {
                        setShowMaterialDropdowns((prev) => ({
                          ...prev,
                          [index]: true,
                        }));
                      }}
                      onBlur={(e) => {
                        // Only hide if clicking outside the dropdown container
                        const relatedTarget = e.relatedTarget as HTMLElement;
                        if (
                          !relatedTarget ||
                          !relatedTarget.closest(".dropdown-container")
                        ) {
                          setTimeout(() => {
                            setShowMaterialDropdowns((prev) => ({
                              ...prev,
                              [index]: false,
                            }));
                          }, 150);
                        }
                      }}
                    />
                    {/* Dropdown options */}
                    {showMaterialDropdowns[index] && (
                      <div
                        className="dropdown-container absolute z-20 w-full bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-hidden mt-1"
                        style={{ top: "100%" }}
                        onMouseDown={(e) => {
                          // Prevent the dropdown from closing when clicking inside it
                          e.preventDefault();
                        }}
                      >
                        {/* Search header */}
                        <div className="p-3 border-b border-gray-200 bg-gray-50">
                          <div className="relative">
                            <svg
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
                            </svg>
                            <input
                              type="text"
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Search materials..."
                              value={materialSearchTerms[index] || ""}
                              onChange={(e) => {
                                const searchTerm = e.target.value;
                                setMaterialSearchTerms((prev) => ({
                                  ...prev,
                                  [index]: searchTerm,
                                }));
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                              }}
                              onFocus={(e) => {
                                e.stopPropagation();
                              }}
                              autoFocus
                            />
                          </div>
                        </div>

                        {/* Options list */}
                        <div className="max-h-60 overflow-y-auto">
                          {materialNames[index] &&
                            materialNames[index]
                              .filter((mat: any) => {
                                const searchTerm =
                                  materialSearchTerms[index] || "";
                                return mat.name
                                  .toLowerCase()
                                  .includes(searchTerm.toLowerCase());
                              })
                              .map((mat: any) => (
                                <div
                                  key={mat.raw_material_id}
                                  className="px-4 py-3 cursor-pointer hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0 transition-colors"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleChange(
                                      index,
                                      "raw_material_id",
                                      mat.raw_material_id
                                    );
                                    setMaterialSearchTerms((prev) => ({
                                      ...prev,
                                      [index]: mat.name,
                                    }));
                                    setShowMaterialDropdowns((prev) => ({
                                      ...prev,
                                      [index]: false,
                                    }));
                                  }}
                                >
                                  <div className="font-medium text-gray-900">
                                    {mat.name}
                                  </div>
                                </div>
                              ))}
                          {materialNames[index] &&
                            materialNames[index].filter((mat: any) => {
                              const searchTerm =
                                materialSearchTerms[index] || "";
                              return mat.name
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase());
                            }).length === 0 && (
                              <div className="px-4 py-8 text-center text-sm text-gray-500">
                                No materials found matching &ldquo;
                                {materialSearchTerms[index] || ""}&rdquo;
                                <br />
                                add New Material and refresh the page.
                              </div>
                            )}
                          {(!materialNames[index] ||
                            materialNames[index].length === 0) && (
                            <div className="px-4 py-8 text-center text-sm text-gray-500">
                              <svg
                                className="mx-auto w-8 h-8 text-gray-300 mb-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                />
                              </svg>
                              No materials available
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Display added processes and their fields */}
              {material.processes_data.length > 0 && (
                <div className="mt-4 space-y-4">
                  {material.processes_data.map((process, processindex) => (
                    <div
                      key={process.process_id}
                      className={`border rounded-lg p-4 ${
                        process.visibility ? "bg-gray-100" : "bg-white"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h3
                          className={`font-semibold ${
                            process.visibility
                              ? "text-gray-400"
                              : "text-gray-800"
                          }`}
                        >
                          {process.name || process.name}
                          {process.visibility && (
                            <span className="text-xs ml-2">(Hidden)</span>
                          )}
                        </h3>
                        <button
                          className={`text-xs font-medium ml-2 border rounded px-2 py-1 ${
                            process.visibility
                              ? "text-green-500 hover:text-green-700 border-green-200"
                              : "text-red-500 hover:text-red-700 border-red-200"
                          }`}
                          onClick={() => {
                            if (process.visibility) {
                              // Restore process
                              const updatedMaterials = [...materials];
                              updatedMaterials[index].processes_data[
                                processindex
                              ].visibility = false;
                              setMaterials(updatedMaterials);
                            } else {
                              // Hide process
                              handleRemoveProcessFromMaterial(
                                index,
                                processindex
                              );
                            }
                          }}
                        >
                          {process.visibility
                            ? "Restore Process"
                            : "Remove Process"}
                        </button>
                      </div>
                      {process.process_fields &&
                        process.process_fields.map((field, i) => (
                          <div key={field.field_id} className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {field.field_name}
                              {field.is_required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </label>
                            {field.data_type === "date" ? (
                              <input
                                onChange={(e) =>
                                  handleChange1(
                                    index,
                                    processindex,
                                    i,
                                    "field_value",
                                    e.target.value
                                  )
                                }
                                type="date"
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required={field.is_required}
                              />
                            ) : field.data_type === "time" ? (
                              <input
                                onChange={(e) =>
                                  handleChange1(
                                    index,
                                    processindex,
                                    i,
                                    "field_value",
                                    e.target.value
                                  )
                                }
                                type="time"
                                disabled={process.visibility}
                                className={`w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  process.visibility
                                    ? "bg-gray-50 text-gray-400"
                                    : ""
                                }`}
                                required={field.is_required}
                              />
                            ) : (
                              <div className="flex gap-2">
                                <input
                                  onChange={(e) =>
                                    handleChange1(
                                      index,
                                      processindex,
                                      i,
                                      "field_value",
                                      e.target.value
                                    )
                                  }
                                  type="text"
                                  value={field.field_value}
                                  disabled={process.visibility}
                                  className={`flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    process.visibility
                                      ? "bg-gray-50 text-gray-400"
                                      : ""
                                  }`}
                                  required={field.is_required}
                                  placeholder={`Enter ${field.field_name}`}
                                />
                                {field.units && field.units.length > 0 && (
                                  <select
                                    onChange={(e) =>
                                      handleChange1(
                                        index,
                                        processindex,
                                        i,
                                        "unit",
                                        e.target.value
                                      )
                                    }
                                    className="border border-gray-300 rounded px-2 py-2 text-sm bg-gray-50"
                                    defaultValue={field.units[0]}
                                  >
                                    {field.units.map((unit, unitIndex) => (
                                      <option key={unitIndex} value={unit}>
                                        {unit}
                                      </option>
                                    ))}
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

              {/* Add Process Section - Only show if there are processes left to add */}
              {availableProcesses.filter(
                (proc) =>
                  !material.processes_data.find(
                    (p) => p.process_id === proc.process_id
                  )
              ).length > 0 && (
                <div className="border-t border-gray-200  mt-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">
                      Add process
                    </span>
                    <select
                      className="border border-gray-300  px-3 py-2 text-sm bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 min-w-24"
                      onChange={(e) =>
                        handleProcessSelection(index, {
                          process_id: e.target.value,
                          name: e.target.options[e.target.selectedIndex].text,
                        })
                      }
                    >
                      <option value="">Select process</option>
                      {availableProcesses
                        .filter(
                          (proc) =>
                            !material.processes_data.find(
                              (p) => p.process_id === proc.process_id
                            )
                        )
                        .map((proc) => (
                          <option key={proc.process_id} value={proc.process_id}>
                            {proc.name}
                          </option>
                        ))}
                    </select>
                    <button
                      className="flex-1 border border-gray-300  px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={() => handleAddProcessToMaterial(index)}
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {/* Message when all processes are added */}
              {availableProcesses.filter(
                (proc) =>
                  !material.processes_data.find(
                    (p) => p.process_id === proc.process_id
                  )
              ).length === 0 && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="text-center text-sm text-gray-500 italic">
                    All available processes have been added to this material
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Bottom Section with Action Buttons */}
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
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3  transition-colors"
              >
                + Add material
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3  transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => router.back()}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium border border-gray-300  hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
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
