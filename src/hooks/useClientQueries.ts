import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { mockBarbershops, getBarbershopById } from "@/lib/mockBarbershops";
import { getBarbershopProfile } from "@/lib/barbershopProfile";
import { getAverageRating, getReviews, addReview } from "@/lib/reviews";
import {
  getAppointmentsForClient,
  cancelAppointmentByClient,
  rescheduleAppointment,
  markAppointmentReviewed,
  type AppointmentRecord,
} from "@/lib/appointments";
import { getOpeningStatus } from "@/lib/openingHours";
import { getBarberCatalog } from "@/lib/barberCatalog";

export function useClientAppointmentsQuery(userId?: string, userName?: string) {
  return useQuery({
    queryKey: qk.clientAppointments(userId),
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => getAppointmentsForClient(userId ?? "", userName),
  });
}

export function useClientAppointmentMutations(userId?: string, userName?: string) {
  const queryClient = useQueryClient();
  const key = qk.clientAppointments(userId);
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: key });
  };

  const cancel = useMutation({
    mutationFn: async (appointmentId: number) => cancelAppointmentByClient(userId ?? "", appointmentId),
    onSuccess: invalidate,
  });

  const reschedule = useMutation({
    mutationFn: async ({ appointmentId, date, time }: { appointmentId: number; date: string; time: string }) =>
      rescheduleAppointment(userId ?? "", appointmentId, date, time),
    onSuccess: invalidate,
  });

  const markReviewed = useMutation({
    mutationFn: async (appointmentId: number) => markAppointmentReviewed(userId ?? "", appointmentId),
    onSuccess: invalidate,
  });

  return useMemo(() => ({ cancel, reschedule, markReviewed }), [cancel, reschedule, markReviewed]);
}

export function useBarbershopDetailQuery(shopId?: number) {
  return useQuery({
    queryKey: qk.barbershopDetail(shopId),
    enabled: Boolean(shopId),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      const id = shopId ?? -1;
      const shop = getBarbershopById(id);
      if (!shop) return null;
      const profile = getBarbershopProfile(id);
      const catalog = getBarberCatalog(id);
      const openingStatus = getOpeningStatus(id);
      return { shop, profile, catalog, openingStatus };
    },
  });
}

export function useBarbershopReviewsQuery(shopId?: number) {
  return useQuery({
    queryKey: qk.barbershopReviews(shopId),
    enabled: Boolean(shopId),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async () => (shopId ? getReviews(shopId) : []),
  });
}

export function useCreateReviewMutation(shopId?: number, author?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ rating, comment, photoUrl }: { rating: number; comment: string; photoUrl?: string }) =>
      addReview(shopId ?? -1, author ?? "Cliente", rating, comment, { photoUrl }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.barbershopReviews(shopId) });
      await queryClient.invalidateQueries({ queryKey: qk.barbershopDetail(shopId) });
    },
  });
}

type Coords = { lat: number; lon: number } | null;

function distanceKm(from: { lat: number; lon: number }, to: { lat: number; lon: number }): number {
  const r = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLon = ((to.lon - from.lon) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return r * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  "sao paulo": { lat: -23.5505, lon: -46.6333 },
  "rio de janeiro": { lat: -22.9068, lon: -43.1729 },
  "belo horizonte": { lat: -19.9167, lon: -43.9345 },
  salvador: { lat: -12.9714, lon: -38.5014 },
};

function resolveCoords(locationLabel: string, cidade?: string) {
  const cityKey = (cidade ?? locationLabel).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (cityKey.includes(city)) return coords;
  }
  return null;
}

export function useClientSearchShopsQuery(reviewVersion: number, userCoords: Coords) {
  const geoKey = userCoords ? `${userCoords.lat.toFixed(2)}:${userCoords.lon.toFixed(2)}` : "nogeo";
  return useQuery({
    queryKey: qk.clientSearchShops(reviewVersion, geoKey),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () =>
      mockBarbershops.map((shop) => {
        const profile = getBarbershopProfile(shop.id);
        const rating = getAverageRating(shop.id);
        const status = getOpeningStatus(shop.id).status;
        const precoNumero = Number(profile.precoMedio?.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
        const temPromocao = (profile.promocoes?.length ?? 0) > 0;
        const catalog = getBarberCatalog(shop.id);
        const servicesCatalog = catalog.services.map((s) =>
          s.name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase(),
        );
        const coords = resolveCoords(shop.location, profile.cidade);
        const distance = userCoords && coords ? distanceKm(userCoords, coords) : null;
        return {
          shop,
          profile,
          rating: rating.count > 0 ? rating.average : shop.rating,
          status,
          precoNumero: Number.isFinite(precoNumero) && precoNumero > 0 ? precoNumero : null,
          temPromocao,
          servicesCatalog,
          distance,
        };
      }),
  });
}

export type ClientAppointment = AppointmentRecord;

