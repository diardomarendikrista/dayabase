import { cn } from "lib/utils";
import QueryEditorForm from "./Components/QueryEditorForm";
import { useQuestionEditor } from "./Components/useQuestionEditor";
import VisualizationPanel from "./Components/VisualizationPanel";
import Input from "components/atoms/Input";
import Button from "components/atoms/Button";

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
          <form
            autoComplete="off"
            onSubmit={(e) => e.preventDefault()}
          >
            <Input
              name="question-title"
              id="question-title-input"
              value={pageTitle}
              onChange={(e) => {
                setPageTitle(e.target.value);
                if (errors.pageTitle) {
                  const newErrors = { ...errors };
                  delete newErrors.pageTitle;
                  setErrors(newErrors);
                }
              }}
              placeholder="Enter question title"
              className={cn(
                "text-3xl font-bold bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-200 rounded-md p-1",
                { "border-none": !errors.pageTitle }
              )}
              error={!!errors.pageTitle}
            />
          </form>
          {errors.pageTitle && (
            <p className="text-red-600 text-sm mt-1">{errors.pageTitle}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={handleSaveQuestion}>
            {id ? "Update Question" : "Save Question"}
          </Button>
          <Button
            variant="success"
            onClick={handleRunQuery}
            disabled={isLoading}
          >
            {isLoading ? "Running..." : "Run Query"}
          </Button>
        </div>
      </div>

      <QueryEditorForm
        connections={connections}
        selectedConnectionId={selectedConnectionId}
        onConnectionChange={(value) => {
          setSelectedConnectionId(value);
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
        onChartConfigChange={setChartConfig}
        transformedData={transformedData}
      />
    </div>
  );
}
