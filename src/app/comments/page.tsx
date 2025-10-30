"use client";

import React, { Suspense } from "react";
import LayoutComponents from "../layoutComponents";
import dynamic from "next/dynamic";

const CommentPageContent = dynamic(() => import("./CommentPageContent"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center min-h-screen">
      Loading...
    </div>
  ),
});

const page = () => {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          Loading...
        </div>
      }
    >
      <CommentPageContent />
    </Suspense>
  );
};

export default LayoutComponents(page);
