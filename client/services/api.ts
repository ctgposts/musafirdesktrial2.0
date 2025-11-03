import {
  LoginRequest,
  LoginResponse,
  User,
  CreateTicketBatchRequest,
  CreateBookingRequest,
  DashboardStats,
  CountriesResponse,
  TicketsResponse,
  BookingResponse,
  TicketBatchResponse,
} from "@shared/api";

// API configuration
const API_BASE_URL = "/api";

// API client class
class APIClient {
  private baseURL: string;
  private authToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Load token from localStorage if available
    this.authToken = localStorage.getItem("bd_ticket_pro_token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<{ success: boolean; message: string; data?: T; errors?: any[] }> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      // Check if response has content
      const contentType = response.headers.get("content-type");
      let result;

      if (contentType && contentType.includes("application/json")) {
        try {
          result = await response.json();
        } catch (jsonError) {
          // If JSON parsing fails, create a fallback result without reading body again
          result = {
            success: response.ok,
            message: `Failed to parse JSON response: ${response.status}`,
          };
        }
      } else {
        // Non-JSON response
        const text = await response.text();
        result = {
          success: response.ok,
          message: text || `HTTP ${response.status}`,
          data: text,
        };
      }

      if (!response.ok) {
        // If unauthorized, clear authentication data
        if (response.status === 401) {
          this.authToken = null;
          localStorage.removeItem("bd_ticket_pro_token");
          localStorage.removeItem("bd_ticket_pro_user");
        }
        throw new Error(
          result.message || `HTTP error! status: ${response.status}`,
        );
      }

      return result;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const result = await this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    if (result.success && result.data) {
      this.authToken = result.data.token;
      localStorage.setItem("bd_ticket_pro_token", result.data.token);
      localStorage.setItem(
        "bd_ticket_pro_user",
        JSON.stringify(result.data.user),
      );
      return result.data;
    }

    throw new Error(result.message || "Login failed");
  }

  async logout(): Promise<void> {
    try {
      await this.request("/auth/logout", { method: "POST" });
    } finally {
      this.authToken = null;
      localStorage.removeItem("bd_ticket_pro_token");
      localStorage.removeItem("bd_ticket_pro_user");
    }
  }

  async getCurrentUser(): Promise<User> {
    const result = await this.request<User>("/auth/me");
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(result.message || "Failed to get user");
  }

  // Dashboard methods
  async getDashboardStats(): Promise<DashboardStats> {
    const result = await this.request<DashboardStats>(
      "/tickets/dashboard/stats",
    );
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(result.message || "Failed to get dashboard stats");
  }

  // Countries methods
  async getCountries(): Promise<CountriesResponse> {
    const result = await this.request<CountriesResponse>(
      "/tickets/countries/stats",
    );
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(result.message || "Failed to get countries");
  }

