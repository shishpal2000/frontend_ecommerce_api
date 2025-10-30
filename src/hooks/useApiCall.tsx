import { useState, useCallback } from "react";
import { apiCall } from "../apiConfig/apiUtils";
import { ApiResponse } from "@/types";

export const useApiCall = () => {
  const [data, setData] = useState<ApiResponse<any> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const executeCall = useCallback(
    async <T,>(
      method: "GET" | "POST" | "PUT" | "DELETE",
      path: string,
      body?: Record<string, unknown> | FormData | null,
      params?: Record<string, unknown>
    ): Promise<ApiResponse<T>> => {
      setLoading(true);
      setError(null);

      try {
        const response: ApiResponse<T> = await apiCall<T>(
          method,
          path,
          body,
          params,
          undefined
        );
        setData(response);
        return response;
      } catch (err: any) {
        setError(
          err.response?.data?.message || err.message || "Something went wrong"
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const get = useCallback(
    <T,>(path: string, params?: Record<string, unknown>) =>
      executeCall<T>("GET", path, null, params),
    [executeCall]
  );

  const post = useCallback(
    <T,>(path: string, body?: Record<string, unknown> | FormData) =>
      executeCall<T>("POST", path, body),
    [executeCall]
  );

  const put = useCallback(
    <T,>(path: string, body?: Record<string, unknown> | FormData) =>
      executeCall<T>("PUT", path, body),
    [executeCall]
  );

  const remove = useCallback(
    <T,>(path: string) => executeCall<T>("DELETE", path),
    [executeCall]
  );

  const removeError = () => {
    setError("");
  };

  return { data, loading, error, get, post, put, remove, removeError };
};
