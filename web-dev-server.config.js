import { esbuildPlugin } from '@web/dev-server-esbuild';
import { legacyPlugin } from '@web/dev-server-legacy';

const mode = process.env.MODE || 'dev';
if (!['dev', 'prod'].includes(mode)) {
  throw new Error(`MODE must be "dev" or "prod", was "${mode}"`);
}

const isDev = mode === 'dev';

export default {
  nodeResolve: { exportConditions: isDev ? ['development'] : [] },
  appIndex: 'dev/index.html',
  preserveSymlinks: true,
  rootDir: isDev ? '' : 'docs',
  plugins: [
    esbuildPlugin({
      ts: true,
      target: 'auto',
    }),
    legacyPlugin({
      polyfills: {
        // Manually imported in index.html file
        webcomponents: false,
      },
    }),
  ],
};
