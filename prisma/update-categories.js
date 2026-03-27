const { Client } = require("pg");
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

  // Delete old categories (and any courses referencing them)
  await client.query(`DELETE FROM "Progress"`);
  await client.query(`DELETE FROM "Enrollment"`);
  await client.query(`DELETE FROM "Lesson"`);
  await client.query(`DELETE FROM "Section"`);
  await client.query(`DELETE FROM "Course"`);
  await client.query(`DELETE FROM "Category"`);
  console.log("✓ Cleared old categories and courses");

  const categories = [
    { name: "School of Business", slug: "school-of-business" },
    { name: "School of Humanities", slug: "school-of-humanities" },
    { name: "School of Education", slug: "school-of-education" },
    { name: "School of Natural Sciences", slug: "school-of-natural-sciences" },
    { name: "School of Law", slug: "school-of-law" },
    { name: "School of Agricultural Sciences", slug: "school-of-agricultural-sciences" },
    { name: "School of Veterinary Medicine", slug: "school-of-veterinary-medicine" },
  ];

  for (const cat of categories) {
    await client.query(
      `INSERT INTO "Category" (id, name, slug) VALUES ($1, $2, $3)`,
      [cuid(), cat.name, cat.slug]
    );
  }
  console.log("✓ New categories seeded");

  await client.end();
  console.log("✓ Done!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
