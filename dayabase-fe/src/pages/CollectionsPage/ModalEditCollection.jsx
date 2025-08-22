import { API } from "axios/axios";
import Input from "components/atoms/Input";
import Modal from "components/molecules/Modal";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { addToast } from "store/slices/toastSlice";

export default function ModalEditCollection({
  showModal,
  setShowModal,
  collection,
  onCollectionUpdated,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const dispatch = useDispatch();

  // Isi form dengan data koleksi saat modal dibuka
  useEffect(() => {
    if (collection) {
      setName(collection.name);
      setDescription(collection.description || "");
    }
  }, [collection]);

  const handleSave = async () => {
    if (!name.trim()) {
      dispatch(
        addToast({ message: "Collection name cannot be empty.", type: "error" })
      );
      return;
    }
    setIsSaving(true);
    try {
      const response = await API.put(`/api/collections/${collection.id}`, {
        name,
        description,
      });
      // Panggil callback untuk memberitahu parent bahwa data telah diperbarui
      onCollectionUpdated(response.data);
      dispatch(
        addToast({
          message: "Collection updated successfully!",
          type: "success",
        })
      );
      setShowModal(false);
    } catch (error) {
      dispatch(
        addToast({ message: "Failed to update collection.", type: "error" })
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      title="Edit Collection"
      showModal={showModal}
      setShowModal={setShowModal}
      closeOnOverlayClick={false}
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="edit-collection-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name
          </label>
          <Input
            id="edit-collection-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSaving}
          />
        </div>
        <div>
          <label
            htmlFor="edit-collection-desc"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
          </label>
          <textarea
            id="edit-collection-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isSaving}
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
