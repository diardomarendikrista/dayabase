// pages/DashboardEditorPage/FilterPanel/ModalAddEditFilter.jsx
import { useState } from "react";
import Modal from "components/molecules/Modal";
import FilterForm from "./FilterForm";

export default function ModalAddEditFilter({
  showModal,
  setShowModal,
  editingFilter,
  onSubmit,
}) {
  const [isSaving, setIsSaving] = useState(false);

  const title = editingFilter ? "Edit Filter" : "Add New Filter";

  const handleFormSubmitWrapper = async (formData) => {
    setIsSaving(true);
    const success = await onSubmit(formData);
    setIsSaving(false);

    // Jika sukses, tutup modal
    if (success) {
      setShowModal(false);
    }
    // Jika gagal, modal tetap terbuka (hook sudah menampilkan toast error)
  };

  const handleCancel = () => {
    if (isSaving) return;
    setShowModal(false);
  };

  return (
    <Modal
      title={title}
      showModal={showModal}
      setShowModal={setShowModal}
      closeOnOverlayClick={false}
    >
      <FilterForm
        editingFilter={editingFilter}
        onSubmit={handleFormSubmitWrapper}
        onCancel={handleCancel}
        isSaving={isSaving}
      />
    </Modal>
  );
}
