import Modal from "components/molecules/Modal";
import Button from "components/atoms/Button";

export default function UnsavedChangesModal({ blocker }) {
  if (!blocker || blocker.state !== "blocked") {
    return null;
  }

  return (
    <Modal
      title="Unsaved Changes"
      showModal={true}
      setShowModal={(show) => {
        if (!show) blocker.reset();
      }}
    >
      <div className="space-y-4">
        <p>You have unsaved changes. Are you sure you want to leave?</p>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => blocker.reset()}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => blocker.proceed()}
          >
            Leave
          </Button>
        </div>
      </div>
    </Modal>
  );
}
