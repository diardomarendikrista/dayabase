import React, { forwardRef } from "react";
import { cn } from "lib/utils";

const Button = forwardRef(({ className, variant, size, ...props }, ref) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none";

  const buttonVariants = {
    variant: {
      primary: "bg-indigo-600 text-white hover:bg-indigo-700",
      secondary: "bg-gray-600 text-white hover:bg-gray-700",
      success: "bg-green-600 text-white hover:bg-green-700",
      info: "bg-blue-500 text-white hover:bg-blue-600",
      danger: "bg-red-600 text-white hover:bg-red-700",
      outline:
        "border border-gray-300 bg-white hover:bg-gray-100 text-gray-700",
      ghost: "hover:bg-gray-100 hover:text-gray-900",
    },
    size: {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-9 w-9",
    },
  };

  const variantClasses =
    buttonVariants.variant[variant] || buttonVariants.variant.primary;
  const sizeClasses = buttonVariants.size[size] || buttonVariants.size.default;

  return (
    <button
      className={cn(baseClasses, variantClasses, sizeClasses, className)}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

export default Button;
