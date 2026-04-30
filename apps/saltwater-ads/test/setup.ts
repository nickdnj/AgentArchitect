// bunfig.toml preloads this for all tests.
// Set SECRETS_PATH to a fixture-only file so tests never read data/secrets.env.

process.env.SECRETS_PATH = process.env.SECRETS_PATH ?? './test/fixtures/secrets.env';
process.env.DB_PATH = process.env.DB_PATH ?? ':memory:';
process.env.NODE_ENV = 'test';
