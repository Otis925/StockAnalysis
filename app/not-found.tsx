export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <p className="text-7xl font-bold mb-4" style={{ color: '#EBEBEB' }}>404</p>
      <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Page not found</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <a href="/" className="btn-green px-6 py-2.5 text-sm font-semibold">
        Back to search
      </a>
    </div>
  );
}
