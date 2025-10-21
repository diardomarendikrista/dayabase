import { cn } from "lib/utils";
import { IoMdArrowRoundBack } from "react-icons/io";
import { Link } from "react-router-dom";

export default function BackButton({ to, title, className }) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 font-bold hover:text-primary text-3xl",
        className
      )}
      title={title}
    >
      <IoMdArrowRoundBack />
    </Link>
  );
}
