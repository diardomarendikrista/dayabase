import { cn } from "lib/utils";
import Input from "components/atoms/Input";
import Button from "components/atoms/Button";
import BackButton from "components/molecules/BackButton";
import { useLocation } from "react-router-dom";

export default function HeaderSection({
  id,
  dataQuestion,
  errors,
  setErrors,
  isLoading,
  pageTitle,
  setPageTitle,
  handleRunQuery,
  handleSaveQuestion,
}) {
  // get collection Id
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const collectionId = queryParams.get("collectionId");

  return (
    <div className="flex justify-between items-center mb-6 gap-2">
      <div className="flex px-2">
        <BackButton
          to={`/collections/${dataQuestion.collection_id || collectionId}`}
          title={`Back to ${dataQuestion.collection_name || collectionId}`}
        />
      </div>
      <div className="flex-1 w-1/2  -m-1 mr-2">
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
        <Button
          onClick={handleSaveQuestion}
          type="button"
        >
          {id ? "Update Question" : "Save Question"}
        </Button>
        <Button
          variant="success"
          onClick={handleRunQuery}
          disabled={isLoading}
          type="button"
        >
          {isLoading ? "Running..." : "Run Query"}
        </Button>
      </div>
    </div>
  );
}
