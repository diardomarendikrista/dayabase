import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function ModalPortal({ children }) {
  const [portalElement, setPortalElement] = useState(null);

  useEffect(() => {
    // Cari atau buat container untuk portal
    let element = document.getElementById("modal-portal-root");
    let created = false;

    if (!element) {
      created = true;
      element = document.createElement("div");
      element.id = "modal-portal-root";
      // Tambahkan beberapa style dasar agar selalu di atas
      element.style.position = "relative";
      element.style.zIndex = "1000";
      document.body.appendChild(element);
    }

    setPortalElement(element);

    // Fungsi cleanup
    return () => {
      if (created && element.parentNode) {
        document.body.removeChild(element);
      }
    };
  }, []);

  // Render ke dalam portal hanya jika elemennya sudah ada
  return portalElement ? createPortal(children, portalElement) : null;
}
