import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

const StarRating = ({ rating, size = 16, interactive = false, onChange }: StarRatingProps) => {
  const rounded = Math.round(rating);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={`transition-colors ${
            star <= rounded
              ? "text-primary fill-primary"
              : "text-muted-foreground/30 fill-transparent"
          } ${interactive ? "cursor-pointer hover:text-primary" : ""}`}
          onClick={() => interactive && onChange?.(star)}
        />
      ))}
      {!interactive && (
        <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
      )}
    </div>
  );
};

export default StarRating;

