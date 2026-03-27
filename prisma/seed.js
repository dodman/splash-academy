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
  { name: "Web Development", slug: "web-development" },
  { name: "Mobile Development", slug: "mobile-development" },
  { name: "Data Science", slug: "data-science" },
  { name: "Design", slug: "design" },
  { name: "Business", slug: "business" },
  { name: "Marketing", slug: "marketing" },
  { name: "Photography", slug: "photography" },
  { name: "Music", slug: "music" },
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
