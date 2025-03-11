
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

const LoadingSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-8 w-48" />
    <Card className="p-4">
      <Skeleton className="h-6 w-24 mb-4" />
      <div className="space-y-2">
        {[...Array(10)].map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    </Card>
  </div>
);

export default LoadingSkeleton;
