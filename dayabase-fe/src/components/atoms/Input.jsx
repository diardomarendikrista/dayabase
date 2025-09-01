import { forwardRef } from "react";
import { clsx } from "clsx";
import { cn } from "lib/utils";
import { useId } from "react";

const Input = forwardRef(
  ({ className, type = "text", error, label, ...props }, ref) => {
    const id = useId();
    const baseClasses = cn(
      "block w-full rounded-md shadow-sm min-h-[38px] px-3",
      "focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-gray-400",
      "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
      "transition duration-150 ease-in-out"
    );

    const errorClasses =
      "!border-red-500 text-red-900 focus:!border-red-500 focus:!ring-red-500 border-1";

    return (
      <div>
        {label && (
          <label
            htmlFor={props.id || id}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={props.id || id}
          ref={ref}
          className={clsx(baseClasses, error && errorClasses, className)}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
