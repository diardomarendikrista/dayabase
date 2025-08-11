import { forwardRef } from "react";
import { clsx } from "clsx";

const Input = forwardRef(
  ({ className, type = "text", error, ...props }, ref) => {
    const baseClasses =
      "block w-full rounded-sm border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition duration-150 ease-in-out sm:text-";

    const errorClasses =
      "!border-red-500 text-red-900 focus:!border-red-500 focus:!ring-red-500 border-1";

    return (
      <input
        type={type}
        ref={ref}
        className={clsx(baseClasses, error && errorClasses, className)}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export default Input;
