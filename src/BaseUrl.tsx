function BaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

export default BaseUrl;
