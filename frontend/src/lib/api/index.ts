import { mockApi } from './mock';
import { ApiClient } from './client';
import type {
  TripDto,
  ExpenseDto,
  CreateTripRequest,
  CreateExpenseRequest,
  GetTripResponse,
} from './types';
import { env } from '$env/dynamic/public';

export type Api = {
  createTrip(req: CreateTripRequest): Promise<TripDto>;
  getTrip(tripId: string): Promise<GetTripResponse>;
  createExpense(tripId: string, req: CreateExpenseRequest): Promise<ExpenseDto>;
  deleteTrip(tripId: string): Promise<void>;
  updateTrip(
    tripId: string,
    payload: {
      title: string;
      startDate: string;
      endDate: string;
      baseCurrency: string;
    }
  ): Promise<TripDto>;
};

// Decision: if PUBLIC_API_BASE_URL is exactly 'mock' the app uses the built-in mock.
// Otherwise the client will call relative `/api/*` endpoints which are proxied
// by SvelteKit server routes to the real backend. This keeps browser fetches
// same-origin and avoids CORS.
const publicBase = (env.PUBLIC_API_BASE_URL ?? '').trim();

let api: Api;

if (publicBase === 'mock') {
  api = mockApi;
} else {
  // Use an ApiClient with empty base so requests go to relative paths like `/api/trips`.
  // The SvelteKit server proxy will forward these to the actual backend target.
  const client = new ApiClient('');
  api = {
    createTrip: (req) => client.createTrip(req),
    getTrip: (tripId) => client.getTrip(tripId),
    createExpense: (tripId, req) => client.createExpense(tripId, req),
    deleteTrip: (tripId) => client.deleteTrip(tripId),
    updateTrip: (tripId, payload) => client.updateTrip(tripId, payload),
  };
}

export { api };
export type { GetTripResponse };