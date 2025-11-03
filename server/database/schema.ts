import Database from "better-sqlite3";
import { join } from "path";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const dbPath = join(process.cwd(), "bd-ticketpro.db");
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Create tables
export function initializeDatabase() {
  // Users table
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

  // Countries table
  db.exec(`
    CREATE TABLE IF NOT EXISTS countries (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      flag TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Airlines table
  db.exec(`
    CREATE TABLE IF NOT EXISTS airlines (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      code TEXT UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Ticket batches table
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

  // Tickets table
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

  // Bookings table
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

  // System settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Activity logs table
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

  // Create indexes for better performance
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

// Seed initial data
export function seedDatabase() {
  try {
    // Check if data already exists
    const userCount = db
      .prepare("SELECT COUNT(*) as count FROM users")
      .get() as { count: number };
    if (userCount.count > 0) {
      console.log("Database already seeded");
      return;
    }

    // Insert default countries
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
      ["LBN", "Lebanon", "🇱🇧"],
    ];

    for (const country of countries) {
      insertCountry.run(...country);
    }

    // Insert default airlines
    const insertAirline = db.prepare(`
      INSERT INTO airlines (id, name, code) VALUES (?, ?, ?)
    `);

    const airlines = [
      [uuidv4(), "Air Arabia", "G9"],
      [uuidv4(), "Emirates", "EK"],
      [uuidv4(), "Qatar Airways", "QR"],
      [uuidv4(), "Saudi Airlines", "SV"],
      [uuidv4(), "Flydubai", "FZ"],
      [uuidv4(), "Kuwait Airways", "KU"],
      [uuidv4(), "Oman Air", "WY"],
      [uuidv4(), "Gulf Air", "GF"],
    ];

    for (const airline of airlines) {
      insertAirline.run(...airline);
    }

    // Create default users
    const insertUser = db.prepare(`
      INSERT INTO users (id, username, password_hash, name, email, phone, role, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const defaultUsers = [
      {
        id: uuidv4(),
        username: "admin",
        password: "admin123",
        name: "Admin User",
        email: "admin@bdticketpro.com",
        phone: "+8801234567890",
        role: "admin",
      },
      {
        id: uuidv4(),
        username: "manager",
        password: "manager123",
        name: "Manager User",
        email: "manager@bdticketpro.com",
        phone: "+8801234567891",
        role: "manager",
      },
      {
        id: uuidv4(),
        username: "staff",
        password: "staff123",
        name: "Staff User",
        email: "staff@bdticketpro.com",
        phone: "+8801234567892",
        role: "staff",
      },
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
        "active", // Explicitly set status to active
      );
    }

    // Insert default system settings
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
      ["booking_timeout", "24"],
    ];

    for (const setting of settings) {
      insertSetting.run(...setting);
    }

    // Only seed sample data in development environment
    if (process.env.NODE_ENV !== "production") {
      // Create sample ticket batches and tickets
      const adminUser = db
        .prepare("SELECT id FROM users WHERE role = ? LIMIT 1")
        .get("admin") as { id: string };

      const insertBatch = db.prepare(`
        INSERT INTO ticket_batches (id, country_code, airline_name, flight_date, flight_time, buying_price, quantity, agent_name, agent_contact, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertTicket = db.prepare(`
        INSERT INTO tickets (id, batch_id, flight_number, selling_price, aircraft, terminal, arrival_time, duration, available_seats, total_seats)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // Sample data
      const sampleBatches = [
        {
          id: uuidv4(),
          countryCode: "KSA",
          airline: "Air Arabia",
          flightDate: "2024-12-25",
          flightTime: "14:30",
          buyingPrice: 18000,
          quantity: 20,
          agentName: "Ahmed Travel",
          agentContact: "+8801234567890",
        },
        {
          id: uuidv4(),
          countryCode: "UAE",
          airline: "Emirates",
          flightDate: "2024-12-26",
          flightTime: "09:15",
          buyingPrice: 38000,
          quantity: 15,
          agentName: "Gulf Air Agency",
          agentContact: "+8801987654321",
        },
        {
          id: uuidv4(),
          countryCode: "QAT",
          airline: "Qatar Airways",
          flightDate: "2024-12-27",
          flightTime: "20:10",
          buyingPrice: 44000,
          quantity: 10,
          agentName: "Royal Travel",
          agentContact: "+8801555666777",
        },
      ];

      for (const batch of sampleBatches) {
        insertBatch.run(
          batch.id,
          batch.countryCode,
          batch.airline,
          batch.flightDate,
          batch.flightTime,
          batch.buyingPrice,
          batch.quantity,
          batch.agentName,
          batch.agentContact,
          adminUser.id,
        );

        // Create individual tickets for this batch
        for (let i = 1; i <= batch.quantity; i++) {
          const ticketId = uuidv4();
          const flightNumber = `${batch.airline === "Air Arabia" ? "G9" : batch.airline === "Emirates" ? "EK" : "QR"} ${Math.floor(Math.random() * 900) + 100}`;
          const sellingPrice = Math.floor(batch.buyingPrice * 1.2); // 20% markup

          insertTicket.run(
            ticketId,
            batch.id,
            flightNumber,
            sellingPrice,
            batch.airline === "Air Arabia"
              ? "Airbus A320"
              : batch.airline === "Emirates"
                ? "Boeing 777"
                : "Boeing 787",
            `Terminal ${Math.floor(Math.random() * 3) + 1}`,
            "18:45", // Sample arrival time
            "4h 15m", // Sample duration
            1, // Available seats for this ticket
            1, // Total seats for this ticket
          );
        }
      }

      // Add sample bookings using correct schema
      const insertBooking = db.prepare(`
        INSERT INTO bookings (
          id, ticket_id, agent_name, agent_phone, agent_email,
          passenger_name, passenger_passport, passenger_phone, passenger_email, pax_count,
          selling_price, payment_type, payment_method, status, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // Get first few tickets to create bookings for
      const sampleTickets = db.prepare("SELECT id FROM tickets LIMIT 5").all();

      const sampleBookings = [
        {
          id: uuidv4(),
          ticketId: sampleTickets[0]?.id,
          agentName: "Rahman Travel Agency",
          agentPhone: "+8801712345678",
          agentEmail: "rahman@travelagency.com",
          passengerName: "Mohammed Abdul Rahman",
          passengerPassport: "EB1234567",
          passengerPhone: "+8801987654321",
          passengerEmail: "mohammed@email.com",
          paxCount: 1,
          sellingPrice: 22000,
          paymentType: "partial",
          paymentMethod: "bank_transfer",
          status: "pending",
        },
        {
          id: uuidv4(),
          ticketId: sampleTickets[1]?.id,
          agentName: "Dhaka Express Travel",
          agentPhone: "+8801555777888",
          agentEmail: "info@dhakaexpress.com",
          passengerName: "Fatima Begum",
          passengerPassport: "EB2345678",
          passengerPhone: "+8801666888999",
          passengerEmail: "fatima@email.com",
          paxCount: 1,
          sellingPrice: 45600,
          paymentType: "full",
          paymentMethod: "cash",
          status: "confirmed",
        },
        {
          id: uuidv4(),
          ticketId: sampleTickets[2]?.id,
          agentName: "Golden Wings Travel",
          agentPhone: "+8801888999000",
          agentEmail: "contact@goldenwings.com",
          passengerName: "Ahmed Hassan",
          passengerPassport: "EB3456789",
          passengerPhone: "+8801444555666",
          passengerEmail: "ahmed@email.com",
          paxCount: 1,
          sellingPrice: 52800,
          paymentType: "full",
          paymentMethod: "bkash",
          status: "pending",
        },
      ];

      for (const booking of sampleBookings) {
        if (booking.ticketId) {
          const now = new Date().toISOString();
          insertBooking.run(
            booking.id,
            booking.ticketId,
            booking.agentName,
            booking.agentPhone,
            booking.agentEmail,
            booking.passengerName,
            booking.passengerPassport,
            booking.passengerPhone,
            booking.passengerEmail,
            booking.paxCount,
            booking.sellingPrice,
            booking.paymentType,
            booking.paymentMethod,
            booking.status,
            adminUser.id,
            now,
            now,
          );
        }
      }

      console.log("Database seeded successfully with sample data");
    } else {
      console.log("Production environment: skipping sample data seeding");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// Helper function to execute database operations
export function executeTransaction(operations: () => void) {
  const transaction = db.transaction(operations);
  return transaction();
}
