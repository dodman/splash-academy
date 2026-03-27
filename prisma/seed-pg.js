const { Client } = require("pg");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

function cuid() {
  return "c" + crypto.randomBytes(12).toString("hex");
}

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Connected to PostgreSQL");

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

  for (const cat of categories) {
    await client.query(
      `INSERT INTO "Category" (id, name, slug) VALUES ($1, $2, $3) ON CONFLICT (slug) DO NOTHING`,
      [cuid(), cat.name, cat.slug]
    );
  }
  console.log("✓ Categories seeded");

  // Seed users
  const now = new Date();

  const adminHash = bcrypt.hashSync("admin123", 10);
  await client.query(
    `INSERT INTO "User" (id, name, email, "passwordHash", role, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (email) DO NOTHING`,
    [cuid(), "Admin", "admin@splashacademy.com", adminHash, "ADMIN", now, now]
  );
  console.log("✓ Admin user created (admin@splashacademy.com / admin123)");

  const instructorHash = bcrypt.hashSync("instructor123", 10);
  await client.query(
    `INSERT INTO "User" (id, name, email, "passwordHash", role, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (email) DO NOTHING`,
    [cuid(), "Jane Instructor", "instructor@splashacademy.com", instructorHash, "INSTRUCTOR", now, now]
  );
  console.log("✓ Demo instructor created (instructor@splashacademy.com / instructor123)");

  const studentHash = bcrypt.hashSync("student123", 10);
  await client.query(
    `INSERT INTO "User" (id, name, email, "passwordHash", role, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (email) DO NOTHING`,
    [cuid(), "John Student", "student@splashacademy.com", studentHash, "STUDENT", now, now]
  );
  console.log("✓ Demo student created (student@splashacademy.com / student123)");

  await client.end();
  console.log("\n✓ Database seeded successfully!");
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
