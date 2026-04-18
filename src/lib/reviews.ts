const STORAGE_KEY = "barbeflow_reviews";

export interface Review {
  id: string;
  barbershopId: number;
  authorName: string;
  rating: number;
  comment: string;
  photoUrl?: string;
  barberReply?: string;
  barberReplyAt?: string;
  createdAt: string;
}

function loadReviews(): Review[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((item) => ({
          id: String(item?.id ?? ""),
          barbershopId: Number(item?.barbershopId ?? 0),
          authorName: String(item?.authorName ?? "Cliente"),
          rating: Math.max(1, Math.min(5, Number(item?.rating ?? 5))),
          comment: String(item?.comment ?? ""),
          photoUrl: typeof item?.photoUrl === "string" ? item.photoUrl : undefined,
          barberReply: typeof item?.barberReply === "string" ? item.barberReply : undefined,
          barberReplyAt: typeof item?.barberReplyAt === "string" ? item.barberReplyAt : undefined,
          createdAt: String(item?.createdAt ?? new Date().toISOString()),
        }))
      : [];
  } catch {
    return [];
  }
}

function saveReviews(reviews: Review[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

export function getReviews(barbershopId: number): Review[] {
  return loadReviews()
    .filter((r) => r.barbershopId === barbershopId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addReview(
  barbershopId: number,
  authorName: string,
  rating: number,
  comment: string,
  options?: { photoUrl?: string }
): Review {
  const reviews = loadReviews();
  const newReview: Review = {
    id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    barbershopId,
    authorName,
    rating: Math.max(1, Math.min(5, rating)),
    comment: comment.trim(),
    photoUrl: options?.photoUrl?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  reviews.push(newReview);
  saveReviews(reviews);
  return newReview;
}

export function getAverageRating(barbershopId: number): { average: number; count: number } {
  const reviews = getReviews(barbershopId);
  if (reviews.length === 0) return { average: 0, count: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return { average: sum / reviews.length, count: reviews.length };
}

export function getReviewCountByAuthor(authorName: string): number {
  const normalized = authorName.trim().toLowerCase();
  if (!normalized) return 0;
  return loadReviews().filter((r) => r.authorName.trim().toLowerCase() === normalized).length;
}

export function replyToReview(reviewId: string, reply: string): Review | null {
  const reviews = loadReviews();
  const idx = reviews.findIndex((item) => item.id === reviewId);
  if (idx < 0) return null;
  reviews[idx] = {
    ...reviews[idx],
    barberReply: reply.trim(),
    barberReplyAt: new Date().toISOString(),
  };
  saveReviews(reviews);
  return reviews[idx];
}
