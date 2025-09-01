import { useSelector, useDispatch } from "react-redux";
import { removeToast } from "store/slices/toastSlice";
import Toast from "components/atoms/Toast";
import Portal from "components/atoms/Portal";

export default function ToastContainer() {
  const { toasts } = useSelector((state) => state.toast);
  const dispatch = useDispatch();

  return (
    <Portal
      portalId="toast-portal-root"
      zIndex={2000}
    >
      <div className="fixed bottom-5 left-5 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => dispatch(removeToast({ id: toast.id }))}
          />
        ))}
      </div>
    </Portal>
  );
}
