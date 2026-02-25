import type {
  TripDto,
  ExpenseDto,
  CreateTripRequest,
  CreateExpenseRequest,
  GetTripResponse,
} from './types';
import type { Api } from './index';
// In-memory storage
const tripsMap = new Map<string, TripDto>();
const expensesMap = new Map<string, ExpenseDto[]>();

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getCurrentTime(): string {
  return new Date().toISOString();
}

function calculateStats(expenses: ExpenseDto[]) {
  const totalByCurrency: Record<string, number> = {};
  const totalByCategory: Record<string, number> = {};
  const totalByDay: Record<string, number> = {};

  expenses.forEach((expense) => {
    // totalByCurrency
    if (!totalByCurrency[expense.currency]) {
      totalByCurrency[expense.currency] = 0;
    }
    totalByCurrency[expense.currency] += expense.amount;

    // totalByCategory
    if (!totalByCategory[expense.category]) {
      totalByCategory[expense.category] = 0;
    }
    totalByCategory[expense.category] += expense.amount;

    // totalByDay
    if (!totalByDay[expense.spentAt]) {
      totalByDay[expense.spentAt] = 0;
    }
    totalByDay[expense.spentAt] += expense.amount;
  });

  return { totalByCurrency, totalByCategory, totalByDay };
}

export const mockApi: Api = {
  async createTrip(req: CreateTripRequest): Promise<TripDto> {
    const trip: TripDto = {
      id: generateId('trip'),
      title: req.title,
      startDate: req.startDate,
      endDate: req.endDate,
      baseCurrency: req.baseCurrency,
      createdAt: getCurrentTime(),
    };

    tripsMap.set(trip.id, trip);
    expensesMap.set(trip.id, []);

    return trip;
  },

  async getTrip(tripId: string): Promise<GetTripResponse> {
    const trip = tripsMap.get(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    const expenses = expensesMap.get(tripId) || [];
    const stats = calculateStats(expenses);

    return {
      trip,
      expenses,
      stats,
    };
  },

  async createExpense(
    tripId: string,
    req: CreateExpenseRequest
  ): Promise<ExpenseDto> {
    const trip = tripsMap.get(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    const expense: ExpenseDto = {
      id: generateId('exp'),
      tripId,
      amount: req.amount,
      currency: req.currency,
      category: req.category,
      spentAt: req.spentAt,
      payer: req.payer,
      note: req.note || null,
      createdAt: getCurrentTime(),
    };

    if (!expensesMap.has(tripId)) {
      expensesMap.set(tripId, []);
    }
    expensesMap.get(tripId)!.push(expense);

    return expense;
  },

  async deleteTrip(tripId: string): Promise<void> {
    if (!tripsMap.has(tripId)) {
      throw new Error('Trip not found');
    }
    tripsMap.delete(tripId);
    expensesMap.delete(tripId);
  },

  async updateTrip(
    tripId: string,
    payload: {
      title: string;
      startDate: string;
      endDate: string;
      baseCurrency: string;
    }
  ): Promise<TripDto> {
    const trip = tripsMap.get(tripId);
    if (!trip) throw new Error('Trip not found');

    const updated: TripDto = {
      ...trip,
      ...payload
    };

    tripsMap.set(tripId, updated);
    return updated;
  }
};