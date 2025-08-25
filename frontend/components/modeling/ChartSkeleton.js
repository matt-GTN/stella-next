"use client";

export default function ChartSkeleton({ className = "w-full h-64", title }) {
  return (
    <div className={`${className} bg-white/5 rounded-lg border border-white/10 p-4`}>
      {title && (
        <div className="mb-4">
          <div className="h-4 bg-white/10 rounded animate-pulse w-1/3"></div>
        </div>
      )}
      
      <div className="space-y-3">
        {/* Chart area skeleton */}
        <div className="h-48 bg-white/10 rounded animate-pulse"></div>
        
        {/* Legend skeleton */}
        <div className="flex justify-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-white/10 rounded animate-pulse"></div>
            <div className="h-3 bg-white/10 rounded animate-pulse w-16"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-white/10 rounded animate-pulse"></div>
            <div className="h-3 bg-white/10 rounded animate-pulse w-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
}