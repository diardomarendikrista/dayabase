// src/components/atoms/Skeleton.jsx

import { cn } from "lib/utils";

export default function Skeleton({ className }) {
  return (
    <div
      className={cn(
        "w-full h-full animate-pulse rounded-md bg-gray-200",
        className
      )}
    ></div>
  );
}