  // Tickets methods
  async getTickets(filters?: {
    country?: string;
    status?: string;
    airline?: string;
    limit?: number;
    offset?: number;
  }): Promise<TicketsResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = `/tickets${params.toString() ? `?${params.toString()}` : ""}`;
    const result = await this.request<TicketsResponse>(endpoint);

    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(result.message || "Failed to get tickets");
  }

  async getTicketsByCountry(
    countryCode: string,
    filters?: {
      status?: string;
      airline?: string;
    },
  ): Promise<TicketsResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = `/tickets/country/${countryCode}${params.toString() ? `?${params.toString()}` : ""}`;
    const result = await this.request<TicketsResponse>(endpoint);

    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(result.message || "Failed to get country tickets");
  }

  async getTicketById(id: string): Promise<any> {
    const result = await this.request<any>(`/tickets/${id}`);
    if (result.success && result.data) {
      return result.data.ticket;
    }
    throw new Error(result.message || "Failed to get ticket");
  }

  async updateTicketStatus(id: string, status: string): Promise<void> {
    const result = await this.request(`/tickets/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });

    if (!result.success) {
      throw new Error(result.message || "Failed to update ticket status");
    }
  }

  // Ticket Batch methods
  async getTicketBatches(filters?: {
    country?: string;
    airline?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = `/ticket-batches${params.toString() ? `?${params.toString()}` : ""}`;
    const result = await this.request<any>(endpoint);

    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(result.message || "Failed to get ticket batches");
  }

  async createTicketBatch(
    batchData: CreateTicketBatchRequest,
  ): Promise<TicketBatchResponse> {
    const result = await this.request<TicketBatchResponse>("/ticket-batches", {
      method: "POST",
      body: JSON.stringify(batchData),
    });

    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(result.message || "Failed to create ticket batch");
  }

  // Bookings methods
  async getBookings(filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = `/bookings${params.toString() ? `?${params.toString()}` : ""}`;
    const result = await this.request<any>(endpoint);

    if (result.success && result.data) {
      // Return the bookings array from the nested data structure
      return result.data.bookings || [];
    }
    throw new Error(result.message || "Failed to get bookings");
  }

  async createBooking(
    bookingData: CreateBookingRequest,
  ): Promise<BookingResponse> {
    const result = await this.request<BookingResponse>("/bookings", {
      method: "POST",
      body: JSON.stringify(bookingData),
    });

    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(result.message || "Failed to create booking");
  }

  async updateBookingStatus(id: string, status: string): Promise<void> {
    const result = await this.request(`/bookings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });

    if (!result.success) {
      throw new Error(result.message || "Failed to update booking status");
    }
  }

  async cancelBooking(id: string): Promise<void> {
    const result = await this.request(`/bookings/${id}`, {
      method: "DELETE",
    });

    if (!result.success) {
      throw new Error(result.message || "Failed to cancel booking");
    }
  }

  // User management methods
  async getUsers(): Promise<any> {
    const result = await this.request<any>("/users");
    if (result.success && result.data) {
      return result.data.users || [];
    }
    throw new Error(result.message || "Failed to get users");
  }

  async createUser(userData: any): Promise<any> {
    const result = await this.request<any>("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(result.message || "Failed to create user");
  }

  async updateUser(id: string, updates: any): Promise<any> {
    const result = await this.request<any>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });

    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(result.message || "Failed to update user");
  }

  async updateProfile(updates: any): Promise<any> {
    const result = await this.request<any>("/users/profile/me", {
      method: "PUT",
      body: JSON.stringify(updates),
    });

    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(result.message || "Failed to update profile");
  }

  async updatePassword(passwordData: any): Promise<void> {
    const result = await this.request("/users/profile/password", {
      method: "PUT",
      body: JSON.stringify(passwordData),
    });

    if (!result.success) {
      throw new Error(result.message || "Failed to update password");
    }
  }

  async deleteUser(id: string): Promise<void> {
    const result = await this.request(`/users/${id}`, {
      method: "DELETE",
    });

    if (!result.success) {
      throw new Error(result.message || "Failed to delete user");
    }
  }

  // System settings methods
  async getSettings(): Promise<any> {
    const result = await this.request<any>("/settings");
    if (result.success && result.data) {
      return { settings: result.data.settings || [] };
    }
    throw new Error(result.message || "Failed to get settings");
  }

  async updateSettings(settings: any): Promise<void> {
    const result = await this.request("/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });

    if (!result.success) {
      throw new Error(result.message || "Failed to update settings");
    }
  }

  async exportData(format: "json" | "csv" = "json"): Promise<Blob> {
    const response = await fetch(
      `${this.baseURL}/settings/export/data?format=${format}`,
      {
        headers: {
          ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to export data");
    }

    return response.blob();
  }

  async getActivityLogs(filters?: {
    limit?: number;
    user_id?: string;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = `/settings/logs/activity${params.toString() ? `?${params.toString()}` : ""}`;
    const result = await this.request<any>(endpoint);

    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(result.message || "Failed to get activity logs");
  }

  // System information methods
  async getSystemInfo(): Promise<any> {
    const result = await this.request<any>("/settings/system-info");

    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(result.message || "Failed to get system information");
  }

  // Backup methods
  async createBackup(): Promise<any> {
    const result = await this.request<any>("/settings/backup", {
      method: "POST",
    });

    if (result.success) {
      return result.data;
    }
    throw new Error(result.message || "Failed to create backup");
  }
}

// Create and export API client instance
export const apiClient = new APIClient(API_BASE_URL);

// Export individual methods for convenience
export const {
  login,
  logout,
  getCurrentUser,
  getDashboardStats,
  getCountries,
  getTickets,
  getTicketsByCountry,
  getTicketById,
  updateTicketStatus,
  getTicketBatches,
  createTicketBatch,
  getBookings,
  createBooking,
  updateBookingStatus,
  cancelBooking,
  getUsers,
  createUser,
  updateUser,
  updateProfile,
  updatePassword,
  deleteUser,
  getSettings,
  updateSettings,
  exportData,
  getActivityLogs,
  getSystemInfo,
  createBackup,
} = apiClient;
