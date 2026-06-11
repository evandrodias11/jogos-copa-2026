import 'dotenv/config'
import express from 'express'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getWorldCupFixturesResponse } from './footballDataClient.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const port = Number(process.env.PORT ?? 5173)

const app = express()

app.get('/api/world-cup-fixtures', async (request, response) => {
  const result = await getWorldCupFixturesResponse({
    forceRefresh: request.query.refresh === '1',
  })

  for (const [key, value] of Object.entries(result.headers)) {
    response.setHeader(key, value)
  }

  response.status(result.statusCode).json(result.body)
})

if (process.env.NODE_ENV === 'production') {
  const distDir = resolve(rootDir, 'dist')

  app.use(express.static(distDir))
  app.get(/.*/, (_request, response) => {
    response.sendFile(resolve(distDir, 'index.html'))
  })
} else {
  const { createServer: createViteServer } = await import('vite')
  const vite = await createViteServer({
    root: rootDir,
    server: { middlewareMode: true },
    appType: 'spa',
  })

  app.use(vite.middlewares)
}

app.listen(port, () => {
  console.log(`Calendário Copa 2026 em http://localhost:${port}`)
})
