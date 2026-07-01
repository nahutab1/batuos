"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <div className="mx-auto max-w-md rounded-2xl glass p-8">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-2xl text-rose-400">
            ⚠
          </div>
        </div>
        <h1 className="mb-2 text-xl font-bold text-white">
          BatuOS encountered an error
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          {error.message || "Something went wrong."}
        </p>
        <div className="flex justify-center gap-4">
          <button onClick={reset} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors active:scale-[0.97]">
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
