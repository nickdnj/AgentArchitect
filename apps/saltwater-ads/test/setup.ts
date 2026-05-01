// bunfig.toml preloads this for all tests.
// Set SECRETS_PATH to a fixture-only file so tests never read data/secrets.env.

process.env.SECRETS_PATH = process.env.SECRETS_PATH ?? './test/fixtures/secrets.env';
process.env.DB_PATH = process.env.DB_PATH ?? ':memory:';
process.env.NODE_ENV = 'test';
// FFmpeg font path: tests assert command shape, never spawn real ffmpeg.
// Hardcode a fake path so font resolution doesn't depend on host OS.
process.env.CAPTION_FONT_PATH = process.env.CAPTION_FONT_PATH ?? '/tmp/fake.ttf';
