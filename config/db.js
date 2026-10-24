const { Pool } = require("pg");

let pool;

function getPool() {
  if (!pool) {
    let connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is missing in .env");
    }
    // Prevent pg v8.x -> v9.x deprecation warning
    if (connectionString.includes("sslmode=require")) {
      connectionString = connectionString.replace("sslmode=require", "sslmode=verify-full");
    }
    pool = new Pool({
      connectionString,
      // Neon requires SSL. rejectUnauthorized:false is fine for Neon's managed certs.
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function connectDB() {
  const p = getPool();
  await p.query("SELECT 1"); // fail fast if the connection string is wrong
  console.log("[db] Connected to Neon/Postgres");
}

module.exports = { connectDB, getPool };
