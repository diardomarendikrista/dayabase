export default function QueryEditorForm({
  connections,
  selectedConnectionId,
  onConnectionChange,
  sql,
  onSqlChange,
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
          className="w-full md:w-1/2 rounded-md border-gray-300"
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
