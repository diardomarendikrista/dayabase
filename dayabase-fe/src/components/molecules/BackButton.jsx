import { cn } from "lib/utils";
import { IoMdArrowRoundBack } from "react-icons/io";
import { Link } from "react-router-dom";

export default function BackButton({ to, title, className }) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 text-2xl font-bold hover:text-indigo-600 text-3xl",
        className
      )}
      title={title}
    >
      <IoMdArrowRoundBack />
    </Link>
  );
}
