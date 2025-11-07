// pages/DashboardEditorPage/FilterPanel/useFilterPanel.jsx
// Custom hook for FilterPanel business logic

import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { API } from "axios/axios";
import { addToast } from "store/slices/toastSlice";
import { generateSQLTemplate } from "./FilterOperators";

export function useFilterPanel({
  dashboardId,
  filters,
  onFiltersChange,
  filterValues,
  onFilterValuesChange,
}) {
  const dispatch = useDispatch();

  const [localFilterValues, setLocalFilterValues] = useState({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [editingFilter, setEditingFilter] = useState(null);

  // Sync local values with prop values
  useEffect(() => {
    setLocalFilterValues(filterValues);
  }, [filterValues]);

  // Handle filter value change (local state)
  const handleFilterValueChange = (filterName, value) => {
    setLocalFilterValues((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  // Apply filters (sync to parent)
  const handleApplyFilters = () => {
    onFilterValuesChange(localFilterValues);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setLocalFilterValues({});
    onFilterValuesChange({});
    dispatch(
      addToast({
        message: "All filters cleared",
        type: "info",
      })
    );
  };

  // Add new filter
  const handleAddFilter = async (formData) => {
    if (!formData.name.trim() || !formData.displayName.trim()) {
      dispatch(
        addToast({
          message: "Filter name and display name are required",
          type: "error",
        })
      );
      return false;
    }

    if (
      (formData.type === "select" || formData.type === "multi-select") &&
      formData.options.length === 0
    ) {
      dispatch(
        addToast({
          message: "Select type filter requires at least one option",
          type: "error",
        })
      );
      return false;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        display_name: formData.displayName.trim(),
        type: formData.type,
        operator: formData.operator,
      };

      if (formData.type === "select") {
        payload.options = formData.options;
      }

      const response = await API.post(
        `/api/dashboards/${dashboardId}/filters`,
        payload
      );

      onFiltersChange([...filters, response.data]);

      dispatch(
        addToast({
          message: "Filter added successfully",
          type: "success",
        })
      );
      return true;
    } catch (error) {
      console.error("Failed to add filter:", error);
      dispatch(
        addToast({
          message: error.response?.data?.message || "Failed to add filter",
          type: "error",
        })
      );
      return false;
    }
  };

  // Update existing filter
  const handleUpdateFilter = async (formData) => {
    if (!formData.name.trim() || !formData.displayName.trim()) {
      dispatch(
        addToast({
          message: "Filter name and display name are required",
          type: "error",
        })
      );
      return false;
    }

    if (
      (formData.type === "select" || formData.type === "multi-select") &&
      formData.options.length === 0
    ) {
      dispatch(
        addToast({
          message: "Select type filter requires at least one option",
          type: "error",
        })
      );
      return false;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        display_name: formData.displayName.trim(),
        type: formData.type,
        operator: formData.operator,
      };

      if (formData.type === "select" || formData.type === "multi-select") {
        payload.options = formData.options;
      }

      const response = await API.put(
        `/api/dashboards/${dashboardId}/filters/${editingFilter.id}`,
        payload
      );

      onFiltersChange(
        filters.map((f) => (f.id === editingFilter.id ? response.data : f))
      );

      dispatch(
        addToast({
          message: "Filter updated successfully",
          type: "success",
        })
      );
      return true;
    } catch (error) {
      console.error("Failed to update filter:", error);
      dispatch(
        addToast({
          message: error.response?.data?.message || "Failed to update filter",
          type: "error",
        })
      );
      return false;
    }
  };

  // Delete filter
  const handleDeleteFilter = async (filterId) => {
    if (!confirm("Are you sure you want to delete this filter?")) return;

    try {
      await API.delete(`/api/dashboards/${dashboardId}/filters/${filterId}`);
      onFiltersChange(filters.filter((f) => f.id !== filterId));

      // Remove filter value
      const newFilterValues = { ...filterValues };
      const deletedFilter = filters.find((f) => f.id === filterId);
      if (deletedFilter) {
        delete newFilterValues[deletedFilter.name];
        onFilterValuesChange(newFilterValues);
      }

      dispatch(
        addToast({
          message: "Filter deleted successfully",
          type: "success",
        })
      );
    } catch (error) {
      console.error("Failed to delete filter:", error);
      dispatch(
        addToast({
          message: error.response?.data?.message || "Failed to delete filter",
          type: "error",
        })
      );
    }
  };

  // Copy SQL template to clipboard
  const handleCopyTemplate = (filter) => {
    const template = generateSQLTemplate(filter);
    navigator.clipboard
      .writeText(template)
      .then(() => {
        dispatch(
          addToast({
            message: `SQL template copied: ${template}`,
            type: "success",
          })
        );
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        dispatch(
          addToast({
            message: "Failed to copy template",
            type: "error",
          })
        );
      });
  };

  // Form submit handler
  const handleFormSubmit = async (formData) => {
    let success = false;
    if (editingFilter) {
      success = await handleUpdateFilter(formData);
    } else {
      success = await handleAddFilter(formData);
    }

    if (success) {
      setEditingFilter(null);
    }
    return success;
  };

  return {
    // State
    localFilterValues,
    showFilterModal,
    editingFilter,

    // Filter value handlers
    handleFilterValueChange,
    handleApplyFilters,
    handleClearFilters,

    // Filter CRUD handlers
    handleFormSubmit,
    handleDeleteFilter,
    handleCopyTemplate,

    // UI state setters
    setShowFilterModal,
    setEditingFilter,
  };
}
