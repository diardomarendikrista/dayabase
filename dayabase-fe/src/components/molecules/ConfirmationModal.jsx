import Modal from "./Modal"; // Impor Modal reusable Anda

export default function ConfirmationModal({
  showModal,
  setShowModal,
  title = "Konfirmasi",
  message,
  customMessage,
  onConfirm,
  confirmText = "Konfirmasi",
  cancelText = "Batal",
  isDestructive = false, // Untuk memberi warna merah pada tombol konfirmasi
}) {
  const handleConfirm = () => {
    onConfirm();
    setShowModal(false);
  };

  return (
    <Modal
      title={title}
      showModal={showModal}
      setShowModal={setShowModal}
    >
      {message && (
        <div
          className="text-gray-600 mb-6"
          dangerouslySetInnerHTML={{ __html: message }}
        />
      )}
      {customMessage && (
        <div className="text-gray-600 mb-6">{customMessage}</div>
      )}
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => setShowModal(false)}
          className="px-4 py-2 bg-gray-200 rounded-md font-semibold text-gray-700 hover:bg-gray-300"
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          className={`px-4 py-2 text-white font-semibold rounded-md ${
            isDestructive
              ? "bg-red-600 hover:bg-red-700"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
