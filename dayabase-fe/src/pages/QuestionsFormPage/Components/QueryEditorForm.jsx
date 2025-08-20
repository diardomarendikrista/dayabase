export default function QueryEditorForm({
  connections,
  selectedConnectionId,
  onConnectionChange,
  sql,
  onSqlChange,
  error,
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Database Connection
        </label>
        <select
          value={selectedConnectionId}
          onChange={onConnectionChange}
          className={`w-full md:w-1/2 rounded-md border-gray-300 shadow-sm transition duration-150 ${error ? "border-red-500 ring-red-500 border-1" : "focus:border-indigo-500 focus:ring-indigo-500"}`}
        >
          <option
            value=""
            disabled
          >
            Select a connection
          </option>
          {connections.map((conn) => (
            <option
              key={conn.id}
              value={conn.id}
            >
              {conn.connection_name}
            </option>
          ))}
        </select>
        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      </div>
      <h2 className="text-xl font-semibold mb-2">SQL Query</h2>
      <textarea
        value={sql}
        onChange={onSqlChange}
        className="w-full h-40 p-2 border rounded-md font-mono text-sm"
      />
    </div>
  );
}
