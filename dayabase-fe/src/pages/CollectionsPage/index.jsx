import { API } from "axios/axios";
import { useEffect, useState } from "react";
import { RiAddLine } from "react-icons/ri";
import { Link, useNavigate, useParams } from "react-router-dom";
import ConfirmationModal from "components/molecules/ConfirmationModal";
import PromptModal from "components/molecules/PromptModal";
import CollectionItem from "./CollectionItem";
import { addToast } from "store/slices/toastSlice";
import { useDispatch } from "react-redux";
import ModalAddToDashboard from "./ModalAddToDashboard";

export default function CollectionPage() {
  const [collection, setCollection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddToDashboardModal, setShowAddToDashboardModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const fetchCollectionData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await API.get(`/api/collections/${id}`);
      setCollection(response.data);
    } catch (err) {
      setError("Failed to fetch collection data.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleAddToDashboardClick = (item) => {
    setSelectedItem(item);
    setShowAddToDashboardModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;
    try {
      await API.delete(`/api/${selectedItem.type}s/${selectedItem.id}`);
      dispatch(
        addToast({
          message: `${selectedItem.type} deleted successfully.`,
          type: "success",
        })
      );
      // Refresh data koleksi setelah delete
      fetchCollectionData();
    } catch (err) {
      dispatch(
        addToast({
          message: `Failed to delete ${selectedItem.type}.`,
          type: "error",
        })
      );
    }
  };

  const handleCreateDashboard = async (name) => {
    if (name) {
      try {
        const response = await API.post("/api/dashboards", {
          name,
          collection_id: id,
        });
        navigate(`/dashboards/${response.data.id}`);
      } catch (error) {
        dispatch(
          addToast({ message: "Failed to create dashboard", type: "error" })
        );
      }
    }
  };

  useEffect(() => {
    fetchCollectionData();
  }, [id]);

  if (isLoading) {
    return <div className="text-center p-8">Loading collection...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  if (!collection) {
    return <div className="text-center p-8">Collection not found.</div>;
  }

  return (
    <div>
      {/* Header Halaman */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{collection.name}</h1>
          <p className="text-gray-500 mt-1">
            {collection.description || "No description for this collection."}
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            to={`/questions/new?collectionId=${id}`}
            className="px-4 py-2 bg-green-600 text-white font-semibold
            rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            <RiAddLine /> New Question
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <RiAddLine /> New Dashboard
          </button>
        </div>
      </div>
      {/* Daftar Item dalam Koleksi */}
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <ul className="divide-y divide-gray-200">
          {collection.items && collection.items.length > 0 ? (
            collection.items.map((item) => (
              <CollectionItem
                key={`${item.type}-${item.id}`}
                item={item}
                collectionId={id}
                onDeleteClick={handleDeleteClick}
                onAddToDashboardClick={handleAddToDashboardClick}
              />
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">
              This collection is empty.
            </p>
          )}
        </ul>
      </div>

      <ConfirmationModal
        showModal={showDeleteModal}
        setShowModal={setShowDeleteModal}
        title="Delete Dashboard"
        message={`Are you sure you want to delete the dashboard "${selectedItem?.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        confirmText="Yes, Delete"
        isDestructive={true}
      />

      <PromptModal
        showModal={showCreateModal}
        setShowModal={setShowCreateModal}
        title="Create New Dashboard"
        message="Enter a name for your new dashboard:"
        onConfirm={handleCreateDashboard}
        closeOnOverlayClick={false}
        inputPlaceholder="Dashboard Name"
      />

      <ModalAddToDashboard
        showModal={showAddToDashboardModal}
        setShowModal={setShowAddToDashboardModal}
        questionId={selectedItem?.id}
        collectionId={id}
      />
    </div>
  );
}
