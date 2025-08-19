import { useEffect, useState } from "react";
import Modal from "./Modal";
import Input from "components/atoms/Input";

export default function PromptModal({
  showModal,
  setShowModal,
  title,
  message,
  onConfirm,
  inputPlaceholder,
  confirmText = "Save",
  initialValue = "",
  closeOnOverlayClick = true,
}) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [error, setError] = useState(null);

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
      setInputValue(initialValue);
      setError(null);
    }
  }, [showModal, initialValue]);

  return (
    <Modal
      title={title}
      showModal={showModal}
      setShowModal={setShowModal}
      closeOnOverlayClick={closeOnOverlayClick}
    >
      <p className="text-gray-600 mb-2">{message}</p>
      <Input
        type="text"
        placeholder={inputPlaceholder}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          if (error) setError(null); // Hapus error saat pengguna mulai mengetik
        }}
        error={!!error} // Kirim status error ke komponen Input
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleConfirm();
        }}
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex justify-end space-x-4 mt-2">
        <button
          onClick={() => setShowModal(false)}
          className="px-4 py-2 bg-gray-200 rounded-md font-semibold text-gray-700 hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700"
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
