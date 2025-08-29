import Button from "components/atoms/Button";
import Modal from "./Modal"; // Impor Modal reusable Anda

export default function ConfirmationModal({
  showModal,
  setShowModal,
  title = "Confirm",
  message,
  customMessage,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDanger = false,
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
        <Button
          onClick={() => setShowModal(false)}
          variant="outline"
        >
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          variant={isDanger ? "danger" : "primary"}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
