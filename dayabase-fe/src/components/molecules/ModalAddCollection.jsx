import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import Modal from "components/molecules/Modal";
import { addToast } from "store/slices/toastSlice";
import Input from "components/atoms/Input";

export default function ModalAddCollection({
  showModal,
  setShowModal,
  onConfirm,
}) {
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const dispatch = useDispatch();
  const inputRef = useRef(null);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleConfirm = async () => {
    if (!name.trim()) {
      dispatch(
        addToast({ message: "Collection name cannot be empty.", type: "error" })
      );
      return;
    }
    setIsSaving(true);
    await onConfirm(name);
    setIsSaving(false);
    setShowModal(false);
  };

  useEffect(() => {
    if (showModal) {
      setName("");
      inputRef.current?.focus();
    }
  }, [showModal]);

  return (
    <Modal
      title="Create a new collection"
      showModal={showModal}
      setShowModal={setShowModal}
      closeOnOverlayClick={false}
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
            ref={inputRef}
            id="collection-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
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
            onClick={handleConfirm}
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
