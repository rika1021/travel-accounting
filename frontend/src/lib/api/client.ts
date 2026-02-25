import type {
  TripDto,
  ExpenseDto,
  CreateTripRequest,
  CreateExpenseRequest,
  GetTripResponse,
} from './types';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    url: string,
    body?: unknown
  ): Promise<T> {
    const fullUrl = `${this.baseUrl}${url}`;
    const options: RequestInit = {
      method,
    };

    if (body) {
      options.headers = {
        'Content-Type': 'application/json',
      };
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(fullUrl, options);

      let data: unknown;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }
      } catch {
        throw new Error('Failed to parse response');
      }

      if (!response.ok) {
        // Check if response has standard error format
        if (
          typeof data === 'object' &&
          data !== null &&
          'message' in data &&
          typeof (data as Record<string, unknown>).message === 'string'
        ) {
          throw new Error(
            (data as Record<string, unknown>).message as string
          );
        }
        throw new Error(`HTTP ${response.status}`);
      }

      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error');
    }
  }

  async createTrip(req: CreateTripRequest): Promise<TripDto> {
    return this.request<TripDto>('POST', '/api/trips', req);
  }

  async getTrip(tripId: string): Promise<GetTripResponse> {
    return this.request<GetTripResponse>('GET', `/api/trips/${tripId}`);
  }

  async createExpense(
    tripId: string,
    req: CreateExpenseRequest
  ): Promise<ExpenseDto> {
    return this.request<ExpenseDto>(
      'POST',
      `/api/trips/${tripId}/expenses`,
      req
    );
  }

  async deleteTrip(tripId: string): Promise<void> {
    await this.request<void>('DELETE', `/api/trips/${tripId}`);
  }

  async updateTrip(
    tripId: string,
    payload: {
      title: string;
      startDate: string;
      endDate: string;
      baseCurrency: string;
    }
  ): Promise<TripDto> {
    return this.request<TripDto>('PATCH', `/api/trips/${tripId}`, payload);
  }
}