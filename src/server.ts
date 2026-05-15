import { createApp } from './app';
import { env } from './config/env';
import { startWorkers } from './workers';

const app = createApp();
startWorkers();

app.listen(env.PORT, () => {
  console.log(`Shiftlink API listening on port ${env.PORT}`);
});
