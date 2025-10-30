"use client";

import { useState, useEffect } from "react";
import { useGeneralApiCall } from "../../../services/useGeneralApiCall";
import { useRouter } from "next/navigation";
import LayoutComponents from "../../layoutComponents";
import toast, { Toaster } from "react-hot-toast";

interface User {
  user_id: string;
  username: string;
  name: string;
  email: string;
  role: string;
}

function UsersList() {
  const router = useRouter();
  const { getApi, postApi } = useGeneralApiCall();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [Role, setRoles] = useState<Role[]>([]);
  const [userRole, setuserRole] = useState<Role | null>(null);
  interface Role {
    id: string;
    role_name: string;
  }
  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newEmail) return;

    setUpdateLoading(true);
    try {
      const response = await postApi(`authentication/change-email/`, {
        user_id: selectedUser.user_id,
        new_email: newEmail,
      });

      if (response && !response.error_status) {
        // Update the users list with the new email
        setUsers(
          users.map((user) =>
            user.user_id === selectedUser.user_id
              ? { ...user, email: newEmail }
              : user
          )
        );
        setIsEmailModalOpen(false);
        setNewEmail("");
        setSelectedUser(null);
        toast.success("Email updated successfully!");
      } else {
        toast.error(response?.message || "Error updating email");
      }
    } catch (err) {
      console.error("Error updating email:", err);
      toast.error("Failed to update email");
    } finally {
      setUpdateLoading(false);
    }
  };
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
      }
    };
    fetchRoles();
  });
  const openEmailModal = (user: User) => {
    setSelectedUser(user);
    setNewEmail(user.email); // Pre-fill with current email
    setIsEmailModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setuserRole(Role.find((role) => role.role_name === user.role) || null);
    setNewName(user.name);
    setNewUsername(user.username);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newName.trim() || !newUsername.trim()) return;

    setUpdateLoading(true);
    try {
      const response = await postApi(
        `authentication/user-update/${selectedUser.user_id}/`,
        {
          name: newName,
          username: newUsername,
          role_id: userRole?.id || "",
        }
      );

      if (response && !response.error_status) {
        // Update the users list with the new details
        fetchUsers();
        setIsEditModalOpen(false);
        setNewName("");
        setNewUsername("");
        setSelectedUser(null);
        setSuccess("User details updated successfully!");
      } else {
        setError(response?.message || "Error updating user details");
      }
    } catch (err) {
      console.error("Error updating user:", err);
      setError("Failed to update user details");
    } finally {
      setUpdateLoading(false);
    }
  };
  const fetchUsers = async () => {
    try {
      const response = await getApi("authentication/list-users/");
      if (response && !response.error_status && Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        setError("Error fetching users");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    // Check for success message in URL
    const searchParams = new URLSearchParams(window.location.search);
    const successMessage = searchParams.get("success");
    if (successMessage) {
      setSuccess(successMessage);
      // Remove the success parameter from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }

    fetchUsers();
  }, [getApi]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster
        position="top-right"
        toastOptions={{
          success: {
            style: {
              background: "#34D399",
              color: "white",
            },
            duration: 3000,
          },
          error: {
            style: {
              background: "#EF4444",
              color: "white",
            },
            duration: 3000,
          },
        }}
      />

      {/* Email Update Modal */}
      {isEmailModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-gray-300/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-md rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Update Email Address
            </h3>
            <form onSubmit={handleEmailUpdate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Email
                </label>
                <p className="text-gray-500">{selectedUser.email}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEmailModalOpen(false);
                    setSelectedUser(null);
                    setNewEmail("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md ${
                    updateLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {updateLoading ? "Updating..." : "Update Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-gray-300/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-md rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Update User Details
            </h3>
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Username
                  </label>
                  <p className="text-gray-500 mb-2">{selectedUser.username}</p>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Username
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter new username"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Name
                  </label>
                  <p className="text-gray-500 mb-2">{selectedUser.name}</p>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter new name"
                    required
                  />
                </div>
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
                    value={userRole?.id || ""}
                    onChange={(e) => {
                      const selected =
                        Role.find((role) => role.id === e.target.value) || null;
                      setuserRole(selected);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a role</option>
                    {Role.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.role_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedUser(null);
                    setNewName("");
                    setNewUsername("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    updateLoading || !newName.trim() || !newUsername.trim()
                  }
                  className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md ${
                    updateLoading || !newName.trim() || !newUsername.trim()
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {updateLoading ? "Updating..." : "Update Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">Users List</h1>
              <button
                onClick={() => router.push("/admin/create-user")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                + Add User
              </button>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mx-6 mt-4 p-4 bg-green-50 border-l-4 border-green-500 flex justify-between items-center">
              <p className="text-green-700">{success}</p>
              <button
                onClick={() => setSuccess("")}
                className="text-green-700 hover:text-green-900"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
              <p>{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading users...
            </div>
          ) : (
            /* Table */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.user_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${
                            user.role === "Admin"
                              ? "bg-purple-100 text-purple-800"
                              : user.role === "sampling manager"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => openEditModal(user)}
                          className="px-2 py-1 text-black mr-4 bg-gray-100 rounded-sm cursor-pointer "
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openEmailModal(user)}
                          className="px-2 py-1 text-black mr-4 bg-gray-100 rounded-sm cursor-pointer "
                        >
                          Change Email
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Empty State */}
              {users.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  <p>No users found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LayoutComponents(UsersList);
