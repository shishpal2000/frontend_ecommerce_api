"use client";

import React, { useState, useEffect, SetStateAction, useCallback } from "react";
import { useApiCall } from "@/hooks/useApiCall";
import MobileCommentForm from "@/components/MobileCommentForm";
import DesktopCommentForm from "@/components/DesktopCommentForm";
import WebSocketStatus from "@/components/WebSocketStatus";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { GetCommentsResponse, Person } from "@/types/Comments";
import { useWebSocket, WebSocketMessage } from "@/utils/websocket";

function UploadComments() {
  const [people, setPeople] = useState<Person[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  const [data, setData] = useState<GetCommentsResponse | null>(null);
  const { get } = useApiCall();

  const router = useRouter();
  const params = useSearchParams();
  const proto_id = params.get("protoId");
  const { user } = useAuth();

  // WebSocket configuration
  const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

  const getAuthToken = () => {
    return localStorage.getItem("access") || "";
  };

  // WebSocket connection
  const webSocket = useWebSocket({
    url: `${WS_BASE_URL}/v1/comments/draft/?token=${getAuthToken()}&proto_id=${proto_id}`,
    reconnectAttempts: 5,
    reconnectInterval: 3000,
    heartbeatInterval: 30000,
  });

  // Handle WebSocket messages
  useEffect(() => {
    if (webSocket.lastMessage) {
      const message = webSocket.lastMessage;
      console.log("📨 Received WebSocket message golu:", message);

      // switch (message.type) {
      //   case "":
      //     // Handle incoming comment data based on the structure you provided
      //     if (message.content) {
      //       const commentData = message.content;
      //       console.log("📝 Processing comment data:", commentData);

      //       // Validate required fields
      //       if (!commentData.comment_id || !commentData.actual_comment) {
      //         console.warn("⚠️ Invalid comment data received:", commentData);
      //         break;
      //       }

      //       // Transform WebSocket data to match our Comment interface
      //       const newComment: Comment = {
      //         comment_id: commentData.comment_id,
      //         actual_comment: commentData.actual_comment,
      //         interpreted_comment: commentData.interpreted_comment,
      //         comment_by: commentData.comment_by,
      //         comment_by_id: commentData.comment_by_id,
      //         image: commentData.image_url, // Map image_url to image field
      //         video: commentData.video_url, // Map video_url to video field
      //         created_at: commentData.created_at,
      //         updated_at: (message as any).updated_at || commentData.created_at,
      //         created_by: commentData.comment_by,
      //         updated_by: commentData.comment_by,
      //         // Add any additional fields that might be needed
      //         can_edit: true,
      //         permissions: {
      //           can_edit: true,
      //           can_delete: true,
      //         },
      //       };

      //       // Check if this is an update or new comment based on action or existing comment
      //       setComments((prevComments) => {
      //         const existingIndex = prevComments.findIndex(
      //           (comment) => comment.comment_id === newComment.comment_id
      //         );

      //         if (existingIndex !== -1) {
      //           const updatedComments = [...prevComments];
      //           updatedComments[existingIndex] = {
      //             ...updatedComments[existingIndex],
      //             ...newComment,
      //           };
      //           return updatedComments;
      //         } else {
      //           // Add new comment
      //           console.log("➕ Adding new comment:", newComment.comment_id);
      //           return [...prevComments, newComment];
      //         }
      //       });

      //       // Also update rows state if it exists
      //       setRows((prevRows) => {
      //         const existingRowIndex = prevRows.findIndex(
      //           (row) => row.id === newComment.comment_id
      //         );

      //         const newRow: CommentRow = {
      //           id: newComment.comment_id,
      //           actual_comment: newComment.actual_comment,
      //           interpreted_comment: newComment.interpreted_comment,
      //           comment_by: newComment.comment_by,
      //           comment_by_id: newComment.comment_by_id,
      //           image: newComment.image,
      //           video: newComment.video,
      //           created_at: newComment.created_at,
      //           updated_at: newComment.updated_at,
      //           isExisting: true,
      //           can_edit: newComment.can_edit,
      //           permissions: newComment.permissions,
      //           uploadedImageUrl: commentData.image_url,
      //           uploadedVideoUrl: commentData.video_url,
      //           photoPreview: null,
      //           videoPreview: null,
      //           person: newComment.comment_by,
      //           photo: null,
      //           videoFile: null,
      //           videoRemoved: false,
      //           isImageUploading: false,
      //           isVideoUploading: false,
      //           imageUploadError: null,
      //           videoUploadError: null,
      //         };

      //         if (existingRowIndex !== -1) {
      //           // Update existing row
      //           const updatedRows = [...prevRows];
      //           updatedRows[existingRowIndex] = {
      //             ...updatedRows[existingRowIndex],
      //             ...newRow,
      //           };
      //           return updatedRows;
      //         } else {
      //           // Add new row (only if it's not already there)
      //           return [...prevRows, newRow];
      //         }
      //       });
      //     }
      //     break;

      //   case "comment_deleted":
      //     if (message.content && message.content.comment_id) {
      //       const commentId = message.content.comment_id;
      //       console.log("🗑️ Deleting comment:", commentId);

      //       setComments((prevComments) =>
      //         prevComments.filter((comment) => comment.comment_id !== commentId)
      //       );

      //       setRows((prevRows) =>
      //         prevRows.filter((row) => row.id !== commentId)
      //       );
      //     }
      //     break;

      //   case "ping":
      //   case "pong":
      //     // Ignore heartbeat messages
      //     break;

      //   default:
      //     console.log(
      //       "🔍 Unknown WebSocket message type:",
      //       message.type,
      //       message
      //     );
      // }

      // if (message.content) {
      //   const commentData = message.content;
      //   console.log("📝 Processing comment data:", commentData);

      //   // Transform WebSocket data to match our Comment interface
      //   const newComment: Comment = {
      //     comment_id: commentData.comment_id,
      //     actual_comment: commentData.actual_comment,
      //     interpreted_comment: commentData.interpreted_comment,
      //     comment_by: commentData.comment_by,
      //     comment_by_id: commentData.comment_by_id,
      //     image: commentData.image_url, // Map image_url to image field
      //     video: commentData.video_url, // Map video_url to video field
      //     created_at: commentData.created_at,
      //     updated_at: (message as any).updated_at || commentData.created_at,
      //     created_by: commentData.comment_by,
      //     updated_by: commentData.comment_by,
      //     // Add any additional fields that might be needed
      //     can_edit: true,
      //     permissions: {
      //       can_edit: true,
      //       can_delete: true,
      //     },
      //   };

      //   // Check if this is an update or new comment based on action or existing comment
      //   setComments((prevComments) => {
      //     const existingIndex = prevComments.findIndex(
      //       (comment) => comment.comment_id === newComment.comment_id
      //     );

      //     if (existingIndex !== -1) {
      //       const updatedComments = [...prevComments];
      //       updatedComments[existingIndex] = {
      //         ...updatedComments[existingIndex],
      //         ...newComment,
      //       };
      //       return updatedComments;
      //     } else {
      //       // Add new comment
      //       console.log("➕ Adding new comment:", newComment.comment_id);
      //       return [...prevComments, newComment];
      //     }
      //   });

      //   // Also update rows state if it exists
      //   setRows((prevRows) => {
      //     const existingRowIndex = prevRows.findIndex(
      //       (row) => row.id === newComment.comment_id
      //     );

      //     const newRow: CommentRow = {
      //       id: newComment.comment_id,
      //       actual_comment: newComment.actual_comment,
      //       interpreted_comment: newComment.interpreted_comment,
      //       comment_by: newComment.comment_by,
      //       comment_by_id: newComment.comment_by_id,
      //       image: newComment.image,
      //       video: newComment.video,
      //       created_at: newComment.created_at,
      //       updated_at: newComment.updated_at,
      //       isExisting: true,
      //       can_edit: newComment.can_edit,
      //       permissions: newComment.permissions,
      //       uploadedImageUrl: commentData.image_url,
      //       uploadedVideoUrl: commentData.video_url,
      //       photoPreview: null,
      //       videoPreview: null,
      //       person: newComment.comment_by,
      //       photo: null,
      //       videoFile: null,
      //       videoRemoved: false,
      //       isImageUploading: false,
      //       isVideoUploading: false,
      //       imageUploadError: null,
      //       videoUploadError: null,
      //     };

      //     if (existingRowIndex !== -1) {
      //       // Update existing row
      //       const updatedRows = [...prevRows];
      //       updatedRows[existingRowIndex] = {
      //         ...updatedRows[existingRowIndex],
      //         ...newRow,
      //       };
      //       return updatedRows;
      //     } else {
      //       // Add new row (only if it's not already there)
      //       return [...prevRows, newRow];
      //     }
      //   });
      // }
    }
  }, [webSocket.lastMessage]);

  // Connect WebSocket when component mounts and user is authenticated
  useEffect(() => {
    if (user && proto_id && getAuthToken()) {
      webSocket.connect();
    }

    return () => {
      webSocket.disconnect();
    };
  }, [user, proto_id]);

  // Fix the broadcast functions to send proper message structure
  const broadcastCommentCreation = useCallback(
    (commentData: any) => {
      console.log("🚀 broadcastCommentCreation called with:", commentData);
      console.log("🔗 WebSocket connected:", webSocket.isConnected);

      if (!commentData) {
        console.error("❌ No comment data provided to broadcast");
        return;
      }

      if (webSocket.isConnected) {
        // Handle both single object and array of comments
        const commentsToSend = Array.isArray(commentData)
          ? commentData
          : [commentData];

        commentsToSend.forEach((singleComment, index) => {
          console.log(`📋 Processing comment ${index + 1}:`, singleComment);

          // Skip empty or invalid comments
          if (
            !singleComment ||
            (!singleComment.actual_comment &&
              !singleComment.interpreted_comment)
          ) {
            console.log(`⏭️ Skipping empty comment ${index + 1}`);
            return;
          }

          const message = {
            type: "",
            content: {
              comment_id:
                singleComment.comment_id ||
                singleComment.id ||
                `temp_${Date.now()}_${index}`,
              actual_comment: singleComment.actual_comment || "",
              interpreted_comment: singleComment.interpreted_comment || "",
              comment_by:
                singleComment.comment_by || singleComment.person || "",
              comment_by_id:
                singleComment.comment_by_id || singleComment.person || "",
              proto_id: proto_id,
              image_url:
                singleComment.image_url ||
                singleComment.uploadedImageUrl ||
                null,
              video_url:
                singleComment.video_url ||
                singleComment.uploadedVideoUrl ||
                null,
              created_at: singleComment.created_at || new Date().toISOString(),
            },
            proto_id: proto_id,
            user_id: user?.user_id?.toString(),
            timestamp: new Date().toISOString(),
          };

          console.log(
            `📋 Mapped message content for comment ${index + 1}:`,
            message.content
          );
          console.log(`📤 Sending WebSocket message ${index + 1}:`, message);

          const sent = webSocket.sendMessage(message);
          console.log(`📤 Message ${index + 1} sent result:`, sent);
        });
      } else {
        console.log("❌ WebSocket not connected");
      }
    },
    [webSocket, proto_id, user]
  );

  const broadcastCommentUpdate = useCallback(
    (commentData: any) => {
      console.log("🔄 broadcastCommentUpdate called with:", commentData);

      if (!commentData) {
        console.error("❌ No comment data provided to broadcast update");
        return;
      }

      if (webSocket.isConnected) {
        // Handle single comment update (updates are typically single objects)
        const message = {
          type: "comment",
          content: {
            comment_id: commentData.comment_id || commentData.id,
            actual_comment: commentData.actual_comment || "",
            interpreted_comment: commentData.interpreted_comment || "",
            comment_by: commentData.comment_by || commentData.person || "",
            comment_by_id:
              commentData.comment_by_id || commentData.person || "",
            proto_id: proto_id,
            image_url:
              commentData.image_url || commentData.uploadedImageUrl || null,
            video_url:
              commentData.video_url || commentData.uploadedVideoUrl || null,
            updated_at: commentData.updated_at || new Date().toISOString(),
          },
          proto_id: proto_id,
          user_id: user?.user_id?.toString(),
          timestamp: new Date().toISOString(),
        };

        console.log("📋 Original update data:", commentData);
        console.log("📋 Mapped update content:", message.content);
        console.log("📤 Sending WebSocket update message:", message);
        webSocket.sendMessage(message);
      } else {
        console.log("❌ WebSocket not connected for update");
      }
    },
    [webSocket, proto_id, user]
  );

  const broadcastCommentDeletion = useCallback(
    (commentId: string) => {
      console.log("🗑️ broadcastCommentDeletion called with:", commentId);

      if (!commentId) {
        console.error("❌ No comment ID provided to broadcast deletion");
        return;
      }

      if (webSocket.isConnected) {
        const message = {
          type: "comment",
          content: {
            comment_id: commentId,
            proto_id: proto_id,
            action: "delete",
          },
          proto_id: proto_id,
          user_id: user?.user_id?.toString(),
          timestamp: new Date().toISOString(),
        };

        console.log("📤 Sending WebSocket delete message:", message);
        webSocket.sendMessage(message);
      } else {
        console.log("❌ WebSocket not connected for deletion");
      }
    },
    [webSocket, proto_id, user]
  );

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

  // Enhanced fetchComments with WebSocket notification
  const fetchCommentsWithWebSocket = useCallback(async () => {
    // Notify other users about comment refresh
    if (webSocket.isConnected) {
      const message: WebSocketMessage = {
        type: "comment",
        action: "refresh",
        data: {
          proto_id: proto_id,
          timestamp: new Date().toISOString(),
        },
      };
      webSocket.sendMessage(message);
    }
  }, [webSocket, proto_id]);

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
  }, [get, proto_id]);

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
              <span>Proto #{data?.proto.number}</span>
              <span>Merchant: {data?.collection.sampling_merchant}</span>
            </div>

            <div className="flex flex-col items-end gap-2">
              {/* WebSocket Status Indicator */}
              <WebSocketStatus
                status={webSocket.status}
                error={webSocket.error}
                className="text-white"
              />
            </div>
          </div>
        </div>

        {/* Conditional rendering of mobile or desktop component */}
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
