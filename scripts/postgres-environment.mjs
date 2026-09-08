export function postgresEnvironment(raw) {
  if (!raw) throw new Error("DATABASE_URL is required.");
  const url = new URL(raw);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error("Expected a PostgreSQL URL.");
  const env = { ...process.env, PGHOST: url.hostname, PGPORT: url.port || "5432", PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password), PGDATABASE: decodeURIComponent(url.pathname.slice(1)) };
  if (url.searchParams.has("sslmode")) env.PGSSLMODE = url.searchParams.get("sslmode");
  return env;
}
