export interface GetProtoDetailsResponse {
  collection: Collection;
  development_cycles: DevelopmentCycle[];
  proto: Proto;
}

export interface Collection {
  collection_id: string;
  collection_name: string;
  sampling_merchant_id: string;
  sampling_merchant_name: string;
  total_proto_count: number;
  remarks: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  created_by: string;
  updated_by: string;
  created_by_id: string;
  updated_by_id: string;
}

export interface DevelopmentCycle {
  development_cycle_id: string;
  development_cycle_name: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  created_by_id: string;
  updated_by_id: string;
}

export interface Proto {
  proto_id: string;
  proto_number: number;
  image: string | null;
  proto_status: string; // e.g., "NO_STATUS"
  is_msr: boolean;
  qr_code: string | null;
  qr_image: string | null;
  previous_proto: PreviousProto;
  merchant_section_data: MerchantSectionData;
  master_ji_section_data: MasterJiSectionData;
  permission: Permission;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  created_by: string;
  updated_by: string;
  created_by_id: string;
  updated_by_id: string;
  qr_image?: string;
}

export interface PreviousProto {
  previous_proto_id: string;
  previous_proto_number: number;
}

export interface MerchantSectionData {
  merchant_section_id: string;
  date_started: string | null;
  date_end: string | null;
  time_start: string | null;
  time_end: string | null;
  pattern_master_id: string | null;
  pattern_master_name: string | null;
  cutting_master_id: string | null;
  cutting_master_name: string | null;
  tailor: string;
  pattern_parts_total: number | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  created_by_id: string;
  updated_by_id: string;
}

// export interface MasterJiSectionData {
//   master_ji_section_id: string;
//   stitch_time: string | null;
//   stitch_cost: number | null;
//   cut_cost: number | null;
//   needle_type: [
//     {
//       fabric_type: string;
//       needle_type_id: string;
//     }
//   ];
//   gross_weight: number | null;
//   gross_weight_unit: string | null;
//   tuk_file: string | null;
//   overlock_type: {
//     id: string | number;
//     name: string;
//     value: string;
//   }[];
//   efficiency_type: [{ percentage: number; efficiency_type_id: string }];
//   flat_lock: [
//     {
//       placement: string;
//       folder_type: string;
//       no_of_threads: number;
//       folder_size?: number | null;
//     }
//   ];
// }

export interface MasterJiSectionData {
  master_ji_section_id: string;
  stitch_time: string | null;
  stitch_cost: number | null;
  cut_cost: number | null;
  gross_weight: number | null;
  gross_weight_unit: string | null;
  tuka_file: string | null;
  extra_data: {
    flat_lock: Array<{
      type: string;
      placement: string;
      folder_size: string;
      no_of_threads: string;
    }>;
    needle_type: Array<{
      fabric_type: string;
      needle_type: string;
    }>;
    overlock_type: Array<{
      value: string;
      overlock_type: string;
    }>;
    efficiency_type: Array<{
      value: number | null;
      efficiency_type: string;
    }>;
  };
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  created_by_id: string;
  updated_by_id: string;
}

export interface Permission {
  can_create_merchant_section: boolean;
  can_create_master_ji_section: boolean;
  can_update_merchant_section: boolean;
  can_update_master_ji_section: boolean;
  can_update_status: boolean;
  can_mark_is_msr: boolean;
}
