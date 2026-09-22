import { app } from './app.js';
import { config } from './config.js';

app.listen(config.port, () => console.info(`API запущен на порту ${config.port}`));
