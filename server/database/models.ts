import { db } from "./schema";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

// User model
export interface User {
  id: string;
  username: string;
  password_hash?: string;
  name: string;
  email?: string;
  phone?: string;
  role: "admin" | "manager" | "staff";
  status: "active" | "inactive";
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export class UserRepository {
  static findById(id: string): User | undefined {
    return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User;
  }

  static findByUsername(username: string): User | undefined {
    return db
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(username) as User;
  }

  static findAll(): User[] {
    return db
      .prepare("SELECT * FROM users ORDER BY created_at DESC")
      .all() as User[];
  }

  static create(
    userData: Omit<User, "id" | "created_at" | "updated_at"> & {
      password: string;
    },
  ): User {
    const id = uuidv4();
    const password_hash = bcrypt.hashSync(userData.password, 10);
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO users (id, username, password_hash, name, email, phone, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userData.username,
      password_hash,
      userData.name,
      userData.email,
      userData.phone,
      userData.role,
      userData.status,
      now,
      now,
    );

    return this.findById(id)!;
  }

  static update(id: string, updates: Partial<User>): User | undefined {
    const now = new Date().toISOString();
    updates.updated_at = now;

    const fields =
      Object.keys(updates)
        .filter((key) => key !== "id")
        .join(" = ?, ") + " = ?";
    const values = Object.values(updates).filter(
      (_, index) => Object.keys(updates)[index] !== "id",
    );

    const stmt = db.prepare(`UPDATE users SET ${fields} WHERE id = ?`);
    stmt.run(...values, id);

    return this.findById(id);
  }

  static updateLastLogin(id: string): void {
    const stmt = db.prepare("UPDATE users SET last_login = ? WHERE id = ?");
    stmt.run(new Date().toISOString(), id);
  }

  static verifyPassword(password: string, hash: string): boolean {
    return bcrypt.compareSync(password, hash);
  }

  static delete(id: string): boolean {
    const stmt = db.prepare("DELETE FROM users WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }
}

// Country model
export interface Country {
  code: string;
  name: string;
  flag: string;
  created_at: string;
}

export class CountryRepository {
  static findAll(): Country[] {
    return db
      .prepare("SELECT * FROM countries ORDER BY name")
      .all() as Country[];
  }

  static findByCode(code: string): Country | undefined {
    return db
      .prepare("SELECT * FROM countries WHERE code = ?")
      .get(code) as Country;
  }
}

// Airline model
export interface Airline {
  id: string;
  name: string;
  code?: string;
  created_at: string;
}

export class AirlineRepository {
  static findAll(): Airline[] {
    return db
      .prepare("SELECT * FROM airlines ORDER BY name")
      .all() as Airline[];
  }

  static findById(id: string): Airline | undefined {
    return db.prepare("SELECT * FROM airlines WHERE id = ?").get(id) as Airline;
  }

  static findByName(name: string): Airline | undefined {
    return db
      .prepare("SELECT * FROM airlines WHERE name = ?")
      .get(name) as Airline;
  }
}

// TicketBatch model
export interface TicketBatch {
  id: string;
  country_code: string;
  airline_name: string;
  flight_date: string;
  flight_time: string;
  buying_price: number;
  quantity: number;
  agent_name: string;
  agent_contact?: string;
  agent_address?: string;
  remarks?: string;
  document_url?: string;
  created_by: string;
  created_at: string;
}

export class TicketBatchRepository {
  static findAll(): TicketBatch[] {
    return db
      .prepare("SELECT * FROM ticket_batches ORDER BY created_at DESC")
      .all() as TicketBatch[];
  }

  static findById(id: string): TicketBatch | undefined {
    return db
      .prepare("SELECT * FROM ticket_batches WHERE id = ?")
      .get(id) as TicketBatch;
  }

  static findByCountry(countryCode: string): TicketBatch[] {
    return db
      .prepare(
        "SELECT * FROM ticket_batches WHERE country_code = ? ORDER BY created_at DESC",
      )
      .all(countryCode) as TicketBatch[];
  }

  static create(
    batchData: Omit<TicketBatch, "id" | "created_at">,
  ): TicketBatch {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO ticket_batches (id, country_code, airline_name, flight_date, flight_time, buying_price, quantity, agent_name, agent_contact, agent_address, remarks, document_url, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      batchData.country_code,
      batchData.airline_name,
      batchData.flight_date,
      batchData.flight_time,
      batchData.buying_price,
      batchData.quantity,
      batchData.agent_name,
      batchData.agent_contact,
      batchData.agent_address,
      batchData.remarks,
      batchData.document_url,
      batchData.created_by,
      now,
    );

    return this.findById(id)!;
  }

  static getStatsByCountry(): Array<{
    country_code: string;
    total_tickets: number;
    available_tickets: number;
  }> {
    return db
      .prepare(
        `
      SELECT 
        tb.country_code,
        COALESCE(SUM(tb.quantity), 0) as total_tickets,
        COALESCE(SUM(CASE WHEN t.status = 'available' THEN 1 ELSE 0 END), 0) as available_tickets
      FROM ticket_batches tb
      LEFT JOIN tickets t ON tb.id = t.batch_id
      GROUP BY tb.country_code
    `,
      )
      .all() as Array<{
      country_code: string;
      total_tickets: number;
      available_tickets: number;
    }>;
  }
}

// Ticket model
export interface Ticket {
  id: string;
  batch_id: string;
  flight_number: string;
  status: "available" | "booked" | "locked" | "sold";
  selling_price: number;
  aircraft?: string;
  terminal?: string;
  arrival_time?: string;
  duration?: string;
  available_seats: number;
  total_seats: number;
  locked_until?: string;
  sold_by?: string;
  sold_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketWithBatch extends Ticket {
  batch: TicketBatch;
  country: Country;
}

export class TicketRepository {
  static findAll(): TicketWithBatch[] {
    return db
      .prepare(
        `
      SELECT 
        t.*,
        tb.country_code, tb.airline_name, tb.flight_date, tb.flight_time, tb.buying_price, tb.agent_name,
        c.name as country_name, c.flag as country_flag
      FROM tickets t
      JOIN ticket_batches tb ON t.batch_id = tb.id
      JOIN countries c ON tb.country_code = c.code
      ORDER BY t.created_at DESC
    `,
      )
      .all()
      .map(this.mapTicketWithBatch) as TicketWithBatch[];
  }

  static findById(id: string): TicketWithBatch | undefined {
    const result = db
      .prepare(
        `
      SELECT 
        t.*,
        tb.country_code, tb.airline_name, tb.flight_date, tb.flight_time, tb.buying_price, tb.agent_name,
        c.name as country_name, c.flag as country_flag
      FROM tickets t
      JOIN ticket_batches tb ON t.batch_id = tb.id
      JOIN countries c ON tb.country_code = c.code
      WHERE t.id = ?
    `,
      )
      .get(id);

    return result ? this.mapTicketWithBatch(result) : undefined;
  }

  static findByCountry(countryCode: string): TicketWithBatch[] {
    return db
      .prepare(
        `
      SELECT 
        t.*,
        tb.country_code, tb.airline_name, tb.flight_date, tb.flight_time, tb.buying_price, tb.agent_name,
        c.name as country_name, c.flag as country_flag
      FROM tickets t
      JOIN ticket_batches tb ON t.batch_id = tb.id
      JOIN countries c ON tb.country_code = c.code
      WHERE tb.country_code = ?
      ORDER BY t.created_at DESC
    `,
      )
      .all(countryCode)
      .map(this.mapTicketWithBatch) as TicketWithBatch[];
  }

  static create(
    ticketData: Omit<Ticket, "id" | "created_at" | "updated_at">,
  ): Ticket {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO tickets (id, batch_id, flight_number, status, selling_price, aircraft, terminal, arrival_time, duration, available_seats, total_seats, locked_until, sold_by, sold_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      ticketData.batch_id,
      ticketData.flight_number,
      ticketData.status,
      ticketData.selling_price,
      ticketData.aircraft,
      ticketData.terminal,
      ticketData.arrival_time,
      ticketData.duration,
      ticketData.available_seats,
      ticketData.total_seats,
      ticketData.locked_until,
      ticketData.sold_by,
      ticketData.sold_at,
      now,
      now,
    );

    return db.prepare("SELECT * FROM tickets WHERE id = ?").get(id) as Ticket;
  }

  static updateStatus(
    id: string,
    status: Ticket["status"],
    soldBy?: string,
  ): boolean {
    const now = new Date().toISOString();
    let stmt;

    if (status === "sold" && soldBy) {
      stmt = db.prepare(
        "UPDATE tickets SET status = ?, sold_by = ?, sold_at = ?, updated_at = ? WHERE id = ?",
      );
      stmt.run(status, soldBy, now, now, id);
    } else if (status === "locked") {
      const lockedUntil = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString(); // 24 hours from now
      stmt = db.prepare(
        "UPDATE tickets SET status = ?, locked_until = ?, updated_at = ? WHERE id = ?",
      );
      stmt.run(status, lockedUntil, now, id);
    } else {
      stmt = db.prepare(
        "UPDATE tickets SET status = ?, locked_until = NULL, updated_at = ? WHERE id = ?",
      );
      stmt.run(status, now, id);
    }

    return stmt.changes > 0;
  }

  static getDashboardStats() {
    const today = new Date().toISOString().split("T")[0];

    const todaysSales = db
      .prepare(
        `
      SELECT COUNT(*) as count, COALESCE(SUM(selling_price), 0) as amount
      FROM tickets 
      WHERE status = 'sold' AND DATE(sold_at) = ?
    `,
      )
      .get(today) as { count: number; amount: number };

    const totalBookings = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM bookings WHERE status = 'confirmed'
    `,
      )
      .get() as { count: number };

    const lockedTickets = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM tickets WHERE status = 'locked'
    `,
      )
      .get() as { count: number };

    const totalInventory = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM tickets WHERE status IN ('available', 'locked')
    `,
      )
      .get() as { count: number };

    const estimatedProfit = db
      .prepare(
        `
      SELECT COALESCE(SUM(t.selling_price - tb.buying_price), 0) as profit
      FROM tickets t
      JOIN ticket_batches tb ON t.batch_id = tb.id
      WHERE t.status = 'sold'
    `,
      )
      .get() as { profit: number };

    return {
      todaysSales,
      totalBookings: totalBookings.count,
      lockedTickets: lockedTickets.count,
      totalInventory: totalInventory.count,
      estimatedProfit: estimatedProfit.profit,
    };
  }

  private static mapTicketWithBatch(row: any): TicketWithBatch {
    return {
      id: row.id,
      batch_id: row.batch_id,
      flight_number: row.flight_number,
      status: row.status,
      selling_price: row.selling_price,
      aircraft: row.aircraft,
      terminal: row.terminal,
      arrival_time: row.arrival_time,
      duration: row.duration,
      available_seats: row.available_seats,
      total_seats: row.total_seats,
      locked_until: row.locked_until,
      sold_by: row.sold_by,
      sold_at: row.sold_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      batch: {
        id: row.batch_id,
        country_code: row.country_code,
        airline_name: row.airline_name,
        flight_date: row.flight_date,
        flight_time: row.flight_time,
        buying_price: row.buying_price,
        quantity: 0, // Will be filled if needed
        agent_name: row.agent_name,
        created_by: "",
        created_at: "",
      },
      country: {
        code: row.country_code,
        name: row.country_name,
        flag: row.country_flag,
        created_at: "",
      },
    };
  }
}

// Booking model
export interface Booking {
  id: string;
  ticket_id: string;
  agent_name: string;
  agent_phone?: string;
  agent_email?: string;
  passenger_name: string;
  passenger_passport: string;
  passenger_phone: string;
  passenger_email?: string;
  pax_count: number;
  selling_price: number;
  payment_type: "full" | "partial";
  partial_amount?: number;
  payment_method: string;
  payment_details?: string;
  comments?: string;
  status: "pending" | "confirmed" | "cancelled" | "expired";
  created_by: string;
  confirmed_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export class BookingRepository {
  static findAll(): Booking[] {
    return db
      .prepare("SELECT * FROM bookings ORDER BY created_at DESC")
      .all() as Booking[];
  }

  // Transform booking data for frontend compatibility
  static transformForFrontend(booking: Booking) {
    return {
      ...booking,
      agentInfo: {
        name: booking.agent_name,
        phone: booking.agent_phone,
        email: booking.agent_email,
      },
      passengerInfo: {
        name: booking.passenger_name,
        passportNo: booking.passenger_passport,
        phone: booking.passenger_phone,
        email: booking.passenger_email,
        paxCount: booking.pax_count,
      },
    };
  }

  static findAllForFrontend() {
    const bookings = this.findAll();
    return bookings.map(booking => this.transformForFrontend(booking));
  }

  static findById(id: string): Booking | undefined {
    return db.prepare("SELECT * FROM bookings WHERE id = ?").get(id) as Booking;
  }

  static findByUser(userId: string): Booking[] {
    return db
      .prepare(
        "SELECT * FROM bookings WHERE created_by = ? ORDER BY created_at DESC",
      )
      .all(userId) as Booking[];
  }

  static create(
    bookingData: Omit<Booking, "id" | "created_at" | "updated_at">,
  ): Booking {
    const id = uuidv4();
    const now = new Date().toISOString();
    const expiresAt =
      bookingData.payment_type === "partial"
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        : undefined;

    const stmt = db.prepare(`
      INSERT INTO bookings (id, ticket_id, agent_name, agent_phone, agent_email, passenger_name, passenger_passport, passenger_phone, passenger_email, pax_count, selling_price, payment_type, partial_amount, payment_method, payment_details, comments, status, created_by, expires_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      bookingData.ticket_id,
      bookingData.agent_name,
      bookingData.agent_phone,
      bookingData.agent_email,
      bookingData.passenger_name,
      bookingData.passenger_passport,
      bookingData.passenger_phone,
      bookingData.passenger_email,
      bookingData.pax_count,
      bookingData.selling_price,
      bookingData.payment_type,
      bookingData.partial_amount,
      bookingData.payment_method,
      bookingData.payment_details,
      bookingData.comments,
      bookingData.status,
      bookingData.created_by,
      expiresAt,
      now,
      now,
    );

    return this.findById(id)!;
  }

  static updateStatus(id: string, status: Booking["status"]): boolean {
    const now = new Date().toISOString();
    let stmt;

    if (status === "confirmed") {
      stmt = db.prepare(
        "UPDATE bookings SET status = ?, confirmed_at = ?, updated_at = ? WHERE id = ?",
      );
      stmt.run(status, now, now, id);
    } else {
      stmt = db.prepare(
        "UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?",
      );
      stmt.run(status, now, id);
    }

    return stmt.changes > 0;
  }
}

// System Settings model
export interface SystemSetting {
  key: string;
  value: string;
  updated_at: string;
}

export class SystemSettingsRepository {
  static findAll(): Record<string, string> {
    const settings = db
      .prepare("SELECT key, value FROM system_settings")
      .all() as SystemSetting[];
    return settings.reduce(
      (acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  static get(key: string): string | undefined {
    const result = db
      .prepare("SELECT value FROM system_settings WHERE key = ?")
      .get(key) as { value: string } | undefined;
    return result?.value;
  }

  static set(key: string, value: string): void {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO system_settings (key, value, updated_at) 
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?
    `);
    stmt.run(key, value, now, value, now);
  }

  static setBatch(settings: Record<string, string>): void {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO system_settings (key, value, updated_at) 
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?
    `);

    const transaction = db.transaction(() => {
      for (const [key, value] of Object.entries(settings)) {
        stmt.run(key, value, now, value, now);
      }
    });

    transaction();
  }
}

// Activity Log model
export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export class ActivityLogRepository {
  static create(logData: Omit<ActivityLog, "id" | "created_at">): ActivityLog {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, details, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      logData.user_id,
      logData.action,
      logData.entity_type,
      logData.entity_id,
      logData.details,
      logData.ip_address,
      logData.user_agent,
      now,
    );

    return db
      .prepare("SELECT * FROM activity_logs WHERE id = ?")
      .get(id) as ActivityLog;
  }

  static findByUser(userId: string, limit: number = 50): ActivityLog[] {
    return db
      .prepare(
        "SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
      )
      .all(userId, limit) as ActivityLog[];
  }

  static findRecent(limit: number = 100): ActivityLog[] {
    return db
      .prepare("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?")
      .all(limit) as ActivityLog[];
  }
}
