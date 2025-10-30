import { useApiCall } from "@/hooks/useApiCall";
import { useCallback } from "react";
import { ApiResponse } from "../types";

export const useGeneralApiCall = () => {
  const { get, post, put, remove, ...rest } = useApiCall();

  // GET: Pass the full path and params
  const getApi = useCallback(
    async <T>(
      path: string,
      params?: Record<string, unknown>
    ): Promise<ApiResponse<T>> => {
      return await get<T>(path, params);
    },
    [get]
  );

  const postApi = useCallback(
    async <T>(
      path: string,
      body?: Record<string, unknown> | FormData,
      config?: Record<string, unknown>
    ): Promise<ApiResponse<T>> => {
      return await post<T>(path, body);
    },
    [post]
  );

  const putApi = useCallback(
    async <T>(
      path: string,
      id: string,
      body?: Record<string, unknown> | FormData
    ): Promise<ApiResponse<T>> => {
      return await put<T>(`${path}/${id}/`, body);
    },
    [put]
  );

  const deleteApi = useCallback(
    async <T>(path: string, id?: string): Promise<ApiResponse<T>> => {
      if (!id) return await remove<T>(`${path}`);
      return await remove<T>(`${path}/${id}/`);
    },
    [remove]
  );

  return { getApi, postApi, putApi, deleteApi, ...rest };
};
