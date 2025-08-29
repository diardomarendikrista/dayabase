import { useState } from "react";
import { API } from "axios/axios";
import Modal from "./Modal";
import Input from "components/atoms/Input";
import Button from "components/atoms/Button";

export default function ModalChangePassword({ showModal, setShowModal }) {
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (formData.newPassword !== formData.confirmPassword) {
      return setError("New passwords do not match.");
    }
    try {
      // Pastikan path API ini benar
      await API.put("/api/account/change-password", {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });
      setSuccess("Password updated successfully!");
      setTimeout(() => setShowModal(false), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password.");
    }
  };

  return (
    <Modal
      title="Change Password"
      showModal={showModal}
      setShowModal={setShowModal}
      closeOnOverlayClick={false}
    >
      <div className="space-y-4">
        <Input
          name="oldPassword"
          type="password"
          value={formData.oldPassword}
          onChange={handleChange}
          placeholder="Current Password"
        />
        <Input
          name="newPassword"
          type="password"
          value={formData.newPassword}
          onChange={handleChange}
          placeholder="New Password"
        />
        <Input
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm New Password"
        />

        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-500">{success}</p>}

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            onClick={() => setShowModal(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Update Password</Button>
        </div>
      </div>
    </Modal>
  );
}
