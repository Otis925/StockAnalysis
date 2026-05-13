export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-6xl font-bold text-gray-200 dark:text-gray-800 mb-4">404</div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Page not found</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
      <a
        href="/"
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
      >
        Back to search
      </a>
    </div>
  );
}
