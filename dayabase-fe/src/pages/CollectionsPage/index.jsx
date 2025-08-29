import { API } from "axios/axios";
import { useEffect, useState } from "react";
import { RiAddLine, RiDeleteBinLine, RiPencilLine } from "react-icons/ri";
import { Link, useNavigate, useParams } from "react-router-dom";
import ConfirmationModal from "components/molecules/ConfirmationModal";
import ModalAddDashboard from "components/molecules/ModalAddDashboard";
import CollectionItem from "./CollectionItem";
import { addToast } from "store/slices/toastSlice";
import { useDispatch } from "react-redux";
import ModalAddToDashboard from "./ModalAddToDashboard";
import { deleteCollection } from "store/slices/collectionsSlice";
import ModalEditCollection from "./ModalEditCollection";
import Button from "components/atoms/Button";

export default function CollectionPage() {
  const [collection, setCollection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedItem, setSelectedItem] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddToDashboardModal, setShowAddToDashboardModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const fetchCollectionData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await API.get(`/api/collections/${id}`);
      const newData = { type: "collection", ...response.data };
      setCollection(newData);
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

  const handleCollectionUpdated = (updatedCollection) => {
    setCollection((prevCollection) => ({
      ...prevCollection,
      ...updatedCollection,
    }));
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;
    try {
      // ada 3 tipe yang bisa di hapus di halaman ini
      switch (selectedItem.type) {
        case "collection":
          await dispatch(deleteCollection(selectedItem.id)).unwrap();
          break;
        case "dashboard":
          await API.delete(`/api/dashboards/${selectedItem.id}`);
          break;
        case "question":
          await API.delete(`/api/questions/${selectedItem.id}`);
          break;
        default:
          throw new Error("Invalid item type to delete");
      }

      dispatch(
        addToast({
          message: `${selectedItem.type} '${selectedItem.name}' deleted successfully.`,
          type: "success",
        })
      );

      if (
        selectedItem.type === "collection" &&
        selectedItem.id.toString() === id
      ) {
        navigate("/");
      } else {
        fetchCollectionData(); // Muat ulang item di dalam koleksi
      }
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

  const getDeleteModalMessage = () => {
    if (!selectedItem) return "";

    const baseMessage = `Are you sure you want to delete the ${selectedItem.type} "${selectedItem.name}"?`;

    if (selectedItem.type === "collection") {
      return (
        <span>
          {baseMessage} <br />
          <strong className="text-red-700">
            All questions and dashboards within this collection will also be
            permanently deleted.
          </strong>
        </span>
      );
    }

    return baseMessage;
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
      <div className="flex justify-between items-start mb-6 gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1
              className="text-3xl font-bold truncate"
              title={collection.name}
            >
              {collection.name}
            </h1>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowEditModal(true)}
            >
              <RiPencilLine />
            </Button>
          </div>
          <p
            className="text-gray-500 mt-1 truncate"
            title={collection.description || ""}
          >
            {collection.description || "No description for this collection."}
          </p>
        </div>

        {/* Grup Kanan: Tombol Aksi */}
        <div className="flex gap-2 flex-shrink-0">
          <Link to={`/questions/new?collectionId=${id}`}>
            <Button
              variant="success"
              size="sm"
            >
              <RiAddLine className="mr-2 h-4 w-4" /> New Question
            </Button>
          </Link>
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="info"
            size="sm"
          >
            <RiAddLine className="mr-2 h-4 w-4" /> New Dashboard
          </Button>
          <Button
            onClick={() => handleDeleteClick(collection)}
            variant="danger"
            size="icon"
          >
            <RiDeleteBinLine />
          </Button>
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
        title={`Delete ${selectedItem?.type}`}
        customMessage={getDeleteModalMessage()}
        onConfirm={handleConfirmDelete}
        confirmText="Yes, Delete"
        isDanger={true}
      />

      <ModalAddDashboard
        showModal={showCreateModal}
        setShowModal={setShowCreateModal}
        onConfirm={handleCreateDashboard}
      />

      <ModalEditCollection
        showModal={showEditModal}
        setShowModal={setShowEditModal}
        collection={collection}
        onCollectionUpdated={handleCollectionUpdated}
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
