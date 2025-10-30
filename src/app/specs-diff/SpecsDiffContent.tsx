/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { Suspense, useCallback, useEffect, useState } from "react";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useGeneralApiCall } from "@/services/useGeneralApiCall";
import { useRouter, useSearchParams } from "next/navigation";
import SpecsTable from "@/components/SpecsTable";
import CreateProtoSpecs from "@/components/CreateProtoSpecs";
import AddNewRow from "@/components/AddNewRow";
import SpecsConfirmationModal from "@/components/SpecsConfirmationModal";
import {
  ProtoSpecsResponse,
  Row,
  TechSpecDetailResponse,
  TechSpecListResponse,
} from "@/types/Specs";

const SpecsDiffContent: React.FC = () => {
  const { getApi, postApi } = useGeneralApiCall();
  const [tableVersions, setTableVersions] = useState<Row[][]>([]);

  const router = useRouter();

  // api integration
  const [techSpecList, setTechSpecList] = useState<TechSpecListResponse | null>(
    null
  );
  const [techSpecId, setTechSpecId] = useState<string>("");
  const [techSpecName, setTechSpecName] = useState<string>("");
  // const [tableData, setTableData] = useState<any | null>(null);
  const [specs, setSpecs] = useState<ProtoSpecsResponse | null>(null);
  const [prevSpecs, setPrevSpecs] = useState<ProtoSpecsResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isEditingProto, setIsEditingProto] = useState(false);

  // State for CRUD operations on the last table
  const [editingData, setEditingData] = useState<Row[]>([]);
  const [originalData, setOriginalData] = useState<Row[]>([]);

  const [currentProtoSubmitted, setCurrentProtoSubmitted] = useState(false);
  const protoNumber = specs?.proto_number ?? 1;

  // Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "warning" as "danger" | "warning" | "info",
  });

  const [showSpecsConfirm, setShowSpecsConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "create" | "update" | null
  >(null);

  // Loading state
  const [submitting, setSubmitting] = useState(false);

  const params = useSearchParams();
  const proto_id = params.get("protoId");
  const prevProtoId = specs?.previous_proto_id;

  useEffect(() => {
    if (proto_id) {
      setCurrentProtoSubmitted(Boolean(specs?.rows && specs.rows.length > 0));
    }
  }, [proto_id, specs]);

  const fetchInitialData = useCallback(async () => {
    try {
      const response = await getApi<TechSpecListResponse>(
        "/tech-spec/template/list/"
      );
      if (response.status === 200) {
        setTechSpecList(response.data);
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  }, [getApi]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const specTemplatesData = useCallback(async () => {
    try {
      const response = await getApi<TechSpecDetailResponse>(
        `/tech-spec/template/${techSpecId}/`
      );
      if (response.status === 200) {
        // setTableData(response.data);
        const initialData = response.data.measurements.map((measurement) => ({
          measurement_id: measurement.measurement_id,
          header: measurement.header,
          measurement_name: measurement.measurement_name,
          location: measurement.location,
          left_value: "",
          right_value: "",
          _isNewRow: false,
          _isEdited: false,
        }));
        setEditingData(initialData);
        setOriginalData(JSON.parse(JSON.stringify(initialData)));
      }
    } catch (error) {
      console.error("Error fetching spec templates:", error);
    }
    return [];
  }, [techSpecId, getApi]);

  useEffect(() => {
    if (techSpecId) specTemplatesData();
  }, [techSpecId, specTemplatesData]);

  const getProtoSpecs = useCallback(async () => {
    try {
      const res = await getApi<ProtoSpecsResponse>(
        `/tech-spec/${proto_id}/get-specs/`
      );

      setSpecs(res.data);
    } catch (error) {
      console.log("Error fetching proto specs", error);
    }
  }, [getApi, proto_id]);

  useEffect(() => {
    getProtoSpecs();
  }, [getProtoSpecs]);

  const getPrevProtoSpecs = useCallback(async () => {
    try {
      const res = await getApi<ProtoSpecsResponse>(
        `/tech-spec/${prevProtoId}/get-specs/`
      );
      setPrevSpecs(res.data);
    } catch (error) {
      console.log("Error fetching proto specs", error);
    }
  }, [getApi, prevProtoId]);

  useEffect(() => {
    if (prevProtoId) getPrevProtoSpecs();
  }, [getPrevProtoSpecs, prevProtoId]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = (): boolean => {
    const hasNewRows = editingData.some((row) => row._isNewRow);
    const hasEditedRows = editingData.some((row, index) => {
      const originalRow = originalData[index];
      if (!originalRow) return false;
      return (
        row.header !== originalRow.header ||
        row.measurement_name !== originalRow.measurement_name ||
        row.location !== originalRow.location ||
        row.left_value !== originalRow.left_value ||
        row.right_value !== originalRow.right_value
      );
    });
    const hasRemovedRows =
      originalData.length > editingData.filter((row) => !row._isNewRow).length;
    return hasNewRows || hasEditedRows || hasRemovedRows;
  };

  // Handle template selection with unsaved changes warning
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTemplate = techSpecList?.templates?.find(
      (template) => template.template_id === e.target.value
    );

    if (selectedTemplate) {
      if (hasUnsavedChanges()) {
        setConfirmModal({
          isOpen: true,
          title: "Unsaved Changes Detected",
          message:
            "You have unsaved changes (new rows, edited data, or modifications). Changing the template will discard all your current work. Are you sure you want to continue?",
          type: "warning",
          onConfirm: () => {
            setTechSpecId(selectedTemplate.template_id);
            setTechSpecName(selectedTemplate.name);
            setConfirmModal({ ...confirmModal, isOpen: false });
          },
        });
      } else {
        setTechSpecId(selectedTemplate.template_id);
        setTechSpecName(selectedTemplate.name);
      }
    }
  };

  // Handle input changes for existing rows
  const handleRowInputChange = (
    index: number,
    field: keyof Row,
    value: string
  ) => {
    console.log(index, field, value);
    setEditingData((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
        _isEdited:
          originalData[index] && value !== originalData[index][field]
            ? true
            : false,
      };
      return updated;
    });
  };

  useEffect(() => {
    if (tableVersions.length > 0) {
      const lastVersion = tableVersions[tableVersions.length - 1];
      setEditingData(
        lastVersion.map((row) => ({
          collection_spec_id: row.collection_spec_id,
          proto_spec_id: row.proto_spec_id,
          header: row.header,
          measurement_name: row.measurement_name,
          location: row.location,
          left_value: "",
          right_value: "",
        }))
      );
    }
  }, [tableVersions]);

  useEffect(() => {
    if (protoNumber === 1 && specs && specs.rows.length > 0) {
      setTableVersions([
        specs.rows.map((row) => ({
          collection_spec_id: row.collection_spec_id,
          proto_spec_id: row.proto_spec_id,
          header: row.header,
          measurement_name: row.measurement_name,
          location: row.location,
          left_value: row.left_value?.toString() ?? "",
          right_value: row.right_value?.toString() ?? "",
        })),
      ]);
    } else if (protoNumber > 1 && prevSpecs && prevSpecs.rows.length > 0) {
      setTableVersions([
        prevSpecs.rows.map((row) => ({
          collection_spec_id: row.collection_spec_id,
          proto_spec_id: row.proto_spec_id,
          header: row.header,
          measurement_name: row.measurement_name,
          location: row.location,
          left_value: row.left_value?.toString() ?? "",
          right_value: row.right_value?.toString() ?? "",
        })),
      ]);
    }
  }, [protoNumber, specs, prevSpecs]);

  useEffect(() => {
    if (protoNumber > 1 && prevProtoId) {
      getPrevProtoSpecs();
    }
  }, [getPrevProtoSpecs, protoNumber, prevProtoId]);

  // Remove row function
  const removeRow = (index: number) => {
    const updatedData = editingData.filter((_, i) => i !== index);
    setEditingData(updatedData);
  };

  const mappedSpecsRows = specs?.rows.map((row) => ({
    collection_spec_id: row.collection_spec_id,
    proto_spec_id: row.proto_spec_id,
    header: row.header,
    measurement_name: row.measurement_name,
    location: row.location,
    left_value:
      row.left_value !== null && row.left_value !== undefined
        ? row.left_value.toString()
        : "",
    right_value:
      row.right_value !== null && row.right_value !== undefined
        ? row.right_value.toString()
        : "",
  }));

  const mappedPrevSpecsRows = prevSpecs?.rows.map((row) => ({
    collection_spec_id: row.collection_spec_id,
    proto_spec_id: row.proto_spec_id,
    header: row.header,
    measurement_name: row.measurement_name,
    location: row.location,
    left_value:
      row.left_value !== null && row.left_value !== undefined
        ? row.left_value.toString()
        : "",
    right_value:
      row.right_value !== null && row.right_value !== undefined
        ? row.right_value.toString()
        : "",
  }));

  const isRowNewForPrev = (row: Row, prevRows: Row[]) =>
    !prevRows.some(
      (prev) =>
        prev.header === row.header &&
        prev.measurement_name === row.measurement_name &&
        prev.location === row.location
    );

  // Prepare preview rows for previous proto table
  const previewPrevRows = [
    ...(mappedPrevSpecsRows ?? []),
    ...editingData
      .filter((row) => isRowNewForPrev(row, mappedPrevSpecsRows ?? []))
      .map((row) => ({
        ...row,
        left_value: "",
        right_value: "",
        collection_spec_id: undefined, // so it doesn't match any existing
      })),
  ];

  // Submit all changes to create a new version (Combined save and submit)
  const submitNewVersion = async () => {
    if (editingData.length === 0) {
      return;
    } else if (
      editingData.some(
        (row) => row.left_value.trim() === "" && row.right_value.trim() !== ""
      )
    ) {
      setError(
        "Please fill in leftValue for each row before filling in rightValue"
      );
      return;
    }

    try {
      setSubmitting(true);

      // Build payload
      const payload = editingData.map((row) => {
        if (row.collection_spec_id) {
          // Existing row
          return {
            spec_id: row.collection_spec_id,
            header: row.header,
            measurement_name: row.measurement_name,
            location: row.location,
            left_value: row.left_value,
            right_value: row.right_value,
          };
        } else {
          // New row
          return {
            header: row.header,
            measurement_name: row.measurement_name,
            location: row.location,
            left_value: row.left_value,
            right_value: row.right_value,
          };
        }
      });

      const response = await postApi(`/tech-spec/${proto_id}/create-specs/`, {
        payload,
      });

      if (response.status === 200 || response.status === 201) {
        setTableVersions([...tableVersions, [...editingData]]);
        setEditingData([...editingData]);
        setCurrentProtoSubmitted(true);
        getProtoSpecs();
        getPrevProtoSpecs();
      }
    } catch (error) {
      console.error("Error creating version:", error);
      setError("Failed to create version. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitFirstVersion = async () => {
    if (editingData.length === 0) {
      return;
    } else if (
      editingData.some(
        (row) => row.left_value.trim() === "" && row.right_value.trim() !== ""
      )
    ) {
      setError(
        "Please fill in leftValue for each row before filling in rightValue"
      );
      return;
    }

    setSubmitting(true);

    const payload = editingData
      .filter(
        (row) => row.left_value.trim() !== "" || row.right_value.trim() !== ""
      )
      .map((row) => ({
        header: row.header,
        measurement_name: row.measurement_name,
        location: row.location,
        left_value: row.left_value,
        right_value: row.right_value,
      }));

    try {
      const response = await postApi(
        `${process.env.NEXT_PUBLIC_API_URL}/tech-spec/${proto_id}/first-specs/`,
        { payload }
      );

      if (response.status === 201) {
        setError(null);
        setTableVersions([...tableVersions, [...editingData]]);
        setEditingData([...editingData]);
        getProtoSpecs();
        // setShowTemplateSelection(false);
      }
    } catch (error) {
      console.error("Error submitting first specs:", error);
      setError("Error submitting first specs");
    } finally {
      setSubmitting(false);
    }
  };

  const submitEditProto = async () => {
    if (editingData.length === 0) {
      return;
    } else if (
      editingData.some(
        (row) => row.left_value.trim() === "" && row.right_value.trim() !== ""
      )
    ) {
      setError(
        "Please fill in leftValue for each row before filling in rightValue"
      );
      return;
    }

    setSubmitting(true);

    // Build payload from editingData
    const payload = editingData.map((row) => {
      if (row.proto_spec_id) {
        // Existing row
        return {
          spec_id: row.proto_spec_id,
          header: row.header,
          measurement_name: row.measurement_name,
          location: row.location,
          left_value: row.left_value,
          right_value: row.right_value,
        };
      } else {
        // New row
        return {
          header: row.header,
          measurement_name: row.measurement_name,
          location: row.location,
          left_value: row.left_value,
          right_value: row.right_value,
        };
      }
    });

    try {
      const response = await postApi(`/tech-spec/${proto_id}/update-specs/`, {
        payload,
      });
      if (response.status === 200 || response.status === 201) {
        setCurrentProtoSubmitted(true);
        setIsEditingProto(false);
        // Optionally refresh proto specs
        getProtoSpecs();
        getPrevProtoSpecs();
      }
    } catch (error) {
      console.error("Error editing proto:", error);
      setError("Error editing proto. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Close confirmation modal
  const closeConfirmModal = () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const handleConfirmSpecs = async () => {
    if (pendingAction === "create") {
      if (protoNumber === 1) {
        await submitFirstVersion();
      } else {
        await submitNewVersion();
      }
    } else if (pendingAction === "update") {
      await submitEditProto();
    }
    setShowSpecsConfirm(false);
    setPendingAction(null);
  };

  // Calculate current unsaved changes for display
  const currentChanges = {
    newRows: editingData.filter((row) => row._isNewRow).length,
    editedRows: editingData.filter((row) => row._isEdited && !row._isNewRow)
      .length,
    hasChanges: hasUnsavedChanges(),
  };

  const hasProto1Specs =
    protoNumber === 1 && specs && specs.rows && specs.rows.length > 0;

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center">Loading...</div>
      }
    >
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white flex items-start gap-12 p-4 border-b border-gray-200 py-6">
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
          <div className="flex flex-1 justify-between items-start">
            <div className="flex flex-col flex-1 gap-2">
              <h1 className="text-3xl font-bold text-gray-900 mb-3 capitalize">
                Garment Specs - {specs?.collection_name}
              </h1>
              <div className="flex justify-center text-xl flex-col mb-3">
                <p className="capitalize">
                  Sampling Merchant: {specs?.sampling_merchant}
                </p>
                <p>Proto #{protoNumber}</p>
              </div>
            </div>
            <div className="flex flex-col max-w-[40%] gap-4 items-end">
              <div className="flex gap-4 align-baseline text-gray-700 p-4 border border-dashed border-gray-300 bg-blue-50">
                <h3 className="font-semibold text-lg mb-3 text-gray-900 uppercase">
                  Development Cycles
                </h3>
                <div className="space-y-2">
                  {specs?.development_cycles?.map((cycle) => (
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
              <button
                onClick={() => router.push(`/print/specs/${proto_id}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 transition-colors cursor-pointer w-max"
                title="Print this proto"
              >
                Print
              </button>
            </div>
          </div>
        </div>

        <div className="w-full py-6 px-4">
          <div className="overflow-x-auto min-h-[calc(100vh-300px)] pb-4">
            {protoNumber > 1 ? (
              <div className="flex gap-8 max-w-full justify-center">
                {/* Only show the latest version */}
                {tableVersions.length > 0 && (
                  <SpecsTable
                    // rows={getPreviewVersion()}
                    rows={previewPrevRows}
                    title={`Proto #${prevSpecs?.proto_number} Specs`}
                    specsData={prevSpecs!}
                    current_proto={protoNumber}
                  />
                )}

                {currentProtoSubmitted && !isEditingProto ? (
                  <SpecsTable
                    title={`Proto #${specs?.proto_number} Specs`}
                    rows={mappedSpecsRows!}
                    specsData={specs!}
                    prevRows={previewPrevRows}
                    current_proto={protoNumber}
                    onEdit={() => {
                      setIsEditingProto(true);
                      setEditingData(mappedSpecsRows!);
                    }}
                  />
                ) : (
                  // CRUD Operations Interface
                  <CreateProtoSpecs
                    editingData={editingData}
                    setEditingData={setEditingData}
                    removeRow={removeRow}
                    setPendingAction={setPendingAction}
                    setShowSpecsConfirm={setShowSpecsConfirm}
                    error={error}
                    setError={setError}
                    prevRows={mappedPrevSpecsRows}
                    isEditingProto={isEditingProto}
                    setIsEditingProto={setIsEditingProto}
                    protoNumber={protoNumber}
                    submitting={submitting}
                  />
                )}
              </div>
            ) : hasProto1Specs && !isEditingProto ? (
              <div className="flex justify-center">
                <SpecsTable
                  title={`Proto #1 Specs`}
                  rows={mappedSpecsRows!}
                  specsData={specs!}
                  current_proto={protoNumber}
                  onEdit={() => {
                    setIsEditingProto(true);
                    setEditingData(mappedSpecsRows!);
                  }}
                />
              </div>
            ) : hasProto1Specs && isEditingProto ? (
              <CreateProtoSpecs
                editingData={editingData}
                setEditingData={setEditingData}
                removeRow={removeRow}
                setPendingAction={setPendingAction}
                setShowSpecsConfirm={setShowSpecsConfirm}
                error={error}
                setError={setError}
                prevRows={mappedPrevSpecsRows}
                isEditingProto={isEditingProto}
                setIsEditingProto={setIsEditingProto}
                protoNumber={protoNumber}
                submitting={submitting}
              />
            ) : (
              <div className="w-full py-8 px-4">
                <div className="bg-white border border-gray-200 overflow-hidden">
                  <div className="bg-green-50 text-gray-900 px-6 py-4">
                    <h2 className="font-bold text-lg">
                      Create Your First Specification
                    </h2>
                    <p className="text-sm text-gray-600">
                      Select a template to start with standard measurements
                    </p>
                  </div>

                  <div className="p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Choose a template:
                    </label>
                    <select
                      value={techSpecId}
                      onChange={handleTemplateChange}
                      className="w-full p-3 border border-gray-300 -md mb-6 bg-white"
                    >
                      <option value="">-- Select a garment type --</option>
                      {techSpecList?.templates?.map((template) => (
                        <option
                          key={template?.template_id}
                          value={template?.template_id}
                        >
                          {template?.name}
                        </option>
                      ))}
                    </select>

                    {editingData?.length > 0 && (
                      <>
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-medium text-gray-900">
                            Fill in measurements for: {techSpecName}
                          </h3>
                        </div>

                        {error && (
                          <div className="text-red-600 relative bg-red-300 py-2 px-4 border  text-lg font-medium text-center mb-3">
                            {error}
                            <span
                              className="absolute top-[50%] -translate-y-[50%] cursor-pointer right-0 text-white px-2 py-1 text-2xl"
                              onClick={() => setError(null)}
                            >
                              X
                            </span>
                          </div>
                        )}

                        <div className="border border-gray-200 overflow-hidden mb-6">
                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_150px] gap-4">
                              <div className="text-xs font-medium text-gray-600 uppercase">
                                Header
                              </div>
                              <div className="text-xs font-medium text-gray-600 uppercase">
                                Type
                              </div>
                              <div className="text-xs font-medium text-gray-600 uppercase">
                                Location
                              </div>
                              <div className="text-xs font-medium text-gray-600 uppercase">
                                Left Value
                              </div>
                              <div className="text-xs font-medium text-gray-600 uppercase">
                                Right Value
                              </div>
                              <div className="text-xs font-medium text-gray-600 uppercase">
                                Action
                              </div>
                            </div>
                          </div>

                          <div className="divide-y divide-gray-100">
                            {editingData?.map((row: Row, index: number) => {
                              const rowClass = `px-4 py-3`;

                              return (
                                <div key={index} className={rowClass}>
                                  <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_150px] gap-4 items-center">
                                    {/* Editable Header */}
                                    <textarea
                                      value={row.header}
                                      rows={2}
                                      onChange={(e) =>
                                        handleRowInputChange(
                                          index,
                                          "header",
                                          e.target.value
                                        )
                                      }
                                      className="text-sm font-medium text-gray-900 border  focus:border-blue-500 focus:outline-none px-2 py-1 -md bg-transparent"
                                      placeholder="Header"
                                    />

                                    {/* Editable Measurement Type */}
                                    <textarea
                                      value={row.measurement_name}
                                      rows={2}
                                      onChange={(e) =>
                                        handleRowInputChange(
                                          index,
                                          "measurement_name",
                                          e.target.value
                                        )
                                      }
                                      className="text-sm font-medium text-gray-900 border focus:border-blue-500 focus:outline-none px-2 py-1 -md bg-transparent"
                                      placeholder="Type"
                                    />

                                    {/* Editable Location */}
                                    <textarea
                                      value={row.location}
                                      rows={2}
                                      onChange={(e) =>
                                        handleRowInputChange(
                                          index,
                                          "location",
                                          e.target.value
                                        )
                                      }
                                      className="text-sm font-medium text-gray-900 border focus:border-blue-500 focus:outline-none px-2 py-1 -md bg-transparent"
                                      placeholder="Location"
                                    />

                                    <textarea
                                      value={row.left_value}
                                      rows={2}
                                      
                                      onChange={(e) => {
                                        // Only allow numbers and decimal points
                                        const newValue = e.target.value;
                                        if (
                                          newValue === "" ||
                                          /^[^a-zA-Z]*$/.test(newValue)
                                        ) {
                                          handleRowInputChange(
                                            index,
                                            "left_value",
                                            newValue
                                          );
                                        }
                                      }}
                                      placeholder="Left value..."
                                      className="px-3 py-2 border border-gray-300 -md text-sm w-full"
                                    />
                                    <textarea
                                      value={row.right_value}
                                      rows={2}
                                      onChange={(e) => {
                                        // Only allow numbers and decimal points
                                        const newValue = e.target.value;
                                        if (
                                          newValue === "" ||
                                          /^[^a-zA-Z]*$/.test(newValue)
                                        ) {
                                          handleRowInputChange(
                                            index,
                                            "right_value",
                                            newValue
                                          );
                                        }
                                      }}
                                      placeholder="Right value..."
                                      className="px-3 py-2 border border-gray-300 -md text-sm w-full"
                                    />
                                    <button
                                      onClick={() => removeRow(index)}
                                      className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 cursor-pointer"
                                      title="Delete Row"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Add New Row Section */}
                          <AddNewRow
                            onAddRow={(rows) =>
                              setEditingData([...editingData, ...rows])
                            }
                          />
                        </div>

                        <button
                          onClick={() => {
                            setPendingAction("create");
                            setShowSpecsConfirm(true);
                          }}
                          disabled={submitting || editingData.length === 0}
                          className="w-full bg-purple-600 text-white py-3 px-4 -md text-sm font-medium hover:bg-purple-700 transition-colors cursor-pointer"
                        >
                          {submitting
                            ? "Creating Version..."
                            : "Create First Version"}
                        </button>

                        {/* Unsaved Changes Indicator */}
                        {currentChanges.hasChanges && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <div className="flex items-center">
                              <svg
                                className="h-5 w-5 text-yellow-600 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                              </svg>
                              <span className="text-sm text-yellow-800">
                                {`You have unsaved changes: ${currentChanges.newRows}{" "}
                            new rows, {currentChanges.editedRows} edited rows.
                            Click "Create First Version" to save all changes.`}
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={closeConfirmModal}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          type={confirmModal.type}
        />

        <SpecsConfirmationModal
          isOpen={showSpecsConfirm}
          onClose={() => setShowSpecsConfirm(false)}
          onConfirm={handleConfirmSpecs}
          rows={editingData}
          submitting={submitting}
        />
      </div>
    </Suspense>
  );
};

export default SpecsDiffContent;
