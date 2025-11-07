// components/molecules/BackButton.jsx
import { cn } from "lib/utils";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";

export default function BackButton({ to, title, className, onClick }) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else if (to) {
      navigate(to);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 font-bold hover:text-primary text-3xl",
        className
      )}
      title={title}
      type="button"
    >
      <IoMdArrowRoundBack />
    </button>
  );
}
