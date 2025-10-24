import Button from "components/atoms/Button";
import { cn } from "lib/utils";

export default function Error500Page() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white text-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <h1 className="text-9xl font-extrabold text-primary">500</h1>

        <h2 className="mt-4 text-4xl font-bold tracking-tight text-gray-700 sm:text-5xl">
          Server Error
        </h2>

        <p className="mt-6 text-lg leading-7 text-gray-600">
          Sorry, something went wrong on our end. We are aware of the problem
          and are working to fix it. Please try again later.
        </p>

        <div className="mt-10">
          <Button
            onClick={() => window.location.reload()}
            className={cn(
              "rounded-md bg-primary px-5 py-3 text-lg font-semibold text-white shadow-sm",
              "hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors duration-200"
            )}
          >
            Try to Reload
          </Button>
        </div>
      </div>
    </main>
  );
}
