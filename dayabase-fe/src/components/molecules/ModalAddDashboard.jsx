import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import Input from "components/atoms/Input";
import Button from "components/atoms/Button";

export default function ModalAddDashboard({
  showModal,
  setShowModal,
  onConfirm,
}) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState(null);

  const inputRef = useRef(null);

  const handleConfirm = () => {
    if (inputValue.trim()) {
      onConfirm(inputValue);
      setShowModal(false);
    } else {
      setError("Input tidak boleh kosong.");
    }
  };

  useEffect(() => {
    if (showModal) {
      setError(null);
      setInputValue("");
      inputRef.current?.focus();
    }
  }, [showModal]);

  return (
    <Modal
      title="Create New Dashboard"
      showModal={showModal}
      setShowModal={setShowModal}
      closeOnOverlayClick={false}
    >
      <p className="text-gray-600 mb-2">Enter a name for your new dashboard:</p>
      <Input
        ref={inputRef}
        type="text"
        placeholder={"Dashboard Name"}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          if (error) setError(null);
        }}
        error={!!error}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleConfirm();
        }}
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex justify-end space-x-4 mt-2">
        <Button
          onClick={() => setShowModal(false)}
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          className="px-5"
        >
          Save
        </Button>
      </div>
    </Modal>
  );
}
