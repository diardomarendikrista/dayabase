import { useState, useEffect } from "react";
import { API } from "axios/axios";
import ConfirmationModal from "components/molecules/ConfirmationModal";
import ModalFormUser from "./ModalFormUser";

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await API.get("/api/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch user data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleFormSuccess = () => {
    fetchUsers(); // Refetch data after create/update
    setShowFormModal(false);
    setEditingUser(null);
  };

  const openDeleteModal = (user) => {
    setItemToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await API.delete(`/api/users/${itemToDelete.id}`);
      fetchUsers(); // Refetch data
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user.");
    }
  };

  if (isLoading) return <p>Loading users...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <button
          onClick={() => {
            setEditingUser(null);
            setShowFormModal(true);
          }}
          className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700"
        >
          Add User
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-md">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Role</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="p-4">{user.full_name}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4">{user.role}</td>
                <td className="p-4">
                  {user.is_active ? "Active" : "Inactive"}
                </td>
                <td className="p-4 space-x-4">
                  <button
                    onClick={() => {
                      setEditingUser(user);
                      setShowFormModal(true);
                    }}
                    className="text-indigo-600 font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteModal(user)}
                    className="text-red-600 font-semibold"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ModalFormUser
        showModal={showFormModal}
        setShowModal={setShowFormModal}
        onSuccess={handleFormSuccess}
        initialData={editingUser}
      />

      <ConfirmationModal
        showModal={showDeleteModal}
        setShowModal={setShowDeleteModal}
        title="Delete User"
        message={`Are you sure you want to delete the user "${itemToDelete?.full_name}"?`}
        onConfirm={handleDelete}
        isDestructive={true}
      />
    </div>
  );
}
