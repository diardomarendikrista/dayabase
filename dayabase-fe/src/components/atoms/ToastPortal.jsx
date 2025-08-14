import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function ToastPortal({ children }) {
  const [portalElement, setPortalElement] = useState(null);

  useEffect(() => {
    let element = document.getElementById("toast-portal-root");
    if (!element) {
      element = document.createElement("div");
      element.id = "toast-portal-root";
      element.style.position = "relative";
      // 2. Beri z-index yang lebih tinggi dari modal
      element.style.zIndex = "2000";
      document.body.appendChild(element);
    }
    setPortalElement(element);
  }, []);

  return portalElement ? createPortal(children, portalElement) : null;
}
