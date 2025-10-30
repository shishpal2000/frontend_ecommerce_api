import axiosInstance from "./axiosInstance";
import type { ApiResponse } from "../types";

export const apiCall = async <T,>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  url: string,
  data?: Record<string, unknown> | FormData | null,
  params?: Record<string, unknown>,
  headers?: Record<string, string | undefined>
): Promise<ApiResponse<T>> => {
  try {
    const isFormData = data instanceof FormData;

    const response = await axiosInstance.request<ApiResponse<T>>({
      method,
      url,
      data: data || undefined,
      params,
      headers: isFormData ? undefined : headers,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.message || "Something went wrong!");
  }
};
