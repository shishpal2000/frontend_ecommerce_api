import { DevelopmentCycle } from "@/types/Proto-Details";

export type Row = {
  collection_spec_id?: string;
  proto_spec_id?: string;
  header: string;
  measurement_name: string;
  location: string;
  left_value: string;
  right_value: string;
  _isNewRow?: boolean;
  _isEdited?: boolean;
  _leftValueChanged?: boolean;
  _leftValueDeleted?: boolean;
  _rightValueChanged?: boolean;
  _rightValueDeleted?: boolean;
};

export type TechSpecListResponse = {
  permission: {
    can_create_new_template: boolean;
    can_edit_template: boolean;
  };
  templates: { template_id: string; name: string; description: string }[];
};

export type TechSpecDetailResponse = {
  template_id: string;
  name: string;
  description: string;
  measurements: {
    measurement_id: string;
    header: string;
    measurement_name: string;
    location: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;
    created_by_id: string;
    updated_by_id: string;
  }[];
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  created_by_id: string;
  updated_by_id: string;
  permission: {
    can_edit_template: boolean;
    can_edit_measurements: boolean;
  };
};

export type ProtoSpecsResponse = {
  collection_id: string;
  qr_image?: string;
  collection_name: string;
  proto_id: string;
  proto_number: number;
  qr_code: string | null;
  qr_image: string | null;
  previous_proto_id: string;
  previous_proto_number: number;
  last_edited_by: string;
  last_edited_at: string;
  last_edited_by_id: string;
  sampling_merchant: string;
  sampling_merchant_id: string;
  development_cycles: DevelopmentCycle[];
  permission: {
    can_edit: boolean;
    can_delete: boolean;
    can_add: boolean;
  };
  rows: {
    collection_spec_id: string;
    proto_spec_id: string;
    header: string;
    measurement_name: string;
    location: string;
    left_value: number;
    right_value: number;
  }[];
};
