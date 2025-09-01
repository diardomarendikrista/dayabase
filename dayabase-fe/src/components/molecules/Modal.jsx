import Button from "components/atoms/Button";
import Portal from "components/atoms/Portal";
import { RiCloseLine } from "react-icons/ri";

export default function Modal({
  children,
  title,
  onClose,
  showModal,
  setShowModal,
  closeOnOverlayClick = true,
}) {
  const handleClose = () => {
    setShowModal && setShowModal(false);
    onClose && onClose();
  };

  // Mencegah klik di dalam modal ikut menutup modal (event bubbling)
  const handleContentClick = (e) => e.stopPropagation();

  return (
    <Portal
      portalId="modal-portal-root"
      zIndex={1000}
    >
      {/* Lapisan Overlay Abu-abu */}
      <div
        className={`fixed inset-0 bg-black/50 flex justify-center items-center z-50 transition-opacity duration-300 ${
          showModal ? "" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeOnOverlayClick ? handleClose : undefined}
        aria-hidden={!showModal}
      >
        {/* Kontainer Konten Modal */}
        <div
          className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl"
          onClick={handleContentClick}
        >
          {/* Header Modal */}
          <div className="flex justify-between items-center mb-4 pb-4 border-b">
            <h2 className="text-xl font-bold">{title}</h2>
            <Button
              onClick={handleClose}
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-transparent"
            >
              <RiCloseLine className="h-6 w-6" />
            </Button>
          </div>

          <div>{children}</div>
        </div>
      </div>
    </Portal>
  );
}
