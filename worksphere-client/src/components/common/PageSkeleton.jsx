import React from 'react';
import { Skeleton } from '../ui/skeleton';

export default function PageSkeleton() {
  return (
    <div className="flex flex-col h-full w-full bg-gray-50 p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex flex-col space-y-2 mb-4">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-4 w-[350px]" />
      </div>

      {/* Stats Row Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
        <Skeleton className="h-6 w-[200px] mb-6" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
