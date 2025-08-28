import {
  RiAddBoxLine,
  RiDashboardLine,
  RiDeleteBinLine,
  RiFolderLine,
  RiQuestionLine,
} from "react-icons/ri";
import { Link } from "react-router-dom";

export default function CollectionItem({
  item,
  collectionId,
  onDeleteClick,
  onAddToDashboardClick,
}) {
  const getItemIcon = (item) => {
    switch (item.type) {
      case "dashboard":
        return <RiDashboardLine className="h-6 w-6 text-blue-500" />;
      case "question":
        return <RiQuestionLine className="h-6 w-6 text-green-500" />;
      case "collection":
        return <RiFolderLine className="h-6 w-6 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getItemLink = (item) => {
    switch (item.type) {
      case "dashboard":
        return `/dashboards/${item.id}`;
      case "question":
        return `/questions/${item.id}?collectionId=${collectionId}`;
      case "collection":
        return `/collections/${item.id}`;
      default:
        return "#";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <li className="py-4 flex justify-between items-center group">
      <Link
        to={getItemLink(item)}
        className="flex items-center gap-4 flex-1"
      >
        {getItemIcon(item)}
        <div className="flex-1">
          <p className="font-bold text-lg text-gray-800 group-hover:text-indigo-600 transition-colors">
            {item.name}
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="capitalize">{item.type}</span>
            {item.updated_at && (
              <>
                <span>•</span>
                <span>
                  Last edited {formatDate(item.updated_at)}
                  {item.updated_by_user && ` by ${item.updated_by_user}`}
                </span>
              </>
            )}
          </div>
        </div>
      </Link>
      <div className="flex items-center gap-2">
        {item.type === "question" && (
          <button
            onClick={() => onAddToDashboardClick(item)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"
            title="Add to dashboard"
          >
            <RiAddBoxLine />
          </button>
        )}
        <button
          onClick={() => onDeleteClick(item)}
          className="p-2 text-red-500 hover:bg-red-200 hover:text-red-600 rounded-md"
          title="Delete"
        >
          <RiDeleteBinLine />
        </button>
      </div>
    </li>
  );
}
