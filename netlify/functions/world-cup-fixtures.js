import { getWorldCupFixturesResponse } from '../../server/footballDataClient.js'

export async function handler(event) {
  const result = await getWorldCupFixturesResponse({
    forceRefresh: event.queryStringParameters?.refresh === '1',
  })

  return {
    statusCode: result.statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...result.headers,
    },
    body: JSON.stringify(result.body),
  }
}
