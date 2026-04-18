import { Skeleton } from "@/components/ui/skeleton";

const ClientHomeSkeleton = () => {
  return (
    <div className="space-y-6">
      <Skeleton className="h-52 rounded-2xl" />
      <div className="glass-card rounded-xl p-4 space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-64" />
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="glass-card rounded-xl p-4">
            <Skeleton className="h-8 w-8 mx-auto mb-2" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-52" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton key={idx} className="h-44 w-60 rounded-xl shrink-0" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientHomeSkeleton;
