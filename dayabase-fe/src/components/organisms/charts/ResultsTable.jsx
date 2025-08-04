export default function ResultsTable({ columns, data }) {
  if (data.length === 0) {
    return (
      <p className="text-center text-gray-500 mt-8">
        Run a query to see the results here.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 mt-6">
      <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-900"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col) => (
                <td
                  key={`${rowIndex}-${col}`}
                  className="whitespace-nowrap px-4 py-2 text-gray-700"
                >
                  {/* Mengubah nilai null/boolean menjadi string agar bisa dirender */}
                  {String(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
