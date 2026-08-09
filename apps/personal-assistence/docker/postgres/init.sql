-- App database (Drizzle / Next.js)
CREATE USER timetracker WITH PASSWORD 'timetracker';
CREATE DATABASE timetracker OWNER timetracker;
GRANT ALL PRIVILEGES ON DATABASE timetracker TO timetracker;
