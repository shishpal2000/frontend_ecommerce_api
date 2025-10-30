import { DevelopmentCycle } from "../Proto-Details";

export interface Person {
  email: string;
  role_id: string;
  user_id: string;
  name: string;
  role: string;
  username: string;
}

export interface Comment {
  comment_id: string;
  comment_by: string;
  proto_number?: string;
  comment_by_id: string;
  created_by: string;
  updated_by: string;
  image: string | null;
  video: string | null;
  actual_comment: string;
  interpreted_comment: string;
  created_at: string;
  updated_at: string;
  can_edit: boolean;
  isNew?: boolean;
  is_collection_comment?: boolean;
  permissions: {
    can_edit: boolean;
    can_delete: boolean;
  };
}

export interface GetCommentsResponse {
  comments: Comment[];
  proto: {
    proto_id: string;
    number: number;
    name?: string;
    qr_code: string | null;
    qr_image: string | null;
    is_protected: boolean;
    is_msr: boolean;
    comments_count: number;
    last_comment_by: string;
    last_commented_at: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;
    permissions: {
      can_add_new_comments: boolean;
      can_mark_proto_comment_as_collection_comment: boolean;
    };
  };
  collection: {
    collection_id: string;
    collection_name: string;
    name?: string;
    jc_number?: string;
    sampling_merchant: string;
    sampling_merchant_id: string;
    development_cycles: DevelopmentCycle[];
  };
}
