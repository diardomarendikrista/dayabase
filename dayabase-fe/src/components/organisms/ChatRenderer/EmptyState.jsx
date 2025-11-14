export default function EmptyState({ message }) {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}
