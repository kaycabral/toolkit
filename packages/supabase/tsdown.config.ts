import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    client: 'src/client.ts',
    server: 'src/server.ts',
    proxy: 'src/proxy.ts',
    routes: 'src/routes.ts',
    react: 'src/react.ts',
    local: 'src/local.ts',
  },
  platform: 'node',
  dts: true,
  exports: true,
  inputOptions: {
    onLog(level, log, handler) {
      if (log.code === 'MODULE_LEVEL_DIRECTIVE') return
      handler(level, log)
    },
  },
})
