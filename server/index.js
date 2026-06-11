import 'dotenv/config'
import express from 'express'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const port = Number(process.env.PORT ?? 5173)
const apiToken = process.env.FOOTBALL_DATA_TOKEN
const apiBaseUrl = 'https://api.football-data.org'
const cacheMs = Number(process.env.API_CACHE_MS ?? 1000 * 60 * 10)

const app = express()
let fixturesCache = null

function getApiErrorMessage(data) {
  return data?.message ?? data?.error ?? null
}

app.get('/api/world-cup-fixtures', async (_request, response) => {
  if (!apiToken) {
    response.status(500).json({
      message:
        'Configure FOOTBALL_DATA_TOKEN no arquivo .env para carregar dados do football-data.org.',
    })
    return
  }

  if (fixturesCache && Date.now() - fixturesCache.createdAt < cacheMs) {
    response.setHeader('x-cache', 'HIT')
    response.json(fixturesCache.payload)
    return
  }

  const url = new URL('/v4/competitions/WC/matches', apiBaseUrl)
  url.searchParams.set('season', '2026')

  try {
    const apiResponse = await fetch(url, {
      headers: {
        'X-Auth-Token': apiToken,
        Accept: 'application/json',
      },
    })

    const payload = await apiResponse.json()

    if (!apiResponse.ok) {
      response.status(apiResponse.status).json({
        message: getApiErrorMessage(payload) ?? 'Erro ao consultar o football-data.org.',
      })
      return
    }

    const apiError = getApiErrorMessage(payload)
    if (apiError) {
      response.status(400).json({ message: apiError })
      return
    }

    fixturesCache = {
      createdAt: Date.now(),
      payload,
    }

    response.setHeader('x-cache', 'MISS')
    response.json(payload)
  } catch (error) {
    response.status(502).json({
      message: `Falha de comunicação com o football-data.org: ${error.message}`,
    })
  }
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
