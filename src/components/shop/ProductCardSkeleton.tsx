const ProductCardSkeleton = () => {
  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-border/60 animate-pulse">
      <div className="aspect-square bg-secondary/60" />
      <div className="p-4 space-y-2">
        <div className="h-4 rounded bg-secondary/70 w-3/4" />
        <div className="h-3 rounded bg-secondary/60 w-1/2" />
        <div className="h-3 rounded bg-secondary/60 w-full" />
        <div className="h-3 rounded bg-secondary/60 w-2/3" />
        <div className="h-5 rounded bg-secondary/70 w-1/3" />
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
