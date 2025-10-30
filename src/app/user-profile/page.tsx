"use client";

import { useState, useEffect } from "react";
import LayoutComponents from "../layoutComponents";
import { useGeneralApiCall } from "../../services/useGeneralApiCall";

// Function to decode JWT and get expiry date


interface UserData {
  user_id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  role_id: string;
  access: string;
  refresh: string;
}

function UserProfile() {
  const { postApi } = useGeneralApiCall();
  const [profile, setProfile] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateStatus, setUpdateStatus] = useState({ message: '', type: '' });

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('authUser');
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        setProfile(parsedData);
        console.log(parsedData)
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">


      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Profile Header */}


          {/* Profile Info */}
          <div className="pt-16 px-8 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                <p className="text-black-500 mt-1">Username: {profile.username}</p>

              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Contact Information</h3>
                  <div className="mt-2 space-y-2">
                    <p className="flex items-center text-black-700">
                      Email: 
                      {"     "+profile.email}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Account Information</h3>
                  <div className="mt-2 space-y-2">
                    
                    <p className="flex items-center text-gray-700">
                      
                      Role: {profile.role}
                    </p>
             
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex space-x-4">
              <button
                onClick={() => {
                  if (profile) {
                    setEditName(profile.name);
                    setEditUsername(profile.username);
                    setShowEditModal(true);
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit Profile
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(true);
                  setOldPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-300/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
            
            {updateStatus.message && (
              <div className={`mb-4 p-3 rounded ${
                updateStatus.type === 'success' 
                  ? 'bg-green-100 text-green-700 border border-green-400' 
                  : 'bg-red-100 text-red-700 border border-red-400'
              }`}>
                {updateStatus.message}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  id="oldPassword"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setOldPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (newPassword !== confirmPassword) {
                    setUpdateStatus({ message: 'New passwords do not match', type: 'error' });
                    return;
                  }


                  setUpdateLoading(true);
                  setUpdateStatus({ message: '', type: '' });
                  
                  try {
                    const response = await postApi('authentication/change-password/', {
                      old_password: oldPassword,
                      new_password: newPassword,
                      confirm_password: confirmPassword
                    });

                    if (response && !response.error_status) {
                      setUpdateStatus({ message: 'Password updated successfully', type: 'success' });
                      setTimeout(() => {
                        setShowPasswordModal(false);
                        setOldPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setUpdateStatus({ message: '', type: '' });
                      }, 2000);
                    } else {
                      setUpdateStatus({ message: response?.message || 'Error updating password', type: 'error' });
                    }
                  } catch (error) {
                    console.error('Error updating password:', error);
                    setUpdateStatus({ message: 'Failed to update password', type: 'error' });
                  } finally {
                    setUpdateLoading(false);
                  }
                }}
                disabled={!oldPassword || !newPassword || !confirmPassword || updateLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {updateLoading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-300/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile</h3>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <div className="text-xs text-gray-500 mb-2">
                  Current name: <span className="font-medium text-gray-700">{profile?.name}</span>
                </div>
                <input
                  type="text"
                  id="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter new name"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <div className="text-xs text-gray-500 mb-2">
                  Current username: <span className="font-medium text-gray-700">{profile?.username}</span>
                </div>
                <input
                  type="text"
                  id="username"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="Enter new username"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  if (profile) {
                    setEditName(profile.name);
                    setEditUsername(profile.username);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Here we'll add the update logic later
                  setShowEditModal(false);
                }}
                disabled={!editName.trim() || !editUsername.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LayoutComponents(UserProfile);
