export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}
