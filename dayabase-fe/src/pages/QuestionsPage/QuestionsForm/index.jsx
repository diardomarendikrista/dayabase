import QueryEditorForm from "./Components/QueryEditorForm";
import { useQuestionEditor } from "./Components/useQuestionEditor";
import VisualizationPanel from "./Components/VisualizationPanel";
import Input from "components/atoms/Input";

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
    errors,
    setErrors,
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
        <div className="w-1/2  -m-1">
          <Input
            type="text"
            value={pageTitle}
            onChange={(e) => {
              setPageTitle(e.target.value);
              if (errors.pageTitle) {
                const newErrors = { ...errors };
                delete newErrors.pageTitle;
                setErrors(newErrors);
              }
            }}
            placeholder="Enter question name"
            className="text-3xl font-bold bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-200 rounded-md p-1 border-none"
            error={!!errors.pageTitle} // Kirim status error ke komponen Input
          />
          {errors.pageTitle && (
            <p className="text-red-600 text-sm mt-1">{errors.pageTitle}</p>
          )}
        </div>
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
        onConnectionChange={(e) => {
          setSelectedConnectionId(e.target.value);
          if (errors.selectedConnectionId) {
            const newErrors = { ...errors };
            delete newErrors.selectedConnectionId;
            setErrors(newErrors);
          }
        }}
        sql={sql}
        onSqlChange={(e) => setSql(e.target.value)}
        error={errors.selectedConnectionId}
      />

      <VisualizationPanel
        error={errors.api}
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
