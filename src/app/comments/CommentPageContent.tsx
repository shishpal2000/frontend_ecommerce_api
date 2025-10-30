"use client";

import React, { useState, useEffect, SetStateAction, useCallback } from "react";
import { useApiCall } from "@/hooks/useApiCall";
import MobileCommentForm from "@/components/MobileCommentForm";
import DesktopCommentForm from "@/components/DesktopCommentForm";

import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { GetCommentsResponse, Person } from "@/types/Comments";
import { useParams } from "next/navigation";

function UploadComments() {
  const protoId = useParams().protoId;
  const [people, setPeople] = useState<Person[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [comments, setComments] = useState<any>(null);

  const [hasFetchedPeople, setHasFetchedPeople] = useState(false);
  const { get } = useApiCall();

  const router = useRouter();
  const params = useSearchParams();
  const proto_id = params.get("protoId");
  const { user } = useAuth();

  // Handle screen size detection
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  const fetchComments = async () => {
    try {
      const response = await get<GetCommentsResponse>(`/comment/${proto_id}/`);
      console.log("Comments API Response:", response);
      if (response.error_status) {
        throw new Error(response.message || "Failed to fetch comments");
      }
      setComments(response.data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [protoId]);

  // Fetch people from API
  useEffect(() => {
    const fetchPeople = async () => {
      if (hasFetchedPeople) return; // Prevent multiple fetches

      try {
        setHasFetchedPeople(true);
        const response = await get<SetStateAction<Person[]>>(
          "/authentication/list-users/"
        );
        console.log("People API Response:", response);
        if (response.error_status) {
          throw new Error(response.message || "Failed to fetch people");
        }
        setPeople(response.data);
      } catch (error) {
        console.error("Error fetching people:", error);
        setHasFetchedPeople(false); // Reset on error to allow retry
      }
    };

    fetchPeople();
  }, []);

  if (!user) {
    return (
      <div className="flex justify-center items-center text-xl h-full font-semibold text-gray-700">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-gray-50 w-full">
      <div className="mx-auto">
        <div className="flex items-center gap-12 p-4 bg-blue-400">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <svg
              className="w-4 h-4"
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
            Back
          </button>
          <div className="flex justify-between flex-1">
            <div className="flex flex-col w-full">
              <span className=" font-bold text-3xl capitalize text-center">
                {comments?.collection.collection_name}
              </span>
              <span>Proto #{comments?.proto.number}</span>
              <span>Merchant: {comments?.collection.sampling_merchant}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50">
          {isMobile ? (
            <MobileCommentForm people={people} protoId={proto_id || ""} />
          ) : (
            <DesktopCommentForm people={people} protoId={proto_id || ""} />
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadComments;
