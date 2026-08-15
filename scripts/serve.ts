/** `npm start` — serve the repo root as a static site for local viewing. */
import { startServer, ROOT } from './static-server.ts';

const port = Number(process.env.PORT ?? 8080);
const { url } = await startServer(port);

console.log(`webmapx-demo serving ${ROOT}`);
console.log(`  ${url}/`);
console.log('Press Ctrl+C to stop.');
