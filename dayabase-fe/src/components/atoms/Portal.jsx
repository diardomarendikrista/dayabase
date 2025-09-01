import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Dev notes :
// Portal ini digunakan untuk merender komponen di luar root utama React,
// misalnya langsung ke <body>. Hal ini berguna agar elemen (seperti modal atau tooltip)
// tidak terpengaruh oleh aturan CSS atau layout parent, sehingga tidak tumpang tindih.
export default function Portal({ children, portalId, zIndex = 1000 }) {
  const [portalElement, setPortalElement] = useState(null);

  useEffect(() => {
    let element = document.getElementById(portalId);
    let created = false;

    if (!element) {
      created = true;
      element = document.createElement("div");
      element.id = portalId;
      element.style.position = "relative";
      element.style.zIndex = zIndex.toString();
      document.body.appendChild(element);
    }

    setPortalElement(element);

    return () => {
      if (created && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    };
  }, [portalId, zIndex]);

  return portalElement ? createPortal(children, portalElement) : null;
}
