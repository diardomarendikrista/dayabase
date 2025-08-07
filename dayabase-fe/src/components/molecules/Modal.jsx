import ModalPortal from "../atoms/ModalPortal"; // Pastikan path ini benar

export default function Modal({ children, title, onClose }) {
  // Mencegah klik di dalam modal ikut menutup modal (event bubbling)
  const handleContentClick = (e) => e.stopPropagation();

  return (
    <ModalPortal>
      {/* Lapisan Overlay Abu-abu */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
        onClick={onClose} // Menutup modal saat overlay diklik
      >
        {/* Kontainer Konten Modal */}
        <div
          className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl"
          onClick={handleContentClick}
        >
          {/* Header Modal */}
          <div className="flex justify-between items-center mb-4 pb-4 border-b">
            <h2 className="text-xl font-bold">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Konten yang dikirim dari parent */}
          <div>{children}</div>
        </div>
      </div>
    </ModalPortal>
  );
}
