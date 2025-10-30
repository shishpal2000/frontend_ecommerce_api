/* eslint-disable @typescript-eslint/no-explicit-any */
import { SetStateAction } from "react";

export interface LoginCredentials {
  username: string;
  password: string;
}

export type User = {
  user_id: string;
  name: string;
  username: string;
  role: string;
  email?: string;
  force_password_change?: boolean;
};

export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  url: string;
  name: string;
  progress: number;
  status: "uploading" | "uploaded" | "failed";
  error?: string;
}

export interface ImageApiResponse {
  image_id: string;
  url: string;
  thumbnail: string;
  is_active: boolean;
  user_name: string;
  style_name: string | null;
}
export interface Option {
  value: string;
  label: string;
  locations?: string;
  photos?: ImageApiResponse[];
}

export type newSearchValue = {
  setName: (value: string | undefined) => void;
  setSelectedOption: (option: Option | null) => void;
  selectedOption: Option | null;
  setLocation: (string) => void;
  setSelectedForModal: React.Dispatch<React.SetStateAction<UploadedImage[]>>;
};

export interface BootstrapInputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value: string;
  setValue: (value: string) => void;
  isValid?: boolean;
  isInvalid?: boolean;
  feedback?: string;
  disabled?: boolean;
  required?: boolean;
}

export interface Image {
  image_id: string;
  style_name: string;
  url: string;
}

export interface ImageDetailArray {
  key: string;
  value: string;
}

export interface SortableImageProps {
  image: any;
  navigate: (path: string) => void;
  typeName?: string;
  path: string;
}

export interface SortableDataProps {
  id: number;
  navigate: (path: string) => void;
  name: string;
  path: string;
}

export interface DragDrapImagesProps {
  initialImagesTemp: any[];
  typeName?: string;
  path: string;
  title?: string;
  array?: ImageDetailArray[];
  handlePostApi?: (images: any[]) => void;
  setArrayData?: Dispatch<SetStateAction<any[]>>;
  isLoading?: boolean;
}

export interface UserData {
  created_at: string;
  created_by: string;
  is_active: string;
  msr_year_id: string;
  updated_at: string;
  updated_by: string;
  year: number;
}

export interface ApiResponse<T> {
  message: string;
  error_status: boolean;
  status: number;
  data: T;
}

// Style Management Types
export interface CategoryNode {
  id: string;
  name: string;
  children?: CategoryNode[];
  isLeaf?: boolean;
}

export interface StyleImage {
  id: string;
  file: File;
  url: string;
  order: number;
}

export interface StyleTag {
  tag_id: string;
  name: string;
  color?: string;
}

export interface StyleFormData {
  name: string;
  styleNumber: string;
  category: CategoryNode | null;
  coverImage: StyleImage | null;
  images: StyleImage[];
  tags: StyleTag[];
}

export interface NameSuggestion {
  id: string;
  name: string;
  similarity: number;
}

export interface StyleNumberValidation {
  isValid: boolean;
  exists: boolean;
  message: string;
}

export interface DjangoStyleNumberVerificationData {
  exists: boolean;
  style_number: string;
  message?: string;
}

export interface DjangoStyleNameVerificationData {
  exists: boolean;
  style_name: string;
  message?: string;
}

export interface DjangoSimilarStyleNamesData {
  similar_names?: string[];
  results?: string[];
  names?: string[];
  data?: string[];
}

// User Analytics Types - User Likes Feature
export interface UserWithLikes {
  user_id: string;
  Email: string;
  Name: string;
  likes_count: number;
}

export interface UserLike {
  like_id: string;
  is_liked: boolean;
  style_id: string;
  name: string;
  slug: string;
  cover_image_url: string;
  created_at: string;
}

export interface UserAnalyticsTab {
  id: string;
  label: string;
  component: React.ComponentType;
}

// Image object for uploading
export interface ImageObj {
  file: File;
  preview: string;
  id: string;
}

export interface CreateAccountData {
  name: string;
  email: string;
  role?: string;
}

export interface UserAccountResponse {
  user_id: string;
  user_name: string;
  user_email: string;
  password: string;
}

export interface PasswordResetResponse {
  user_id: string;
  user_name: string;
  user_email: string;
  password: string;
}

export interface LoginResponse {
  tokens: LoginTokens;
}

export interface ChangePasswordData {
  email: string;
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export interface CopyableCredentials {
  email: string;
  password: string;
}

// User interface

export enum UserRole {
  USER = "user",
  SAMPLING = "sampling",
  ADMIN = "admin",
}
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// Login tokens interface

export interface LoginTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Form data interfaces
export interface LoginFormData {
  username: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  username: string;
  password: string;
  confirmPassword: string;
}

// Comment data interfaces (for upload-photo page)
export interface CommentData {
  person: string;
  photo: File | null;
  photoPreview: string | null;
  comment: string;
}

export interface SubmittedComment {
  id: string;
  person: string;
  comment: string;
  photo: string;
  timestamp: string;
}

// Additional interfaces that might be needed
export interface Option {
  value: string;
  label: string;
}

export interface UploadedImage {
  id: string;
  url: string;
  name: string;
  size: number;
}

// socket io types
export type TemplateRow = {
  id: string;
  header: string;
  measurement_name: string;
  location: string;
};

export type TechSpecListResponse = {
  name?: string;
  draft_id: string;
  created_at: string;
  updated_at: string;
  template_id: string;
  permission?: {
    can_edit_template: boolean;
  };
}[];

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

export interface CommentRow {
  id: string;
  actual_comment: string;
  interpreted_comment: string;
  image: string | File | null;
  video: string | File | null;
  comment_by: string;
  comment_by_id: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  is_collection_comment?: boolean;
  can_edit?: boolean;
  // For new comments only:
  photoPreview?: string | null;
  videoPreview?: string | null;
  person?: string;
  photo?: File | null;
  videoFile?: File | null;
  isExisting?: boolean;
  videoRemoved?: boolean;
  permissions?: {
    can_edit: boolean;
    can_delete: boolean;
  };
  // S3 URLs for uploaded files
  uploadedImageUrl?: string | null;
  uploadedVideoUrl?: string | null;
  // Upload states
  isImageUploading?: boolean;
  isVideoUploading?: boolean;
  imageUploadError?: string | null;
  videoUploadError?: string | null;
}
