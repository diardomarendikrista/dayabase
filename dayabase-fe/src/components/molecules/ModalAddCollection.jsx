import { useState } from "react";
import { useDispatch } from "react-redux";
import Modal from "components/molecules/Modal";
import { addToast } from "store/slices/toastSlice";
import Input from "components/atoms/Input";
import { API } from "axios/axios";

export default function ModalAddCollection({
  showModal,
  setShowModal,
  onCollectionAdded,
}) {
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const dispatch = useDispatch();

  const handleCloseModal = () => {
    setShowModal(false);
    setNewCollectionName("");
  };

  const handleSaveCollection = async () => {
    if (!newCollectionName.trim()) {
      dispatch(
        addToast({ message: "Collection name cannot be empty.", type: "error" })
      );
      return;
    }
    setIsSaving(true);
    try {
      const response = await API.post("/api/collections", {
        name: newCollectionName,
      });
      // Panggil fungsi dari parent untuk memberitahu bahwa koleksi baru telah dibuat
      onCollectionAdded(response.data);
      dispatch(
        addToast({
          message: "Collection created successfully!",
          type: "success",
        })
      );
      handleCloseModal();
    } catch (error) {
      console.error("Failed to create collection:", error);
      dispatch(
        addToast({ message: "Failed to create collection.", type: "error" })
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      title="Create a new collection"
      showModal={showModal}
      setShowModal={setShowModal}
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="collection-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name
          </label>
          <Input
            id="collection-name"
            type="text"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSaveCollection()}
            placeholder="e.g., Marketing Analytics"
            disabled={isSaving}
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={handleCloseModal}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveCollection}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
