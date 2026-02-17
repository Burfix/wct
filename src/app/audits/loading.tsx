export default function Loading() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
      </div>

      {/* Audit form skeleton */}
      <div className="bg-white rounded-lg shadow p-6 max-w-4xl mx-auto">
        <div className="space-y-8">
          {[1, 2, 3].map((section) => (
            <div key={section} className="border-b pb-6">
              <div className="h-6 bg-gray-200 rounded w-48 animate-pulse mb-4"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((question) => (
                  <div key={question} className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                    <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
