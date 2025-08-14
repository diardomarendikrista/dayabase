import Toast from "components/atoms/Toast";
import ToastPortal from "components/atoms/ToastPortal";
import { useSelector, useDispatch } from "react-redux";
import { removeToast } from "store/slices/toastSlice";

export default function ToastContainer() {
  const { toasts } = useSelector((state) => state.toast);
  const dispatch = useDispatch();

  return (
    <ToastPortal>
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
    </ToastPortal>
  );
}
