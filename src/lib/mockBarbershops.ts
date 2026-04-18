export interface Barbershop {
  id: number;
  name: string;
  location: string;
  rating: number;
  services: number;
  pixChave: string;
  pixChaveTipo?: string;
}

export const mockBarbershops: Barbershop[] = [
  { id: 1, name: "Barbearia Premium", location: "São Paulo, SP", rating: 4.8, services: 5, pixChave: "barbearia.premium@email.com", pixChaveTipo: "email" },
  { id: 2, name: "Classic Barber", location: "São Paulo, SP", rating: 4.6, services: 3, pixChave: "11999998888", pixChaveTipo: "telefone" },
  { id: 3, name: "King's Cut", location: "Rio de Janeiro, RJ", rating: 4.9, services: 7, pixChave: "123.456.789-00", pixChaveTipo: "cpf" },
  { id: 4, name: "Barber & Style", location: "Belo Horizonte, MG", rating: 4.5, services: 4, pixChave: "contato@barberstyle.com.br", pixChaveTipo: "email" },
];

export function getBarbershopById(id: number): Barbershop | undefined {
  return mockBarbershops.find((b) => b.id === id);
}
