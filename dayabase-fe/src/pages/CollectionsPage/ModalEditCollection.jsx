import Button from "components/atoms/Button";
import Input from "components/atoms/Input";
import Modal from "components/molecules/Modal";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { updateCollection } from "store/slices/collectionsSlice";
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
      const newData = await dispatch(
        updateCollection({ id: collection.id, name, description })
      ).unwrap();
      onCollectionUpdated(newData);
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
            className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-light focus:border-primary-light"
            disabled={isSaving}
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button
            onClick={() => setShowModal(false)}
            variant="outline"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
