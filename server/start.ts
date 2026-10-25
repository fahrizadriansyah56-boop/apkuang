import 'dotenv/config';
import app, { initializeDatabase } from './index.js';

const port = Number(process.env.PORT || 4000);

const start = async () => {
  await initializeDatabase();
  app.listen(port, '0.0.0.0', () => {
    console.log(`KasPanitia API listening on port ${port}`);
  });
};

start().catch(error => {
  console.error('Failed to start KasPanitia API:', error);
  process.exitCode = 1;
});
