import QueryEditorForm from "./Components/QueryEditorForm";
import { useQuestionEditor } from "./Components/useQuestionEditor";
import VisualizationPanel from "./Components/VisualizationPanel";

export default function QuestionEditorPage() {
  const {
    id,
    pageTitle,
    setPageTitle,
    sql,
    setSql,
    connections,
    selectedConnectionId,
    setSelectedConnectionId,
    results,
    columns,
    isLoading,
    error,
    chartType,
    setChartType,
    chartConfig,
    setChartConfig,
    transformedData,
    handleRunQuery,
    handleSaveQuestion,
  } = useQuestionEditor();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <input
          type="text"
          value={pageTitle}
          onChange={(e) => setPageTitle(e.target.value)}
          placeholder="Enter question name"
          className="text-3xl font-bold bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-200 rounded-md p-1 -m-1 w-1/2"
        />
        <div>
          <button
            onClick={handleSaveQuestion}
            className="px-5 py-2 mr-4 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700"
          >
            {id ? "Update Question" : "Save Question"}
          </button>
          <button
            onClick={handleRunQuery}
            disabled={isLoading}
            className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {isLoading ? "Running..." : "Run Query"}
          </button>
        </div>
      </div>

      <QueryEditorForm
        connections={connections}
        selectedConnectionId={selectedConnectionId}
        onConnectionChange={(e) => setSelectedConnectionId(e.target.value)}
        sql={sql}
        onSqlChange={(e) => setSql(e.target.value)}
      />

      <VisualizationPanel
        error={error}
        isLoading={isLoading}
        results={results}
        columns={columns}
        chartType={chartType}
        onChartTypeChange={setChartType}
        chartConfig={chartConfig}
        onChartConfigChange={(e) =>
          setChartConfig((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
          }))
        }
        transformedData={transformedData}
      />
    </div>
  );
}
