-- App database (Drizzle / Next.js)
CREATE USER timetracker WITH PASSWORD 'timetracker';
CREATE DATABASE timetracker OWNER timetracker;
GRANT ALL PRIVILEGES ON DATABASE timetracker TO timetracker;

-- Evolution API database
CREATE USER evolution WITH PASSWORD 'evolution';
CREATE DATABASE evolution OWNER evolution;
GRANT ALL PRIVILEGES ON DATABASE evolution TO evolution;
