import * as path from "path";
import path__default, { join } from "path";
import * as express from "express";
import express__default, { Router } from "express";
import cors from "cors";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { v4 } from "uuid";
import jwt from "jsonwebtoken";
import { z } from "zod";
import * as os from "os";
import * as fs from "fs";
const dbPath = join(process.cwd(), "bd-ticketpro.db");
const db = new Database(dbPath);
db.pragma("foreign_keys = ON");
function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      last_login TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS countries (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      flag TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS airlines (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      code TEXT UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_batches (
      id TEXT PRIMARY KEY,
      country_code TEXT NOT NULL,
      airline_name TEXT NOT NULL,
      flight_date TEXT NOT NULL,
      flight_time TEXT NOT NULL,
      buying_price INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      agent_name TEXT NOT NULL,
      agent_contact TEXT,
      agent_address TEXT,
      remarks TEXT,
      document_url TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (country_code) REFERENCES countries(code),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      flight_number TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'locked', 'sold')),
      selling_price INTEGER NOT NULL,
      aircraft TEXT,
      terminal TEXT,
      arrival_time TEXT,
      duration TEXT,
      available_seats INTEGER NOT NULL DEFAULT 1,
      total_seats INTEGER NOT NULL DEFAULT 1,
      locked_until TEXT,
      sold_by TEXT,
      sold_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (batch_id) REFERENCES ticket_batches(id),
      FOREIGN KEY (sold_by) REFERENCES users(id)
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      agent_phone TEXT,
      agent_email TEXT,
      passenger_name TEXT NOT NULL,
      passenger_passport TEXT NOT NULL,
      passenger_phone TEXT NOT NULL,
      passenger_email TEXT,
      pax_count INTEGER NOT NULL DEFAULT 1,
      selling_price INTEGER NOT NULL,
      payment_type TEXT NOT NULL CHECK (payment_type IN ('full', 'partial')),
      partial_amount INTEGER,
      payment_method TEXT NOT NULL DEFAULT 'cash',
      payment_details TEXT, -- JSON string for card details, etc.
      comments TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired')),
      created_by TEXT NOT NULL,
      confirmed_at TEXT,
      expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT, -- JSON string
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tickets_batch_id ON tickets(batch_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_bookings_ticket_id ON bookings(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    CREATE INDEX IF NOT EXISTS idx_bookings_created_by ON bookings(created_by);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
  `);
  console.log("Database schema initialized successfully");
}
function seedDatabase() {
  try {
    const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
    if (userCount.count > 0) {
      console.log("Database already seeded");
      return;
    }
    const insertCountry = db.prepare(`
      INSERT INTO countries (code, name, flag) VALUES (?, ?, ?)
    `);
    const countries = [
      ["KSA", "Saudi Arabia", "🇸🇦"],
      ["UAE", "United Arab Emirates", "🇦🇪"],
      ["QAT", "Qatar", "🇶🇦"],
      ["KWT", "Kuwait", "🇰🇼"],
      ["OMN", "Oman", "🇴🇲"],
      ["BHR", "Bahrain", "🇧🇭"],
      ["JOR", "Jordan", "🇯🇴"],
      ["LBN", "Lebanon", "🇱🇧"]
    ];
    for (const country of countries) {
      insertCountry.run(...country);
    }
    const insertAirline = db.prepare(`
      INSERT INTO airlines (id, name, code) VALUES (?, ?, ?)
    `);
    const airlines = [
      [v4(), "Air Arabia", "G9"],
      [v4(), "Emirates", "EK"],
      [v4(), "Qatar Airways", "QR"],
      [v4(), "Saudi Airlines", "SV"],
      [v4(), "Flydubai", "FZ"],
      [v4(), "Kuwait Airways", "KU"],
      [v4(), "Oman Air", "WY"],
      [v4(), "Gulf Air", "GF"]
    ];
    for (const airline of airlines) {
      insertAirline.run(...airline);
    }
    const insertUser = db.prepare(`
      INSERT INTO users (id, username, password_hash, name, email, phone, role, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const defaultUsers = [
      {
        id: v4(),
        username: "admin",
        password: "admin123",
        name: "Admin User",
        email: "admin@bdticketpro.com",
        phone: "+8801234567890",
        role: "admin",
        status: "active"
      },
      {
        id: v4(),
        username: "manager",
        password: "manager123",
        name: "Manager User",
        email: "manager@bdticketpro.com",
        phone: "+8801234567891",
        role: "manager",
        status: "active"
      },
      {
        id: v4(),
        username: "staff",
        password: "staff123",
        name: "Staff User",
        email: "staff@bdticketpro.com",
        phone: "+8801234567892",
        role: "staff",
        status: "active"
      }
    ];
    for (const user of defaultUsers) {
      const passwordHash = bcrypt.hashSync(user.password, 10);
      insertUser.run(
        user.id,
        user.username,
        passwordHash,
        user.name,
        user.email,
        user.phone,
        user.role,
        user.status
      );
    }
    const insertSetting = db.prepare(`
      INSERT INTO system_settings (key, value) VALUES (?, ?)
    `);
    const settings = [
      ["company_name", "BD TicketPro"],
      ["company_email", "info@bdticketpro.com"],
      ["company_phone", "+880-123-456-7890"],
      ["company_address", "Dhanmondi, Dhaka, Bangladesh"],
      ["default_currency", "BDT"],
      ["timezone", "Asia/Dhaka"],
      ["language", "en"],
      ["auto_backup", "true"],
      ["email_notifications", "true"],
      ["sms_notifications", "false"],
      ["booking_timeout", "24"]
    ];
    for (const setting of settings) {
      insertSetting.run(...setting);
    }
    if (false) ;
    else {
      console.log("Production environment: skipping sample data seeding");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
class UserRepository {
  static findById(id) {
    return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  }
  static findByUsername(username) {
    return db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  }
  static findAll() {
    return db.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
  }
  static create(userData) {
    const id = v4();
    const password_hash = bcrypt.hashSync(userData.password, 10);
    const now = (/* @__PURE__ */ new Date()).toISOString();
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
      now
    );
    return this.findById(id);
  }
  static update(id, updates) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    updates.updated_at = now;
    const fields = Object.keys(updates).filter((key) => key !== "id").join(" = ?, ") + " = ?";
    const values = Object.values(updates).filter(
      (_, index) => Object.keys(updates)[index] !== "id"
    );
    const stmt = db.prepare(`UPDATE users SET ${fields} WHERE id = ?`);
    stmt.run(...values, id);
    return this.findById(id);
  }
  static updateLastLogin(id) {
    const stmt = db.prepare("UPDATE users SET last_login = ? WHERE id = ?");
    stmt.run((/* @__PURE__ */ new Date()).toISOString(), id);
  }
  static verifyPassword(password, hash) {
    return bcrypt.compareSync(password, hash);
  }
  static delete(id) {
    const stmt = db.prepare("DELETE FROM users WHERE id = ?");
    const result = stmt.run(id);
    return "changes" in result && result.changes > 0;
  }
}
class CountryRepository {
  static findAll() {
    return db.prepare("SELECT * FROM countries ORDER BY name").all();
  }
  static findByCode(code) {
    return db.prepare("SELECT * FROM countries WHERE code = ?").get(code);
  }
}
class TicketBatchRepository {
  static findAll() {
    return db.prepare("SELECT * FROM ticket_batches ORDER BY created_at DESC").all();
  }
  static findById(id) {
    return db.prepare("SELECT * FROM ticket_batches WHERE id = ?").get(id);
  }
  static findByCountry(countryCode) {
    return db.prepare(
      "SELECT * FROM ticket_batches WHERE country_code = ? ORDER BY created_at DESC"
    ).all(countryCode);
  }
  static create(batchData) {
    const id = v4();
    const now = (/* @__PURE__ */ new Date()).toISOString();
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
      now
    );
    return this.findById(id);
  }
  static getStatsByCountry() {
    return db.prepare(
      `
      SELECT 
        tb.country_code,
        COALESCE(SUM(tb.quantity), 0) as total_tickets,
        COALESCE(SUM(CASE WHEN t.status = 'available' THEN 1 ELSE 0 END), 0) as available_tickets
      FROM ticket_batches tb
      LEFT JOIN tickets t ON tb.id = t.batch_id
      GROUP BY tb.country_code
    `
    ).all();
  }
  static delete(id) {
    const stmt = db.prepare("DELETE FROM ticket_batches WHERE id = ?");
    const result = stmt.run(id);
    return "changes" in result && result.changes > 0;
  }
}
class TicketRepository {
  static findAll() {
    return db.prepare(
      `
      SELECT 
        t.*,
        tb.country_code, tb.airline_name, tb.flight_date, tb.flight_time, tb.buying_price, tb.agent_name,
        c.name as country_name, c.flag as country_flag
      FROM tickets t
      JOIN ticket_batches tb ON t.batch_id = tb.id
      JOIN countries c ON tb.country_code = c.code
      ORDER BY t.created_at DESC
    `
    ).all().map(this.mapTicketWithBatch);
  }
  static findById(id) {
    const result = db.prepare(
      `
      SELECT 
        t.*,
        tb.country_code, tb.airline_name, tb.flight_date, tb.flight_time, tb.buying_price, tb.agent_name,
        c.name as country_name, c.flag as country_flag
      FROM tickets t
      JOIN ticket_batches tb ON t.batch_id = tb.id
      JOIN countries c ON tb.country_code = c.code
      WHERE t.id = ?
    `
    ).get(id);
    return result ? this.mapTicketWithBatch(result) : void 0;
  }
  static findByCountry(countryCode) {
    return db.prepare(
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
    `
    ).all(countryCode).map(this.mapTicketWithBatch);
  }
  static create(ticketData) {
    const id = v4();
    const now = (/* @__PURE__ */ new Date()).toISOString();
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
      now
    );
    return db.prepare("SELECT * FROM tickets WHERE id = ?").get(id);
  }
  static updateStatus(id, status, soldBy) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let stmt;
    if (status === "sold" && soldBy) {
      stmt = db.prepare(
        "UPDATE tickets SET status = ?, sold_by = ?, sold_at = ?, updated_at = ? WHERE id = ?"
      );
      stmt.run(status, soldBy, now, now, id);
    } else if (status === "locked") {
      const lockedUntil = new Date(
        Date.now() + 24 * 60 * 60 * 1e3
      ).toISOString();
      stmt = db.prepare(
        "UPDATE tickets SET status = ?, locked_until = ?, updated_at = ? WHERE id = ?"
      );
      stmt.run(status, lockedUntil, now, id);
    } else {
      stmt = db.prepare(
        "UPDATE tickets SET status = ?, locked_until = NULL, updated_at = ? WHERE id = ?"
      );
      stmt.run(status, now, id);
    }
    return stmt.changes > 0;
  }
  static getDashboardStats() {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const todaysSales = db.prepare(
      `
      SELECT COUNT(*) as count, COALESCE(SUM(selling_price), 0) as amount
      FROM tickets 
      WHERE status = 'sold' AND DATE(sold_at) = ?
    `
    ).get(today);
    const totalBookings = db.prepare(
      `
      SELECT COUNT(*) as count FROM bookings WHERE status = 'confirmed'
    `
    ).get();
    const lockedTickets = db.prepare(
      `
      SELECT COUNT(*) as count FROM tickets WHERE status = 'locked'
    `
    ).get();
    const totalInventory = db.prepare(
      `
      SELECT COUNT(*) as count FROM tickets WHERE status IN ('available', 'locked')
    `
    ).get();
    const estimatedProfit = db.prepare(
      `
      SELECT COALESCE(SUM(t.selling_price - tb.buying_price), 0) as profit
      FROM tickets t
      JOIN ticket_batches tb ON t.batch_id = tb.id
      WHERE t.status = 'sold'
    `
    ).get();
    return {
      todaysSales,
      totalBookings: totalBookings.count,
      lockedTickets: lockedTickets.count,
      totalInventory: totalInventory.count,
      estimatedProfit: estimatedProfit.profit
    };
  }
  static mapTicketWithBatch(row) {
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
        quantity: 0,
        // Will be filled if needed
        agent_name: row.agent_name,
        created_by: "",
        created_at: ""
      },
      country: {
        code: row.country_code,
        name: row.country_name,
        flag: row.country_flag,
        created_at: ""
      }
    };
  }
}
class BookingRepository {
  static findAll() {
    return db.prepare("SELECT * FROM bookings ORDER BY created_at DESC").all();
  }
  // Transform booking data for frontend compatibility
  static transformForFrontend(booking) {
    return {
      ...booking,
      agentInfo: {
        name: booking.agent_name,
        phone: booking.agent_phone,
        email: booking.agent_email
      },
      passengerInfo: {
        name: booking.passenger_name,
        passportNo: booking.passenger_passport,
        phone: booking.passenger_phone,
        email: booking.passenger_email,
        paxCount: booking.pax_count
      }
    };
  }
  static findAllForFrontend() {
    const bookings = this.findAll();
    return bookings.map((booking) => this.transformForFrontend(booking));
  }
  static findById(id) {
    return db.prepare("SELECT * FROM bookings WHERE id = ?").get(id);
  }
  static findByUser(userId) {
    return db.prepare(
      "SELECT * FROM bookings WHERE created_by = ? ORDER BY created_at DESC"
    ).all(userId);
  }
  static create(bookingData) {
    const id = v4();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const expiresAt = bookingData.payment_type === "partial" ? new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString() : void 0;
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
      now
    );
    return this.findById(id);
  }
  static updateStatus(id, status) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let stmt;
    if (status === "confirmed") {
      stmt = db.prepare(
        "UPDATE bookings SET status = ?, confirmed_at = ?, updated_at = ? WHERE id = ?"
      );
      stmt.run(status, now, now, id);
    } else {
      stmt = db.prepare(
        "UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?"
      );
      stmt.run(status, now, id);
    }
    return stmt.changes > 0;
  }
}
class SystemSettingsRepository {
  static findAll() {
    const settings = db.prepare("SELECT key, value FROM system_settings").all();
    return settings.reduce(
      (acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      },
      {}
    );
  }
  static get(key) {
    const result = db.prepare("SELECT value FROM system_settings WHERE key = ?").get(key);
    return result?.value;
  }
  static set(key, value) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const stmt = db.prepare(`
      INSERT INTO system_settings (key, value, updated_at) 
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?
    `);
    stmt.run(key, value, now, value, now);
  }
  static setBatch(settings) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
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
class ActivityLogRepository {
  static create(logData) {
    const id = v4();
    const now = (/* @__PURE__ */ new Date()).toISOString();
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
      now
    );
    return db.prepare("SELECT * FROM activity_logs WHERE id = ?").get(id);
  }
  static findByUser(userId, limit = 50) {
    return db.prepare(
      "SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?"
    ).all(userId, limit);
  }
  static findRecent(limit = 100) {
    return db.prepare("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?").all(limit);
  }
}
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
function generateToken(user) {
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required"
    });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
  const user = UserRepository.findById(payload.userId);
  if (!user || user.status !== "active") {
    return res.status(401).json({
      success: false,
      message: "User not found or inactive"
    });
  }
  delete user.password_hash;
  req.user = user;
  next();
}
const PERMISSIONS = {
  admin: [
    "view_buying_price",
    "edit_batches",
    "delete_batches",
    "create_batches",
    "view_profit",
    "override_locks",
    "manage_users",
    "view_all_bookings",
    "confirm_bookings",
    "confirm_sales",
    "system_settings"
  ],
  manager: [
    "view_tickets",
    "create_bookings",
    "confirm_bookings",
    "confirm_sales",
    "view_all_bookings"
  ],
  staff: ["view_tickets", "create_bookings", "partial_payments"]
};
function hasPermission(role, permission) {
  return PERMISSIONS[role]?.includes(permission) || false;
}
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }
    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        message: `Permission '${permission}' required`
      });
    }
    next();
  };
}
const router$5 = Router();
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});
router$5.post("/login", async (req, res) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    const user = UserRepository.findByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }
    if (user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Account is inactive"
      });
    }
    if (!UserRepository.verifyPassword(password, user.password_hash)) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }
    UserRepository.updateLastLogin(user.id);
    ActivityLogRepository.create({
      user_id: user.id,
      action: "login",
      entity_type: "auth",
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get("User-Agent")
    });
    const token = generateToken(user);
    delete user.password_hash;
    res.json({
      success: true,
      message: "Login successful",
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});
router$5.get("/me", authenticate, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      success: true,
      message: "User profile retrieved",
      data: user
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});
router$5.post("/logout", async (_req, res) => {
  try {
    res.json({
      success: true,
      message: "Logout successful"
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});
const router$4 = Router();
router$4.use(authenticate);
router$4.get("/", async (req, res) => {
  try {
    const { country, status, airline, limit = 50, offset = 0 } = req.query;
    let tickets = TicketRepository.findAll();
    if (country) {
      tickets = tickets.filter(
        (ticket) => ticket.batch.country_code === country
      );
    }
    if (status) {
      tickets = tickets.filter((ticket) => ticket.status === status);
    }
    if (airline) {
      tickets = tickets.filter(
        (ticket) => ticket.batch.airline_name.toLowerCase().includes(airline.toLowerCase())
      );
    }
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedTickets = tickets.slice(startIndex, endIndex);
    const userCanViewBuyingPrice = hasPermission(
      req.user.role,
      "view_buying_price"
    );
    if (!userCanViewBuyingPrice) {
      paginatedTickets.forEach((ticket) => {
        if (ticket.batch) {
          ticket.batch.buying_price = 0;
        }
      });
    }
    res.json({
      success: true,
      message: "Tickets retrieved successfully",
      data: {
        tickets: paginatedTickets,
        total: tickets.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error("Get tickets error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});
router$4.get("/country/:countryCode", async (req, res) => {
  try {
    const { countryCode } = req.params;
    const { status, airline } = req.query;
    let tickets = TicketRepository.findByCountry(countryCode.toUpperCase());
    if (status) {
      tickets = tickets.filter((ticket) => ticket.status === status);
    }
    if (airline) {
      tickets = tickets.filter(
        (ticket) => ticket.batch.airline_name.toLowerCase().includes(airline.toLowerCase())
      );
    }
    const userCanViewBuyingPrice = hasPermission(
      req.user.role,
      "view_buying_price"
    );
    if (!userCanViewBuyingPrice) {
      tickets.forEach((ticket) => {
        if (ticket.batch) {
          ticket.batch.buying_price = 0;
        }
      });
    }
    res.json({
      success: true,
      message: "Country tickets retrieved successfully",
      data: {
        tickets,
        country: countryCode,
        total: tickets.length
      }
    });
  } catch (error) {
    console.error("Get country tickets error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});
router$4.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = TicketRepository.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }
    if (ticket.batch && !hasPermission(req.user.role, "view_buying_price")) {
      ticket.batch.buying_price = 0;
    }
    res.json({
      success: true,
      message: "Ticket retrieved successfully",
      data: { ticket }
    });
  } catch (error) {
    console.error("Get ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});
router$4.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["available", "booked", "locked", "sold"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }
    if (status === "sold" && !hasPermission(req.user.role, "confirm_sales")) {
      return res.status(403).json({
        success: false,
        message: "Permission required to mark tickets as sold"
      });
    }
    const ticket = TicketRepository.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }
    const success = TicketRepository.updateStatus(
      id,
      status,
      status === "sold" ? req.user.id : void 0
    );
    if (success) {
      ActivityLogRepository.create({
        user_id: req.user.id,
        action: "update_ticket_status",
        entity_type: "ticket",
        entity_id: id,
        details: JSON.stringify({
          old_status: ticket.status,
          new_status: status
        }),
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get("User-Agent")
      });
      res.json({
        success: true,
        message: "Ticket status updated successfully"
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to update ticket status"
      });
    }
  } catch (error) {
    console.error("Update ticket status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});
router$4.get("/dashboard/stats", async (req, res) => {
  try {
    const stats = TicketRepository.getDashboardStats();
    if (!hasPermission(req.user.role, "view_profit")) {
      stats.estimatedProfit = 0;
    }
    res.json({
      success: true,
      message: "Dashboard statistics retrieved successfully",
      data: stats
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});
router$4.get("/countries/stats", async (_req, res) => {
  try {
    const countries = CountryRepository.findAll();
    const stats = TicketBatchRepository.getStatsByCountry();
    const countriesWithStats = countries.map((country) => {
      const countryStats = stats.find(
        (stat) => stat.country_code === country.code
      );
      return {
        ...country,
        totalTickets: countryStats?.total_tickets || 0,
        availableTickets: countryStats?.available_tickets || 0
      };
    });
    res.json({
      success: true,
      message: "Countries with statistics retrieved successfully",
      data: { countries: countriesWithStats }
    });
  } catch (error) {
    console.error("Get countries stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});
const router$3 = Router();
router$3.use(authenticate);
const createBatchSchema = z.object({
  country: z.string().min(1, "Country is required"),
  airline: z.string().min(1, "Airline is required"),
  flightDate: z.string().min(1, "Flight date is required"),
  flightTime: z.string().min(1, "Flight time is required"),
  buyingPrice: z.number().min(0, "Buying price must be positive"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  agentName: z.string().min(1, "Agent name is required"),
  agentContact: z.string().optional(),
  agentAddress: z.string().optional(),
  remarks: z.string().optional()
});
router$3.get(
  "/",
  requirePermission("view_profit"),
  async (req, res) => {
    try {
      const { country, airline, dateFrom, dateTo } = req.query;
      let batches = TicketBatchRepository.findAll();
      if (country) {
        batches = batches.filter((batch) => batch.country_code === country);
      }
      if (airline) {
        batches = batches.filter(
          (batch) => batch.airline_name.toLowerCase().includes(airline.toLowerCase())
        );
      }
      if (dateFrom) {
        batches = batches.filter((batch) => batch.flight_date >= dateFrom);
      }
      if (dateTo) {
        batches = batches.filter((batch) => batch.flight_date <= dateTo);
      }
      const batchesWithStats = batches.map((batch) => {
        const tickets = TicketRepository.findAll().filter(
          (ticket) => ticket.batch_id === batch.id
        );
        const sold = tickets.filter(
          (ticket) => ticket.status === "sold"
        ).length;
        const locked = tickets.filter(
          (ticket) => ticket.status === "locked"
        ).length;
        const available = tickets.filter(
          (ticket) => ticket.status === "available"
        ).length;
        const soldTickets = tickets.filter(
          (ticket) => ticket.status === "sold"
        );
        const totalRevenue = soldTickets.reduce(
          (sum, ticket) => sum + ticket.selling_price,
          0
        );
        const totalCost = sold * batch.buying_price;
        const profit = totalRevenue - totalCost;
        return {
          ...batch,
          sold,
          locked,
          available,
          totalCost: batch.buying_price * batch.quantity,
          profit
        };
      });
      res.json({
        success: true,
        message: "Ticket batches retrieved successfully",
        data: {
          batches: batchesWithStats,
          total: batchesWithStats.length
        }
      });
    } catch (error) {
      console.error("Get ticket batches error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
);
router$3.get(
  "/:id",
  requirePermission("view_profit"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const batch = TicketBatchRepository.findById(id);
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: "Ticket batch not found"
        });
      }
      const tickets = TicketRepository.findAll().filter(
        (ticket) => ticket.batch_id === id
      );
      res.json({
        success: true,
        message: "Ticket batch retrieved successfully",
        data: {
          batch,
          tickets
        }
      });
    } catch (error) {
      console.error("Get ticket batch error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
);
router$3.post(
  "/",
  requirePermission("create_batches"),
  async (req, res) => {
    try {
      const batchData = createBatchSchema.parse(req.body);
      const batch = TicketBatchRepository.create({
        country_code: batchData.country.toUpperCase(),
        airline_name: batchData.airline,
        flight_date: batchData.flightDate,
        flight_time: batchData.flightTime,
        buying_price: batchData.buyingPrice,
        quantity: batchData.quantity,
        agent_name: batchData.agentName,
        agent_contact: batchData.agentContact,
        agent_address: batchData.agentAddress,
        remarks: batchData.remarks,
        created_by: req.user.id
      });
      const createdTickets = [];
      for (let i = 1; i <= batchData.quantity; i++) {
        const airlineCode = batchData.airline === "Air Arabia" ? "G9" : batchData.airline === "Emirates" ? "EK" : batchData.airline === "Qatar Airways" ? "QR" : batchData.airline === "Saudi Airlines" ? "SV" : batchData.airline === "Flydubai" ? "FZ" : "XX";
        const flightNumber = `${airlineCode} ${Math.floor(Math.random() * 900) + 100}`;
        const sellingPrice = Math.floor(batchData.buyingPrice * 1.2);
        const ticket = TicketRepository.create({
          batch_id: batch.id,
          flight_number: flightNumber,
          status: "available",
          selling_price: sellingPrice,
          aircraft: batchData.airline === "Air Arabia" ? "Airbus A320" : batchData.airline === "Emirates" ? "Boeing 777" : batchData.airline === "Qatar Airways" ? "Boeing 787" : "Airbus A321",
          terminal: `Terminal ${Math.floor(Math.random() * 3) + 1}`,
          arrival_time: "18:45",
          // Default arrival time
          duration: "4h 15m",
          // Default duration
          available_seats: 1,
          total_seats: 1
        });
        createdTickets.push(ticket);
      }
      ActivityLogRepository.create({
        user_id: req.user.id,
        action: "create_ticket_batch",
        entity_type: "ticket_batch",
        entity_id: batch.id,
        details: JSON.stringify({
          airline: batchData.airline,
          country: batchData.country,
          quantity: batchData.quantity,
          buying_price: batchData.buyingPrice
        }),
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get("User-Agent")
      });
      res.status(201).json({
        success: true,
        message: "Ticket batch created successfully",
        data: {
          batch,
          ticketsCreated: createdTickets.length
        }
      });
    } catch (error) {
      console.error("Create ticket batch error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors
        });
      }
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
);
router$3.put(
  "/:id",
  requirePermission("edit_batches"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const batch = TicketBatchRepository.findById(id);
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: "Ticket batch not found"
        });
      }
      res.json({
        success: true,
        message: "Ticket batch updated successfully"
      });
    } catch (error) {
      console.error("Update ticket batch error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
);
router$3.delete(
  "/:id",
  requirePermission("delete_batches"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const batch = TicketBatchRepository.findById(id);
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: "Ticket batch not found"
        });
      }
      const tickets = TicketRepository.findAll().filter(
        (ticket) => ticket.batch_id === id
      );
      const hasSoldTickets = tickets.some((ticket) => ticket.status === "sold");
      if (hasSoldTickets) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete batch with sold tickets"
        });
      }
      res.json({
        success: true,
        message: "Ticket batch deleted successfully"
      });
    } catch (error) {
      console.error("Delete ticket batch error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
);
const router$2 = Router();
router$2.use(authenticate);
const createBookingSchema = z.object({
  ticketId: z.string().min(1, "Ticket ID is required"),
  agentInfo: z.object({
    name: z.string().min(1, "Agent name is required"),
    phone: z.string().optional(),
    email: z.string().email().optional()
  }),
  passengerInfo: z.object({
    name: z.string().min(1, "Passenger name is required"),
    passportNo: z.string().min(1, "Passport number is required"),
    phone: z.string().min(1, "Passenger phone is required"),
    paxCount: z.number().min(1, "Passenger count must be at least 1"),
    email: z.string().email().optional()
  }),
  sellingPrice: z.number().min(0, "Selling price must be positive"),
  paymentType: z.enum(["full", "partial"]),
  partialAmount: z.number().min(0).optional(),
  paymentMethod: z.string().default("cash"),
  paymentDetails: z.string().optional(),
  comments: z.string().optional()
});
router$2.get("/", async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    let bookings;
    if (hasPermission(req.user.role, "view_all_bookings")) {
      bookings = BookingRepository.findAllForFrontend();
    } else {
      const userBookings = BookingRepository.findByUser(req.user.id);
      bookings = userBookings.map((booking) => BookingRepository.transformForFrontend(booking));
    }
    if (status) {
      bookings = bookings.filter((booking) => booking.status === status);
    }
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedBookings = bookings.slice(startIndex, endIndex);
    res.json({
      success: true,
      message: "Bookings retrieved successfully",
      data: {
        bookings: paginatedBookings,
        total: bookings.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error("Get bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});
router$2.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const booking = BookingRepository.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }
    const canViewAllBookings = hasPermission(
      req.user.role,
      "view_all_bookings"
    );
    if (!canViewAllBookings && booking.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }
    const ticket = TicketRepository.findById(booking.ticket_id);
    res.json({
      success: true,
      message: "Booking retrieved successfully",
      data: {
        booking,
        ticket
      }
    });
  } catch (error) {
    console.error("Get booking error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});
router$2.post("/", async (req, res) => {
  try {
    const bookingData = createBookingSchema.parse(req.body);
    const ticket = TicketRepository.findById(bookingData.ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }
    if (ticket.status !== "available") {
      return res.status(400).json({
        success: false,
        message: "Ticket is not available for booking"
      });
    }
    if (bookingData.paymentType === "partial") {
      if (!bookingData.partialAmount || bookingData.partialAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Partial amount is required for partial payments"
        });
      }
      const totalAmount = bookingData.sellingPrice * bookingData.passengerInfo.paxCount;
      if (bookingData.partialAmount >= totalAmount) {
        return res.status(400).json({
          success: false,
          message: "Partial amount cannot be greater than or equal to total amount"
        });
      }
    }
    const booking = BookingRepository.create({
      ticket_id: bookingData.ticketId,
      agent_name: bookingData.agentInfo.name,
      agent_phone: bookingData.agentInfo.phone,
      agent_email: bookingData.agentInfo.email,
      passenger_name: bookingData.passengerInfo.name,
      passenger_passport: bookingData.passengerInfo.passportNo,
      passenger_phone: bookingData.passengerInfo.phone,
      passenger_email: bookingData.passengerInfo.email,
      pax_count: bookingData.passengerInfo.paxCount,
      selling_price: bookingData.sellingPrice,
      payment_type: bookingData.paymentType,
      partial_amount: bookingData.partialAmount,
      payment_method: bookingData.paymentMethod,
      payment_details: bookingData.paymentDetails,
      comments: bookingData.comments,
      status: bookingData.paymentType === "full" ? "confirmed" : "pending",
      created_by: req.user.id
    });
    const newTicketStatus = bookingData.paymentType === "full" ? "sold" : "locked";
    TicketRepository.updateStatus(
      bookingData.ticketId,
      newTicketStatus,
      bookingData.paymentType === "full" ? req.user.id : void 0
    );
    ActivityLogRepository.create({
      user_id: req.user.id,
      action: "create_booking",
      entity_type: "booking",
      entity_id: booking.id,
      details: JSON.stringify({
        ticket_id: bookingData.ticketId,
        passenger_name: bookingData.passengerInfo.name,
        payment_type: bookingData.paymentType,
        amount: bookingData.paymentType === "full" ? bookingData.sellingPrice * bookingData.passengerInfo.paxCount : bookingData.partialAmount
      }),
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get("User-Agent")
    });
    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: {
        booking,
        bookingId: booking.id
      }
    });
  } catch (error) {
    console.error("Create booking error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});
router$2.patch("/:id/status", async (req, res) => {
  try {
    console.log("Updating booking status:", { id: req.params.id, status: req.body.status });
    const { id } = req.params;
    const { status } = req.body;
    if (!["pending", "confirmed", "cancelled", "expired"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }
    console.log("Finding booking with ID:", id);
    const booking = BookingRepository.findById(id);
    if (!booking) {
      console.log("Booking not found:", id);
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }
    console.log("Found booking:", { id: booking.id, current_status: booking.status });
    const canViewAllBookings = hasPermission(
      req.user.role,
      "view_all_bookings"
    );
    if (!canViewAllBookings && booking.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }
    if (status === "confirmed" && !hasPermission(req.user.role, "confirm_sales")) {
      return res.status(403).json({
        success: false,
        message: "Permission required to confirm bookings"
      });
    }
    console.log("Attempting to update booking status:", { id, from: booking.status, to: status });
    let success;
    try {
      success = BookingRepository.updateStatus(id, status);
      console.log("Booking status update result:", success);
    } catch (error) {
      console.error("Error updating booking status:", error);
      return res.status(500).json({
        success: false,
        message: "Database error updating booking status"
      });
    }
    if (success) {
      let newTicketStatus = "available";
      try {
        if (status === "confirmed") {
          newTicketStatus = "sold";
          TicketRepository.updateStatus(
            booking.ticket_id,
            newTicketStatus,
            req.user.id
          );
        } else if (status === "cancelled" || status === "expired") {
          newTicketStatus = "available";
          TicketRepository.updateStatus(booking.ticket_id, newTicketStatus);
        }
      } catch (error) {
        console.error("Error updating ticket status:", error);
      }
      try {
        ActivityLogRepository.create({
          user_id: req.user.id,
          action: "update_booking_status",
          entity_type: "booking",
          entity_id: id,
          details: JSON.stringify({
            old_status: booking.status,
            new_status: status,
            ticket_status: newTicketStatus
          }),
          ip_address: req.ip || "127.0.0.1",
          user_agent: req.get("User-Agent") || "Unknown"
        });
      } catch (activityError) {
        console.error("Activity logging failed:", activityError);
      }
      res.json({
        success: true,
        message: "Booking status updated successfully"
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to update booking status"
      });
    }
  } catch (error) {
    console.error("Update booking status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});
router$2.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const booking = BookingRepository.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }
    const canViewAllBookings = hasPermission(
      req.user.role,
      "view_all_bookings"
    );
    if (!canViewAllBookings && booking.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }
    if (booking.status === "confirmed" && !hasPermission(req.user.role, "override_locks")) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel confirmed booking without override permission"
      });
    }
    BookingRepository.updateStatus(id, "cancelled");
    TicketRepository.updateStatus(booking.ticket_id, "available");
    ActivityLogRepository.create({
      user_id: req.user.id,
      action: "cancel_booking",
      entity_type: "booking",
      entity_id: id,
      details: JSON.stringify({
        reason: "manual_cancellation"
      }),
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get("User-Agent")
    });
    res.json({
      success: true,
      message: "Booking cancelled successfully"
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});
const router$1 = Router();
router$1.use(authenticate);
const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional(),
  phone: z.string().optional(),
  role: z.enum(["admin", "manager", "staff"]),
  status: z.enum(["active", "inactive"]).default("active")
});
const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(["admin", "manager", "staff"]).optional(),
  status: z.enum(["active", "inactive"]).optional()
});
const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Password confirmation is required")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});
router$1.get(
  "/",
  requirePermission("manage_users"),
  async (_req, res) => {
    try {
      const users = UserRepository.findAll();
      const safeUsers = users.map((user) => {
        const { password_hash, ...safeUser } = user;
        return safeUser;
      });
      res.json({
        success: true,
        message: "Users retrieved successfully",
        data: { users: safeUsers }
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
);
router$1.get(
  "/:id",
  requirePermission("manage_users"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const user = UserRepository.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      const { password_hash, ...safeUser } = user;
      res.json({
        success: true,
        message: "User retrieved successfully",
        data: { user: safeUser }
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
);
router$1.get("/me", async (_req, res) => {
  try {
    const user = UserRepository.findById(res.locals.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    const { password_hash, ...safeUser } = user;
    res.json({
      success: true,
      message: "User retrieved successfully",
      data: { user: safeUser }
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});
router$1.post(
  "/",
  requirePermission("manage_users"),
  async (req, res) => {
    try {
      const userData = createUserSchema.parse(req.body);
      const existingUser = UserRepository.findByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username already exists"
        });
      }
      const user = UserRepository.create({
        username: userData.username,
        password: userData.password,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        status: userData.status
      });
      ActivityLogRepository.create({
        user_id: req.user.id,
        action: "create_user",
        entity_type: "user",
        entity_id: user.id,
        details: JSON.stringify({
          username: userData.username,
          role: userData.role,
          created_by: req.user.name
        }),
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get("User-Agent")
      });
      const { password_hash, ...safeUser } = user;
      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: { user: safeUser }
      });
    } catch (error) {
      console.error("Create user error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors
        });
      }
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
);
router$1.put(
  "/:id",
  requirePermission("manage_users"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = updateUserSchema.parse(req.body);
      const user = UserRepository.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      if (id === req.user.id && updates.role && updates.role !== "admin") {
        return res.status(400).json({
          success: false,
          message: "Cannot change your own admin role"
        });
      }
      const updatedUser = UserRepository.update(id, updates);
      if (updatedUser) {
        ActivityLogRepository.create({
          user_id: req.user.id,
          action: "update_user",
          entity_type: "user",
          entity_id: id,
          details: JSON.stringify({
            updates,
            updated_by: req.user.name
          }),
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get("User-Agent")
        });
        const { password_hash, ...safeUser } = updatedUser;
        res.json({
          success: true,
          message: "User updated successfully",
          data: { user: safeUser }
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to update user"
        });
      }
    } catch (error) {
      console.error("Update user error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors
        });
      }
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
);
router$1.put("/profile/me", async (req, res) => {
  try {
    const updates = z.object({
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional()
    }).parse(req.body);
    const updatedUser = UserRepository.update(req.user.id, updates);
    if (updatedUser) {
      const { password_hash, ...safeUser } = updatedUser;
      res.json({
        success: true,
        message: "Profile updated successfully",
        data: { user: safeUser }
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to update profile"
      });
    }
  } catch (error) {
    console.error("Update profile error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});
router$1.put("/profile/password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = updatePasswordSchema.parse(
      req.body
    );
    const user = UserRepository.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    if (!UserRepository.verifyPassword(currentPassword, user.password_hash)) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }
    const bcrypt2 = require("bcryptjs");
    const newPasswordHash = bcrypt2.hashSync(newPassword, 10);
    UserRepository.update(req.user.id, { password_hash: newPasswordHash });
    ActivityLogRepository.create({
      user_id: req.user.id,
      action: "update_password",
      entity_type: "user",
      entity_id: req.user.id,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get("User-Agent")
    });
    res.json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (error) {
    console.error("Update password error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});
router$1.delete(
  "/:id",
  requirePermission("manage_users"),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete your own account"
        });
      }
      const user = UserRepository.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      const success = UserRepository.delete(id);
      if (success) {
        ActivityLogRepository.create({
          user_id: req.user.id,
          action: "delete_user",
          entity_type: "user",
          entity_id: id,
          details: JSON.stringify({
            deleted_username: user.username,
            deleted_by: req.user.name
          }),
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get("User-Agent")
        });
        res.json({
          success: true,
          message: "User deleted successfully"
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to delete user"
        });
      }
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
);
const router = Router();
router.use(authenticate);
router.use((_req, _res, next) => {
  console.log(`Settings route accessed: ${_req.method} ${_req.path}`);
  next();
});
router.get("/test", (_req, res) => {
  console.log("Test endpoint called successfully!");
  res.json({
    success: true,
    message: "Settings route test successful",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
const updateSettingsSchema = z.object({
  company_name: z.string().min(1).optional(),
  company_email: z.string().email().optional(),
  company_phone: z.string().optional(),
  company_address: z.string().optional(),
  default_currency: z.enum(["BDT", "USD", "EUR"]).optional(),
  timezone: z.string().optional(),
  language: z.enum(["en", "bn", "ar"]).optional(),
  auto_backup: z.boolean().optional(),
  email_notifications: z.boolean().optional(),
  sms_notifications: z.boolean().optional(),
  booking_timeout: z.number().min(1).max(48).optional()
});
router.get("/", async (req, res) => {
  try {
    const settingsRecord = SystemSettingsRepository.findAll();
    const settingsArray = Object.entries(settingsRecord).map(([key, value]) => ({
      key,
      value
    }));
    let filteredSettings = settingsArray;
    if (!req.user || !hasPermission(req.user.role, "system_settings")) {
      const allowedKeys = [
        "company_name",
        "company_email",
        "company_phone",
        "company_address",
        "default_currency",
        "timezone",
        "language"
      ];
      filteredSettings = settingsArray.filter(
        (setting) => allowedKeys.includes(setting.key)
      );
    }
    res.json({
      success: true,
      message: "System settings retrieved successfully",
      data: { settings: filteredSettings }
    });
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
router.get("/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const publicSettings = [
      "company_name",
      "default_currency",
      "timezone",
      "language",
      "booking_timeout"
    ];
    if (!publicSettings.includes(key) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }
    const value = SystemSettingsRepository.get(key);
    if (value === void 0) {
      return res.status(404).json({
        success: false,
        message: "Setting not found"
      });
    }
    res.json({
      success: true,
      message: "Setting retrieved successfully",
      data: { key, value }
    });
  } catch (error) {
    console.error("Get setting error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
router.put(
  "/",
  requirePermission("system_settings"),
  async (req, res) => {
    try {
      const updates = updateSettingsSchema.parse(req.body);
      const settingsToUpdate = {};
      for (const [key, value] of Object.entries(updates)) {
        if (value !== void 0) {
          settingsToUpdate[key] = typeof value === "boolean" ? value.toString() : value.toString();
        }
      }
      SystemSettingsRepository.setBatch(settingsToUpdate);
      ActivityLogRepository.create({
        user_id: req.user.id,
        action: "update_settings",
        entity_type: "system_settings",
        details: JSON.stringify({
          updates: settingsToUpdate,
          updated_by: req.user.name
        }),
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get("User-Agent")
      });
      res.json({
        success: true,
        message: "System settings updated successfully"
      });
    } catch (error) {
      console.error("Update settings error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors
        });
      }
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);
router.put(
  "/:key",
  requirePermission("system_settings"),
  async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      if (value === void 0 || value === null) {
        return res.status(400).json({
          success: false,
          message: "Value is required"
        });
      }
      const validSettings = [
        "company_name",
        "company_email",
        "company_phone",
        "company_address",
        "default_currency",
        "timezone",
        "language",
        "auto_backup",
        "email_notifications",
        "sms_notifications",
        "booking_timeout"
      ];
      if (!validSettings.includes(key)) {
        return res.status(400).json({
          success: false,
          message: "Invalid setting key"
        });
      }
      const stringValue = typeof value === "boolean" ? value.toString() : value.toString();
      SystemSettingsRepository.set(key, stringValue);
      ActivityLogRepository.create({
        user_id: req.user.id,
        action: "update_setting",
        entity_type: "system_settings",
        details: JSON.stringify({
          key,
          old_value: SystemSettingsRepository.get(key),
          new_value: stringValue,
          updated_by: req.user.name
        }),
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get("User-Agent")
      });
      res.json({
        success: true,
        message: "Setting updated successfully"
      });
    } catch (error) {
      console.error("Update setting error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);
router.get(
  "/export/data",
  requirePermission("system_settings"),
  async (req, res) => {
    try {
      const { format = "json" } = req.query;
      const exportData = {
        exported_at: (/* @__PURE__ */ new Date()).toISOString(),
        exported_by: req.user.name,
        version: "1.0",
        data: {
          settings: SystemSettingsRepository.findAll()
          // Add other data exports here
        }
      };
      if (format === "csv") {
        const csv = Object.entries(exportData.data.settings).map(([key, value]) => `${key},${value}`).join("\n");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="bd-ticketpro-export.csv"'
        );
        res.send(`key,value
${csv}`);
      } else {
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="bd-ticketpro-export.json"'
        );
        res.json(exportData);
      }
      ActivityLogRepository.create({
        user_id: req.user.id,
        action: "export_data",
        entity_type: "system",
        details: JSON.stringify({
          format,
          exported_by: req.user.name
        }),
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get("User-Agent")
      });
    } catch (error) {
      console.error("Export data error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);
router.get(
  "/logs/activity",
  requirePermission("system_settings"),
  async (req, res) => {
    try {
      const { limit = 100, user_id } = req.query;
      let logs;
      if (user_id) {
        logs = ActivityLogRepository.findByUser(
          user_id,
          parseInt(limit)
        );
      } else {
        logs = ActivityLogRepository.findRecent(parseInt(limit));
      }
      res.json({
        success: true,
        message: "Activity logs retrieved successfully",
        data: {
          logs,
          total: logs.length
        }
      });
    } catch (error) {
      console.error("Get activity logs error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);
router.get(
  "/system-info",
  async (_req, res) => {
    console.log("System info route called");
    try {
      console.log("Building system info...");
      const systemInfo = {
        version: "1.0.0",
        uptime: formatUptime(os.uptime()),
        memory_usage: formatBytes(process.memoryUsage().heapUsed),
        cpu_usage: `${os.loadavg()[0].toFixed(2)}%`,
        disk_usage: await getDiskUsage(),
        active_sessions: 1,
        // You can implement session tracking
        total_users: 3,
        // Get from database
        total_bookings: 0,
        // Get from database
        database_size: await getDatabaseSize(),
        last_backup: getLastBackupTime()
      };
      console.log("System info built successfully:", systemInfo);
      res.json({
        success: true,
        message: "System information retrieved successfully",
        data: systemInfo
      });
    } catch (error) {
      console.error("Get system info error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);
router.post(
  "/backup",
  requirePermission("system_settings"),
  async (req, res) => {
    try {
      const backupDir = path.join(process.cwd(), "backups");
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
      const backupFile = path.join(backupDir, `backup-${timestamp}.db`);
      const dbPath2 = path.join(process.cwd(), "bd-ticketpro.db");
      if (fs.existsSync(dbPath2)) {
        fs.copyFileSync(dbPath2, backupFile);
        ActivityLogRepository.create({
          user_id: req.user.id,
          action: "create_backup",
          entity_type: "system",
          entity_id: "backup",
          details: `Database backup created: ${backupFile}`,
          ip_address: req.ip,
          user_agent: req.get("User-Agent") || ""
        });
        res.json({
          success: true,
          message: "Backup created successfully",
          data: {
            backup_file: backupFile,
            timestamp,
            size: fs.statSync(backupFile).size
          }
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Database file not found"
        });
      }
    } catch (error) {
      console.error("Create backup error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create backup",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);
function formatUptime(uptime) {
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor(uptime % 86400 / 3600);
  const minutes = Math.floor(uptime % 3600 / 60);
  return `${days}d ${hours}h ${minutes}m`;
}
function formatBytes(bytes) {
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
}
async function getDiskUsage() {
  try {
    return "Available";
  } catch {
    return "Unknown";
  }
}
async function getDatabaseSize() {
  try {
    const dbPath2 = path.join(process.cwd(), "bd-ticketpro.db");
    if (fs.existsSync(dbPath2)) {
      const stats = fs.statSync(dbPath2);
      return formatBytes(stats.size);
    }
    return "Unknown";
  } catch {
    return "Unknown";
  }
}
function getLastBackupTime() {
  try {
    const backupDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) {
      return "Never";
    }
    const files = fs.readdirSync(backupDir).filter(
      (file) => file.startsWith("backup-") && file.endsWith(".db")
    ).map((file) => {
      const filePath = path.join(backupDir, file);
      return {
        file,
        time: fs.statSync(filePath).mtime
      };
    }).sort((a, b) => b.time - a.time);
    if (files.length > 0) {
      return files[0].time.toLocaleString();
    }
    return "Never";
  } catch {
    return "Unknown";
  }
}
function createServer() {
  const app2 = express__default();
  try {
    initializeDatabase();
    seedDatabase();
    console.log("Database initialized and seeded successfully");
  } catch (error) {
    console.error("Database initialization error:", error);
  }
  app2.use(
    cors({
      origin: ["https://musafirdesk.com", "http://localhost:8080", /\.vercel\.app$/],
      // Development origins
      credentials: true
    })
  );
  app2.use(express__default.json({ limit: "10mb" }));
  app2.use(express__default.urlencoded({ extended: true, limit: "10mb" }));
  app2.get("/api/ping", (_req, res) => {
    res.json({
      message: "BD TicketPro API Server",
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      version: "1.0.0"
    });
  });
  app2.use("/api/auth", router$5);
  app2.use("/api/tickets", router$4);
  app2.use("/api/ticket-batches", router$3);
  app2.use("/api/bookings", router$2);
  app2.use("/api/users", router$1);
  app2.use("/api/settings", router);
  app2.use(
    (err, _req, _res, _next) => {
      console.error("Global error handler:", err);
      _res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error",
        ...false
      });
    }
  );
  app2.use("/api/*", (req, res) => {
    res.status(404).json({
      success: false,
      message: "API endpoint not found",
      path: req.path
    });
  });
  return app2;
}
const app = createServer();
const port = process.env.PORT || 3e3;
const __dirname = import.meta.dirname;
const distPath = path__default.join(__dirname, "../spa");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path__default.join(distPath, "index.html"));
});
app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
//# sourceMappingURL=node-build.mjs.map
