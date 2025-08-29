import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import Modal from "components/molecules/Modal";
import { addToast } from "store/slices/toastSlice";
import Input from "components/atoms/Input";
import Button from "components/atoms/Button";

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
          <Button
            onClick={handleCloseModal}
            variant="outline"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
