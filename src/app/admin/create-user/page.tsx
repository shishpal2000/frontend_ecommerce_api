"use client";

import { useState } from "react";
import { useGeneralApiCall } from "../../../services/useGeneralApiCall";
import { useRouter } from "next/navigation";
import LayoutComponents from "../../layoutComponents";

interface Role {
  id: string;
  role_name: string;
}

interface FormData {
  username: string;
  password: string;
  confirm_password: string;
  role: string;
  name: string;
  email: string;
}

function CreateUser() {
  const router = useRouter();
  const { postApi, getApi } = useGeneralApiCall();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const [formData, setFormData] = useState<FormData>({
    username: "",
    password: "",
    confirm_password: "",
    role: "",
    name: "",
    email: "",
  });

  // Fetch roles when component mounts
  useState(() => {
    const fetchRoles = async () => {
      try {
        const response = await getApi("authentication/list-roles/");
        if (
          response &&
          !response.error_status &&
          Array.isArray(response.data)
        ) {
          setRoles(response.data as Role[]);
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
        setErrorMessage("Failed to load roles");
      }
    };
    fetchRoles();
  });

  const validateForm = (): boolean => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!formData.username.trim()) {
      setErrorMessage("Username is required");
      return false;
    }

    if (formData.password !== formData.confirm_password) {
      setErrorMessage("Passwords do not match");
      return false;
    }
    if (!formData.role) {
      setErrorMessage("Please select a role");
      return false;
    }
    if (!formData.name.trim()) {
      setErrorMessage("Name is required");
      return false;
    }
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setErrorMessage("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await postApi("/authentication/create-user/", {
        username: formData.username,
        password: formData.password,
        confirm_password: formData.confirm_password,
        role: formData.role,
        name: formData.name,
        email: formData.email,
      });
      if (response && !response.error_status) {
        setSuccessMessage("User created successfully!");
        // Reset form
        setFormData({
          username: "",
          password: "",
          confirm_password: "",
          role: "",
          name: "",
          email: "",
        });
        // Redirect to users list with success message
        router.push("/admin/users?success=User created successfully");
      } else {
        setErrorMessage(response?.message || "Error creating user");
      }
    } catch (err) {
      console.error("Error creating user:", err);
      setErrorMessage("An error occurred while creating the user");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              Create New User
            </h1>
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
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
              <p className="text-sm">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Username* (Only Lower case)
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username.toLowerCase()}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter username"
                required
              />
            </div>

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name* (Only Lower case)
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name.toLowerCase()}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter full name"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email* (Only Lower case)
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email.toLowerCase()}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
                required
              />
            </div>
            {/* Role */}
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Role*
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.role_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password*
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 8 characters long
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirm_password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm Password*
              </label>
              <input
                type="password"
                id="confirm_password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm password"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors
                  ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {loading ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LayoutComponents(CreateUser);
