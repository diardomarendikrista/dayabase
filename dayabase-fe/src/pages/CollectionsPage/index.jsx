import { API } from "axios/axios";
import { useEffect, useState } from "react";
import {
  RiAddLine,
  RiDashboardLine,
  RiFolderLine,
  RiQuestionLine,
} from "react-icons/ri";
import { Link, useParams } from "react-router-dom";
import ConfirmationModal from "components/molecules/ConfirmationModal";
import PromptModal from "components/molecules/PromptModal";

export default function CollectionPage() {
  const { id } = useParams();
  const [collection, setCollection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const getItemLink = (item) => {
    switch (item.type) {
      case "dashboard":
        return `/dashboards/${item.id}?collectionId=${id}`;
      case "question":
        return `/questions/${item.id}?collectionId=${id}`;
      case "collection":
        return `/collections/${item.id}`;
      default:
        return "#";
    }
  };

  const getItemIcon = (item) => {
    switch (item.type) {
      case "dashboard":
        return <RiDashboardLine className="h-5 w-5 text-blue-500" />;
      case "question":
        return <RiQuestionLine className="h-5 w-5 text-green-500" />;
      case "collection":
        return <RiFolderLine className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    // try {
    //   await API.delete(`/api/dashboards/${itemToDelete.id}`);
    //   setDashboards((prev) => prev.filter((d) => d.id !== itemToDelete.id));
    //   dispatch(
    //     addToast({
    //       message: "Dashboard deleted successfully.",
    //       type: "success",
    //     })
    //   );
    // } catch (err) {
    //   dispatch(
    //     addToast({ message: "Failed to delete dashboard.", type: "error" })
    //   );
    // }
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
              <li
                key={`${item.type}-${item.id}`}
                className="py-4 flex justify-between items-center"
              >
                <Link
                  to={getItemLink(item)}
                  className="flex items-center gap-4 group"
                >
                  {getItemIcon(item)}
                  <div>
                    <p className="font-bold text-lg text-gray-800 group-hover:text-indigo-600 transition-colors">
                      {item.name}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">
                      {item.type}
                    </p>
                  </div>
                </Link>
                {/* Di sini Anda bisa menambahkan tombol aksi seperti Move, Edit, Delete */}
              </li>
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
        message={`Are you sure you want to delete the dashboard "${itemToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
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
    </div>
  );
}
