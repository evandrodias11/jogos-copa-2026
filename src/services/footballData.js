export async function fetchWorldCupFixtures() {
  const response = await fetch('/api/world-cup-fixtures')
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message ?? 'Erro ao buscar os jogos da Copa 2026.')
  }

  if (!Array.isArray(data.matches)) {
    throw new Error('O football-data.org retornou um formato inesperado.')
  }

  return data
}
