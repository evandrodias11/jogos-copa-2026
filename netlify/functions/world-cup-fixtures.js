import { getWorldCupFixturesResponse } from '../../server/footballDataClient.js'

export async function handler() {
  const result = await getWorldCupFixturesResponse()

  return {
    statusCode: result.statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...result.headers,
    },
    body: JSON.stringify(result.body),
  }
}
