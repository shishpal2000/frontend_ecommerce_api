"use client";
import React, { useRef } from "react";
import LayoutComponents from "../layoutComponents";

function Page() {
  // Function to handle full screen on double click
  const handleFullScreen = (videoRef: HTMLVideoElement | null) => {
    if (!videoRef) return;
    if (videoRef.requestFullscreen) {
      videoRef.requestFullscreen();
    } else if ((videoRef as any).webkitEnterFullscreen) {
      (videoRef as any).webkitEnterFullscreen();
    } else if ((videoRef as any).mozRequestFullScreen) {
      (videoRef as any).mozRequestFullScreen();
    } else if ((videoRef as any).msRequestFullscreen) {
      (videoRef as any).msRequestFullscreen();
    }
  };

  const sections = [
    {
      title: "Merchant Tutorial",
      videos: [
        {
          title: "How to create new Style",
          url: "https://developmentbucketdkc.s3.amazonaws.com/sampling_form99_testing/custom_media_assests/new%20style%20in%20msr_uuid_3d974d848eae4ec2a8653489ef15b7d9.mp4",
        },
        {
          title: "How to change JC Number",
          url: "https://developmentbucketdkc.s3.amazonaws.com/sampling_form99_testing/custom_media_assests/how%20to%20change%20jc%20Number%20_uuid_352cf4484f0e4359b08ac1c88bb5c945.mp4",
        },
        {
          title: "How to Create new proto",
          url: "https://developmentbucketdkc.s3.amazonaws.com/sampling_form99_testing/custom_media_assests/how%20to%20create%20new%20proto_uuid_2bb6982dad98421f9fb120a740f6fa67.mp4",
        },
        {
          title: "How to Add images in proto",
          url: "https://developmentbucketdkc.s3.amazonaws.com/sampling_form99_testing/custom_media_assests/how%20to%20add%20new%20image%20in%20proto_uuid_e30dc644c50d4d26ab58c50a84200ea3.mp4",
        },
        {
          title: "How to add comment in proto",
          url: "https://developmentbucketdkc.s3.amazonaws.com/sampling_form99_testing/custom_media_assests/how%20to%20add%20the%20new%20comment%20in%20proto%20%281%29_uuid_85d465b8a29e44f19e72e677eef95e8e.mp4",
        },
        {
          title: "How to add comment using mobile phone",
          url: "https://developmentbucketdkc.s3.amazonaws.com/sampling_form99_testing/custom_media_assests/HOW%20TO%20ADD%20COMMENTS%20USING%20MOBILE%20PHONE_uuid_931bb11a72894812addee7e3bd24b238.mp4",
        },
        {
          title: "How to take print of proto detail",
          url: "https://developmentbucketdkc.s3.amazonaws.com/sampling_form99_testing/custom_media_assests/how%20to%20take%20print%20of%20proto%20details%20page%20%281%29_uuid_413b64d4232340328ec36164bff5cff5.mp4",
        },
      ],
    },
    {
      title: "Merchant Manager Tutorial",
      videos: [
        {
          title: "How to create new users",
          url: "https://developmentbucketdkc.s3.amazonaws.com/sampling_form99_testing/custom_media_assests/how%20to%20create%20new%20users_uuid_d34c76002296427eb3752f089e6bf7f3.mp4",
        },
        {
          title: "How to create new MSR",
          url: "https://developmentbucketdkc.s3.amazonaws.com/sampling_form99_testing/custom_media_assests/how%20to%20create%20new%20msr_uuid_670a97c482c14a5e9afbae6caeefec02.mp4",
        },
        {
          title: "How to add new material type",
          url: "https://developmentbucketdkc.s3.amazonaws.com/sampling_form99_testing/custom_media_assests/how%20to%20add%20new%20material%20type_uuid_46572e5a48b44869bcb4741ac1ad3610.mp4",
        },
        {
          title: "How to add new process",
          url: "https://developmentbucketdkc.s3.amazonaws.com/sampling_form99_testing/custom_media_assests/how%20to%20add%20new%20process_uuid_8ab6704635234871a7a5e0f17223fa7b.mp4",
        },
        {
          title: "How to add new placement location",
          url: "https://developmentbucketdkc.s3.amazonaws.com/sampling_form99_testing/custom_media_assests/how%20to%20add%20new%20placement%20location_uuid_205742d451344771a121dba0a9e5c573.mp4",
        },
        {
          title: "How to add new needle type & flat lock & overlock type",
          url: "https://developmentbucketdkc.s3.amazonaws.com/sampling_form99_testing/custom_media_assests/how%20to%20add%20new%20neddle%20type%20and%20flat%20lock%20and%20overlock%20type_uuid_2f798368ac8c4c8e8ded552910204517.mp4",
        },
      ],
    },
  ];
  return (
    <div className="my-8 mx-4 sm:mx-8 md:mx-16 lg:mx-32 xl:mx-48 2xl:mx-64">
      <div className="text-center font-bold uppercase text-3xl mb-4 border-b-2 pb-2 ">
        Tutorial Videos
      </div>

      {sections.map((section: any, idx) => (
        <div key={idx} className="w-full border mt-12  bg-white shadow-sm">
          <h2 className="w-full text-2xl font-bold p-4 border-b text-center bg-gray-50 uppercase">
            {section.title}
          </h2>

          {/* Images Row */}
          {section.images && section.images.length > 0 && (
            <div className="grid grid-cols-1 gap-4 p-4">
              {section.images.map((img: any, imgIdx: number) => (
                <div
                  key={imgIdx}
                  className="flex flex-col items-center bg-gray-50 rounded-lg shadow hover:shadow-lg transition p-4"
                >
                  <img
                    src={img.url}
                    alt={img.title}
                    className="w-full max-w-xs h-auto mb-2 object-cover"
                  />
                  <div className="text-center font-semibold text-lg text-gray-700">
                    {img.title}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Videos Grid */}
          <div>
            {section.videos.map((video: any, i: number) => {
              const videoRef = useRef<HTMLVideoElement>(null);
              return (
                <div
                  key={i}
                  className="flex flex-col items-center bg-gray-50 mb-4 m-4 mt-10"
                >
                  <div className="text-center font-semibold text-xl p-4 border-b w-full bg-gray-200 uppercase">
                    {i + 1}
                    {" . "}
                    {video.title}
                  </div>
                  <video
                    ref={videoRef}
                    className="w-full max-h-100 p-4 cursor-pointer"
                    controls
                    src={video.url}
                    onDoubleClick={() => handleFullScreen(videoRef.current)}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default LayoutComponents(Page);
