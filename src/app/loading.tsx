export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <p className="text-xl font-medium text-gray-600 dark:text-gray-300">
          Loading BatuOS...
        </p>
      </div>
    </div>
  );
}
