const apiBaseUrl = 'https://api.football-data.org'
const defaultCacheMs = 1000 * 60 * 10

let fixturesCache = null

function getApiErrorMessage(data) {
  return data?.message ?? data?.error ?? null
}

function jsonResponse(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers,
    body,
  }
}

export async function getWorldCupFixturesResponse({ forceRefresh = false } = {}) {
  const apiToken = process.env.FOOTBALL_DATA_TOKEN
  const cacheMs = Number(process.env.API_CACHE_MS ?? defaultCacheMs)

  if (!apiToken) {
    return jsonResponse(500, {
      message:
        'Configure FOOTBALL_DATA_TOKEN no arquivo .env para carregar dados do football-data.org.',
    })
  }

  if (!forceRefresh && fixturesCache && Date.now() - fixturesCache.createdAt < cacheMs) {
    return jsonResponse(200, fixturesCache.payload, { 'x-cache': 'HIT' })
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
      return jsonResponse(apiResponse.status, {
        message: getApiErrorMessage(payload) ?? 'Erro ao consultar o football-data.org.',
      })
    }

    const apiError = getApiErrorMessage(payload)
    if (apiError) {
      return jsonResponse(400, { message: apiError })
    }

    fixturesCache = {
      createdAt: Date.now(),
      payload,
    }

    return jsonResponse(200, payload, { 'x-cache': 'MISS' })
  } catch (error) {
    return jsonResponse(502, {
      message: `Falha de comunicação com o football-data.org: ${error.message}`,
    })
  }
}
