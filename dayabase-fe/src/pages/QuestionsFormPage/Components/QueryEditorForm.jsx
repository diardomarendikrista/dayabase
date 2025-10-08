import Select from "components/atoms/Select";
import { useMemo } from "react";

export default function QueryEditorForm({
  connections,
  selectedConnectionId,
  onConnectionChange,
  sql,
  onSqlChange,
  error,
}) {
  const connectionOptions = useMemo(() => {
    return connections.map((conn) => ({
      value: conn.id,
      label: conn.connection_name,
    }));
  }, [connections]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Database Connection
        </label>
        <form
          autoComplete="off"
          onSubmit={(e) => e.preventDefault()}
        >
          <Select
            options={connectionOptions}
            value={selectedConnectionId}
            onChange={onConnectionChange}
            placeholder="Select a connection"
          />
        </form>
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
