"use client";

import { useEffect, useState } from "react";
import LayoutComponents from "../../layoutComponents";
import { useGeneralApiCall } from "@/services/useGeneralApiCall";
import { useAuth } from "@/hooks/useAuth";

type Season = {
  development_cycle_id: string;
  name: string;
  year: number;
  season: string;
  remarks?: string;
  updated_by: string;
  created_by: string;
  can_edit?: boolean;
  created_at?: string;
  updated_at?: string;
};

// API response structure
type ApiResponse = {
  can_add_new_development_cycle: boolean;
  development_cycles: Season[];
};

const DashboardPage = () => {
  const { user } = useAuth();
  const { getApi } = useGeneralApiCall();
  const [seasons, setSeasons] = useState<ApiResponse>({
    can_add_new_development_cycle: false,
    development_cycles: [],
  });

  const fetchSeasons = async () => {
    try {
      const response = await getApi<ApiResponse>("/development-cycle/list/");
      console.log(response.data, "seasons data");

      if (response?.data && typeof response.data === "object") {
        setSeasons(response.data);
      } else {
        setSeasons({
          can_add_new_development_cycle: false,
          development_cycles: [],
        });
      }
    } catch (error) {
      console.error("Error fetching seasons:", error);
      setSeasons({
        can_add_new_development_cycle: false,
        development_cycles: [],
      });
    }
  };

  useEffect(() => {
    fetchSeasons();
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
        <h2 className="text-xl font-medium text-gray-900 mb-2 uppercase">
          Welcome to the {user?.role} Dashboard
        </h2>

        <div className="flex gap-4 mt-4 w-full">
          <p className="text-gray-600 text-2xl w-[50%] uppercase">MSR Styles</p>
          <p className="text-gray-600 text-2xl w-[50%]">
            {seasons.development_cycles.length}
          </p>
        </div>
      </div>
    </main>
  );
};

export default LayoutComponents(DashboardPage);
