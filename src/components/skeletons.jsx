// ── Composants Skeleton de chargement ──

function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
}

// Skeleton pour une ligne de tableau
export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr className="border-b border-gray-50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-3">
          <Skeleton className={`h-4 ${i === 0 ? 'w-3/4' : i === cols - 1 ? 'w-8' : 'w-1/2'}`} />
        </td>
      ))}
    </tr>
  );
}

// Skeleton pour un tableau complet
export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header factice */}
      <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-3">
        <div className="flex gap-8">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-20" />
          ))}
        </div>
      </div>
      {/* Rows */}
      <table className="w-full">
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Skeleton pour une carte KPI
export function KpiSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-32 mt-3" />
    </div>
  );
}

// Skeleton pour une fiche détail
export function DetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="lg:col-span-2">
        <TableSkeleton rows={4} cols={5} />
      </div>
    </div>
  );
}

// Skeleton pour un formulaire
export function FormSkeleton() {
  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <Skeleton className="h-5 w-40 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-28 mb-1.5" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-24 mb-1.5" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Spinner simple
export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-4',
    lg: 'h-12 w-12 border-4',
  };
  return (
    <div className={`animate-spin rounded-full border-cobilan-600 border-t-transparent ${sizes[size]} ${className}`} />
  );
}

// Page de chargement centrée avec logo
export function PageLoader({ message = 'Chargement…' }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <img src="/logo.png" alt="Chargement" className="h-20 w-auto animate-pulse" />
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

export default Skeleton;
