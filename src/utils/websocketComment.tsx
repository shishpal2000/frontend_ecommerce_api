import { CommentRow } from "@/types";

// Handle incoming rows data
export const handleRowsDataReceivedComment = (
  data: any,
  setRows: React.Dispatch<React.SetStateAction<CommentRow[]>>
) => {
  // Process the rows data
  if (data.content && data.content.rows && Array.isArray(data.content.rows)) {
    const incomingRows: CommentRow[] = data.content.rows.map(
      (row: any, index: number) => ({
        id:
          row.id ||
          `ws_${data.uuid || "msg"}_${index}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
        actual_comment: row.actual_comment || "",
        interpreted_comment: row.interpreted_comment || "",
        comment_by: row.comment_by || "",
        comment_by_id: row.comment_by_id || "",
        image: row.image || null,
        video: row.video || null,
        created_at: row.created_at || data.timestamp,
        updated_at: row.updated_at || data.timestamp,
        created_by: row.created_by,
        updated_by: row.updated_by,
        photoPreview:
          row.uploadedImageUrl || row.image || row.photoPreview || null,
        videoPreview:
          row.uploadedVideoUrl || row.video || row.videoPreview || null,
        person: row.person || row.comment_by_id || "",
        photo: row.photo || null,
        videoFile: row.videoFile || null,
        isExisting: row.isExisting !== undefined ? row.isExisting : true,
        videoRemoved: row.videoRemoved || false,
        can_edit: row.can_edit !== undefined ? row.can_edit : false,
        uploadedImageUrl: row.uploadedImageUrl || row.image || null,
        uploadedVideoUrl: row.uploadedVideoUrl || row.video || null,
        isImageUploading: false,
        isVideoUploading: false,
        imageUploadError: null,
        videoUploadError: null,
        is_collection_comment: row.is_collection_comment,
        permissions: row.permissions || {
          can_edit: row.can_edit || false,
          can_delete: row.can_delete || false,
        },
      })
    );

    // Update rows state with smart merging
    setRows((prevRows: CommentRow[]) => {
      // Keep local draft rows (non-existing rows with data)
      const localDraftRows = prevRows.filter(
        (row) =>
          !row.isExisting &&
          (row.person ||
            row.interpreted_comment?.trim() ||
            row.actual_comment?.trim() ||
            row.photoPreview ||
            row.videoPreview ||
            row.uploadedImageUrl ||
            row.uploadedVideoUrl)
      );

      // Remove duplicates by ID before combining
      const incomingRowIds = new Set(incomingRows.map((row) => row.id));
      const uniqueLocalDraftRows = localDraftRows.filter(
        (row) => !incomingRowIds.has(row.id)
      );

      // Combine incoming server rows + unique local draft rows
      const mergedRows = [...incomingRows, ...uniqueLocalDraftRows];

      // Remove any existing empty rows first to prevent duplicates
      const nonEmptyRows = mergedRows.filter(
        (row) =>
          row.isExisting ||
          row.person ||
          row.interpreted_comment?.trim() ||
          row.actual_comment?.trim() ||
          row.photoPreview ||
          row.videoPreview ||
          row.uploadedImageUrl ||
          row.uploadedVideoUrl
      );

      // Always add exactly one empty row at the end for new input
      const finalRows = [
        ...nonEmptyRows,
        {
          id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          actual_comment: "",
          interpreted_comment: "",
          image: null,
          video: null,
          comment_by: "",
          comment_by_id: "",
          photoPreview: null,
          videoPreview: null,
          person: "",
          photo: null,
          videoFile: null,
          isExisting: false,
          uploadedImageUrl: null,
          uploadedVideoUrl: null,
          isImageUploading: false,
          isVideoUploading: false,
          imageUploadError: null,
          videoUploadError: null,
        },
      ];

      return finalRows;
    });
  }
};

export const addRow = (
  setRows: React.Dispatch<React.SetStateAction<CommentRow[]>>
) => {
  const newRow: CommentRow = {
    id: Date.now().toString(),
    person: "",
    photo: null,
    photoPreview: null,
    video: null,
    videoPreview: null,
    actual_comment: "",
    interpreted_comment: "",
    image: null,
    comment_by: "",
    comment_by_id: "",
    isExisting: false,
    uploadedImageUrl: null,
    uploadedVideoUrl: null,
    isImageUploading: false,
    isVideoUploading: false,
    imageUploadError: null,
    videoUploadError: null,
  };
  setRows((prevRows) => [...prevRows, newRow]);
};

export const deleteRow = (
  rowId: string,
  setRows: React.Dispatch<React.SetStateAction<CommentRow[]>>,
  hasRowData: (row: CommentRow) => boolean
) => {
  setRows((prevRows) => {
    const filteredRows = prevRows.filter((row) => row.id !== rowId);
    // Ensure at least one empty row exists for new comments
    if (!filteredRows.some((row) => !row.isExisting && !hasRowData(row))) {
      filteredRows.push({
        id: Date.now().toString(),
        person: "",
        photo: null,
        photoPreview: null,
        video: null,
        videoPreview: null,
        actual_comment: "",
        interpreted_comment: "",
        image: null,
        comment_by: "",
        comment_by_id: "",
        isExisting: false,
        uploadedImageUrl: null,
        uploadedVideoUrl: null,
        isImageUploading: false,
        isVideoUploading: false,
        imageUploadError: null,
        videoUploadError: null,
      });
    }
    return filteredRows;
  });
};

export const updateRow = (
  id: string,
  updates: Partial<CommentRow>,
  setRows: React.Dispatch<React.SetStateAction<CommentRow[]>>,
  hasRowData: (row: CommentRow) => boolean,
  isReceivingDataRef: React.MutableRefObject<boolean>
) => {
  setRows((prevRows) => {
    const updatedRows = prevRows.map((row) =>
      row.id === id ? { ...row, ...updates } : row
    );

    const lastRow = updatedRows[updatedRows.length - 1];
    if (
      !isReceivingDataRef.current &&
      !lastRow.isExisting &&
      hasRowData(lastRow)
    ) {
      // Check if there's already an empty row
      const hasEmptyRow = updatedRows.some(
        (row) => !row.isExisting && !hasRowData(row)
      );

      if (!hasEmptyRow) {
        const newRow: CommentRow = {
          id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          person: "",
          photo: null,
          photoPreview: null,
          video: null,
          videoPreview: null,
          actual_comment: "",
          interpreted_comment: "",
          image: null,
          comment_by: "",
          comment_by_id: "",
          isExisting: false,
          uploadedImageUrl: null,
          uploadedVideoUrl: null,
          isImageUploading: false,
          isVideoUploading: false,
          imageUploadError: null,
          videoUploadError: null,
        };
        updatedRows.push(newRow);
      }
    }

    return updatedRows;
  });
};

export const objectUtils = (row: CommentRow) => {
  return {
    id: row.id,
    person: row.person,
    actual_comment: row.actual_comment,
    interpreted_comment: row.interpreted_comment,
    comment_by: row.comment_by,
    comment_by_id: row.comment_by_id,
    image: row.image,
    video: row.video,
    uploadedImageUrl: row.uploadedImageUrl,
    uploadedVideoUrl: row.uploadedVideoUrl,
    photoPreview: row.photoPreview,
    videoPreview: row.videoPreview,
    isExisting: row.isExisting || false,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by,
    updated_by: row.updated_by,
    can_edit: row.can_edit,
    videoRemoved: row.videoRemoved,
    permissions: row.permissions,
    is_collection_comment: row.is_collection_comment,
  };
};


