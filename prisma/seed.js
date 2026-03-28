const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const path = require("path");

const dbPath = path.join(__dirname, "..", "dev.db");
const db = new Database(dbPath);

function cuid() {
  return "c" + crypto.randomBytes(12).toString("hex");
}

// Seed categories
const categories = [
  { name: "School of Business", slug: "school-of-business" },
  { name: "School of Humanities", slug: "school-of-humanities" },
  { name: "School of Education", slug: "school-of-education" },
  { name: "School of Natural Sciences", slug: "school-of-natural-sciences" },
  { name: "School of Law", slug: "school-of-law" },
  { name: "School of Agricultural Sciences", slug: "school-of-agricultural-sciences" },
  { name: "School of Veterinary Medicine", slug: "school-of-veterinary-medicine" },
];

const insertCat = db.prepare(
  "INSERT OR IGNORE INTO Category (id, name, slug) VALUES (?, ?, ?)"
);

for (const cat of categories) {
  insertCat.run(cuid(), cat.name, cat.slug);
}
console.log("✓ Categories seeded");

// Seed users
const insertUser = db.prepare(
  "INSERT OR IGNORE INTO User (id, name, email, passwordHash, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)"
);

const now = new Date().toISOString();

const adminHash = bcrypt.hashSync("admin123", 10);
insertUser.run(cuid(), "Admin", "admin@splashacademy.com", adminHash, "ADMIN", now, now);
console.log("✓ Admin user created (admin@splashacademy.com / admin123)");

const instructorHash = bcrypt.hashSync("instructor123", 10);
insertUser.run(cuid(), "Jane Instructor", "instructor@splashacademy.com", instructorHash, "INSTRUCTOR", now, now);
console.log("✓ Demo instructor created (instructor@splashacademy.com / instructor123)");

const studentHash = bcrypt.hashSync("student123", 10);
insertUser.run(cuid(), "John Student", "student@splashacademy.com", studentHash, "STUDENT", now, now);
console.log("✓ Demo student created (student@splashacademy.com / student123)");

db.close();
console.log("\n✓ Database seeded successfully!");
