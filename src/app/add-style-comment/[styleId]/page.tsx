"use client";

import React, { useState, useEffect, SetStateAction } from "react";
import { useApiCall } from "@/hooks/useApiCall";
import MobileCommentForm from "@/components/MobileCommentForm";
import DesktopCommentForm from "./DesktopCommentForm";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Comment, GetCommentsResponse, Person } from "@/types/Comments";
import { useParams } from "next/navigation";
import LayoutComponents from "@/app/layoutComponents";

function UploadComments() {
  const [style] = useState<boolean>(true);
  const params2 = useParams();
  //   const proto_id = params2.styleId;
  const [people, setPeople] = useState<Person[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [data, setData] = useState<GetCommentsResponse | null>(null);
  const { get } = useApiCall();

  const router = useRouter();

  const proto_id: string = (params2?.styleId as string) || "";
  console.log("proto id", proto_id);

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
      const response = await get<GetCommentsResponse>(
        `/comment/${proto_id}/list-collection-comments/`
      );

      console.log("Comments API Response:", response);

      if (response.error_status) {
        throw new Error(response.message || "Failed to fetch comments");
      }
      setComments(response.data.comments);
      setData(response.data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  // Fetch people from API
  useEffect(() => {
    const fetchPeople = async () => {
      try {
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
      }
    };

    fetchPeople();
    fetchComments();
  }, [get, proto_id]);

  console.log("current proto data", data);

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
            <div className="flex flex-col">
              <span className="text-gray-600 font-semibold text-2xl capitalize">
                {data?.collection.collection_name}
              </span>
              <span>Style Name : Lona Skirt</span>
              <span>Merchant: {data?.collection.sampling_merchant}</span>
            </div>

            {!isMobile && (
              <div className="text-right">
                <span className="text-xl text-gray-600">
                  Comments Count: {comments.length}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Conditional rendering of mobile or desktop component */}
        {comments.length === 0 ? (
          <div className="flex justify-center items-center h-48 text-gray-500">
            No comments available.
          </div>
        ) : (
          <div className="bg-gray-50">
            {isMobile ? (
              <MobileCommentForm people={people} protoId={proto_id || ""} />
            ) : (
              <DesktopCommentForm
                people={people}
                comments={comments}
                fullData={data}
                currentUser={{
                  id: user.user_id,
                  role: user.role.toLowerCase(),
                }}
                fetchComments={fetchComments}
                protoId={proto_id || ""}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LayoutComponents(UploadComments);
