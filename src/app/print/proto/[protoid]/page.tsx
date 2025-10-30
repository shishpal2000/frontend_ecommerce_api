"use client";
import React, { useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import PrintLayout from "@/components/PrintLayout";
import ScreenLayout from "@/components/ScreenLayout";
import { useGeneralApiCall } from "@/services/useGeneralApiCall";
import { useParams } from "next/navigation";
import Loading from "@/components/Loding";

function ProtoPrintView({}) {
  const params = useParams();
  const protoid = params.protoid;
  const [printView, setPrintView] = React.useState(false);
  const componentRef = React.useRef<HTMLDivElement>(null);
  const [arrayData, setData] = React.useState<any>(null);
  const { getApi, loading } = useGeneralApiCall();

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    onAfterPrint: () => {
      setPrintView(false);
    },
  });

  const handlePrintWithView = () => {
    setPrintView(true);
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  const fetchData = async () => {
    try {
      const response = await getApi(`/proto/full-print-data/${protoid}/`);
      setData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [protoid]);

  return (
    <>
      {!printView && (
        <>
          <div className="flex fixed top-4 left-4 z-50 ">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
            >
              <svg
                className="w-5 h-5"
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
              <span className="font-medium">Back</span>
            </button>
          </div>

          <div className="fixed top-4 right-4 z-50 print:hidden border-2 p-2 bg-blue-600 cursor-pointer">
            <button
              className="cursor-pointer text-white"
              onClick={handlePrintWithView}
            >
              🖨️ Print View
            </button>
          </div>
        </>
      )}

      {loading || !arrayData ? (
        <div className="flex justify-center items-center h-screen">
          <Loading />
        </div>
      ) : (
        <div ref={componentRef}>
          {printView ? (
            <PrintLayout arrayData={arrayData} />
          ) : (
            <ScreenLayout arrayData={arrayData} />
          )}
        </div>
      )}
    </>
  );
}

export default ProtoPrintView;
