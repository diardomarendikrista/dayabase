import { useEffect } from "react";
import { useBlocker } from "react-router-dom";

/**
 * A custom hook to block navigation when there are unsaved changes.
 * Handles both in-app React Router navigation (via useBlocker)
 * and native browser navigation/refresh (via beforeunload).
 *
 * @param {boolean} isDirty - Whether there are unsaved changes
 * @returns {object} blocker - The React Router blocker state and methods (.proceed(), .reset(), .state)
 */
export function useUnsavedChangesWarning(isDirty) {
  // Block internal react-router navigation
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  // Block native browser navigation (refresh / close tab)
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = ""; // Required for most modern browsers to show the native prompt
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  return blocker;
}
