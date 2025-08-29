import { useState, useEffect } from "react";
import { API } from "axios/axios";
import Modal from "components/molecules/Modal";
import Input from "components/atoms/Input";
import Button from "components/atoms/Button";

export default function ModalFormUser({
  showModal,
  setShowModal,
  onSuccess,
  initialData,
}) {
  const isEditMode = !!initialData;
  const initialFormData = {
    fullName: "",
    email: "",
    password: "",
    role: "VIEWER",
    is_active: true,
  };
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    try {
      if (isEditMode) {
        // Remove password from payload if it's empty
        const { password, ...payload } = formData;
        await API.put(`/api/users/${initialData.id}`, payload);
      } else {
        await API.post("/api/users", formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed.");
    }
  };

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        fullName: initialData.full_name,
        email: initialData.email,
        password: "",
        role: initialData.role,
        is_active: initialData.is_active,
      });
    }
  }, [initialData, isEditMode, showModal]);

  useEffect(() => {
    setTimeout(() => {
      if (!showModal) {
        setFormData(initialFormData);
      }
    }, 300);
  }, [showModal]);

  return (
    <Modal
      title={isEditMode ? "Edit User" : "Add New User"}
      showModal={showModal}
      setShowModal={setShowModal}
      closeOnOverlayClick={false}
    >
      <div className="space-y-4">
        <Input
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Full Name"
        />
        <Input
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          disabled={isEditMode}
        />
        {!isEditMode && (
          <Input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
          />
        )}
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full rounded-md border-gray-300"
        >
          <option value="VIEWER">Viewer</option>
          <option value="EDITOR">Editor</option>
          <option value="ADMIN">Admin</option>
        </select>
        {isEditMode && (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
            />
            <span>Active Account</span>
          </label>
        )}
        {error && <p className="text-red-500">{error}</p>}
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            onClick={() => setShowModal(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="px-5"
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
