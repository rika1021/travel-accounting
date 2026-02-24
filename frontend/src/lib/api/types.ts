export interface TripDto {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  baseCurrency: string;
  createdAt: string;
}

export interface ExpenseDto {
  id: string;
  tripId: string;
  amount: number;
  currency: string;
  category: string;
  spentAt: string; // YYYY-MM-DD
  payer: string;
  note: string | null;
  createdAt: string;
}

export interface CreateTripRequest {
  title: string;
  startDate: string;
  endDate: string;
  baseCurrency: string;
}

export interface CreateExpenseRequest {
  amount: number;
  currency: string;
  category: string;
  spentAt: string;
  payer: string;
  note: string | null;
}

export interface GetTripResponse {
  trip: TripDto;
  expenses: ExpenseDto[];
  stats: {
    totalByCurrency: Record<string, number>;
    totalByCategory: Record<string, number>;
    totalByDay: Record<string, number>;
  };
}