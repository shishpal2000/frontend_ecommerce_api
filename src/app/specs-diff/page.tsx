"use client";
import React, { Suspense } from "react";
import LayoutComponents from "../layoutComponents";
import dynamic from "next/dynamic";

const SpecsDiffContent = dynamic(() => import("./SpecsDiffContent"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center">Loading...</div>
  ),
});

const page: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center">Loading...</div>
      }
    >
      <SpecsDiffContent />
    </Suspense>
  );
};

export default LayoutComponents(page);
