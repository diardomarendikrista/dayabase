import QueryEditorForm from "./Components/QueryEditorForm";
import { useQuestionEditor } from "./Components/useQuestionEditor";
import VisualizationPanel from "./Components/VisualizationPanel";
import HeaderSection from "./Components/HeaderSection";

export default function QuestionEditorPage() {
  const {
    id,
    dataQuestion,
    pageTitle,
    setPageTitle,
    sql,
    setSql,
    connections,
    selectedConnectionId,
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
    handleConnectionChange,
    handleSaveQuestion,
  } = useQuestionEditor();

  if (errors.status === 404) {
    return <div>Question not found</div>;
  }

  return (
    <div>
      <HeaderSection
        id={id}
        dataQuestion={dataQuestion}
        isLoading={isLoading}
        errors={errors}
        setErrors={setErrors}
        pageTitle={pageTitle}
        setPageTitle={setPageTitle}
        handleRunQuery={handleRunQuery}
        handleSaveQuestion={handleSaveQuestion}
      />
      <QueryEditorForm
        connections={connections}
        selectedConnectionId={selectedConnectionId}
        onConnectionChange={handleConnectionChange}
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
