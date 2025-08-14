import { useEffect, useState } from "react";
import { RiCheckLine, RiCloseLine, RiErrorWarningLine } from "react-icons/ri";

export default function Toast({ message, type, onClose }) {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isEntering, setIsEntering] = useState(false); // fix 1st toast not animating

  const icons = {
    success: <RiCheckLine className="h-6 w-6 text-green-500" />,
    error: <RiErrorWarningLine className="h-6 w-6 text-red-500" />,
  };

  useEffect(() => {
    const enterTimeout = setTimeout(() => setIsEntering(true), 10);

    const exitTimer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(onClose, 300);
    }, 4000);

    return () => {
      clearTimeout(enterTimeout);
      clearTimeout(exitTimer);
    };
  }, [onClose]);

  const handleClose = () => {
    setIsFadingOut(true);
    setTimeout(onClose, 300);
  };

  const baseClasses =
    "flex items-center w-full max-w-xs p-4 text-gray-500 bg-white rounded-lg shadow-lg transition-all duration-300";

  const initialAnimation = "opacity-0 translate-y-8";
  const enterAnimation = "opacity-100 translate-y-0";
  const exitAnimation = "opacity-0 translate-y-8";

  const animationClasses = isFadingOut
    ? exitAnimation
    : isEntering
      ? enterAnimation
      : initialAnimation;

  return (
    <div
      className={`${baseClasses} ${animationClasses}`}
      role="alert"
    >
      <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8">
        {icons[type]}
      </div>
      <div className="ml-3 text-sm font-normal">{message}</div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg p-1.5 hover:bg-gray-100 inline-flex h-8 w-8"
        onClick={handleClose}
      >
        <RiCloseLine className="w-5 h-5" />
      </button>
    </div>
  );
}
