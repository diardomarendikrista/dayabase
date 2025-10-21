import { useState, useEffect } from "react";
import { API } from "axios/axios";
import ConfirmationModal from "components/molecules/ConfirmationModal";
import ModalFormUser from "./ModalFormUser";
import Button from "components/atoms/Button";

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
        <Button
          onClick={() => {
            setEditingUser(null);
            setShowFormModal(true);
          }}
        >
          Add User
        </Button>
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
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-gray-200 last:border-b-0"
              >
                <td className="p-4">{user.full_name}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4">{user.role}</td>
                <td className="p-4">
                  {user.is_active ? "Active" : "Inactive"}
                </td>
                <td className="p-4 space-x-4">
                  <Button
                    onClick={() => {
                      setEditingUser(user);
                      setShowFormModal(true);
                    }}
                    variant="ghost"
                    className="text-primary font-semibold p-0 h-0"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => openDeleteModal(user)}
                    variant="ghost"
                    className="text-red-600 font-semibold p-0 h-0"
                  >
                    Delete
                  </Button>
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
        isDanger={true}
      />
    </div>
  );
}
