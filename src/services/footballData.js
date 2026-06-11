export async function fetchWorldCupFixtures({ forceRefresh = false } = {}) {
  const url = forceRefresh
    ? '/api/world-cup-fixtures?refresh=1'
    : '/api/world-cup-fixtures'
  const response = await fetch(url)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message ?? 'Erro ao buscar os jogos da Copa 2026.')
  }

  if (!Array.isArray(data.matches)) {
    throw new Error('O football-data.org retornou um formato inesperado.')
  }

  return data
}
