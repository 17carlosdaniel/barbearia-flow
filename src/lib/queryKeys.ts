export const qk = {
  clientAppointments: (clientId?: string) => ["clientAppointments", clientId ?? "anon"] as const,
  barbershopDetail: (shopId?: number) => ["barbershopDetail", shopId ?? -1] as const,
  barbershopReviews: (shopId?: number) => ["barbershopReviews", shopId ?? -1] as const,
  clientSearchShops: (reviewVersion: number, geoKey: string) =>
    ["clientSearchShops", reviewVersion, geoKey] as const,
};

