SELECT 'CREATE DATABASE appdb_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'appdb_test')\gexec

GRANT ALL PRIVILEGES ON DATABASE appdb_test TO appuser;
