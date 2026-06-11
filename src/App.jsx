import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CalendarDays,
  Clock,
  Filter,
  RefreshCw,
  Search,
  Trophy,
} from 'lucide-react'
import './App.css'
import { fetchWorldCupFixtures } from './services/footballData'

const BRAZIL_TIME_ZONE = 'America/Sao_Paulo'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: BRAZIL_TIME_ZONE,
})

const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  timeZone: BRAZIL_TIME_ZONE,
})

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: BRAZIL_TIME_ZONE,
})

const stageLabels = {
  GROUP_STAGE: 'Fase de grupos',
  LAST_32: 'Rodada de 32',
  ROUND_OF_32: 'Rodada de 32',
  LAST_16: 'Oitavas de final',
  ROUND_OF_16: 'Oitavas de final',
  QUARTER_FINALS: 'Quartas de final',
  SEMI_FINALS: 'Semifinais',
  THIRD_PLACE: 'Disputa de 3º lugar',
  FINAL: 'Final',
}

const statusLabels = {
  TIMED: 'Agendado',
  SCHEDULED: 'Agendado',
  IN_PLAY: 'Ao vivo',
  LIVE: 'Ao vivo',
  PAUSED: 'Intervalo',
  FINISHED: 'Encerrado',
  POSTPONED: 'Adiado',
  SUSPENDED: 'Suspenso',
  CANCELLED: 'Cancelado',
  AWARDED: 'Resultado atribuído',
}

const countryNamePtBrByTla = {
  ALG: 'Argélia',
  ARG: 'Argentina',
  AUS: 'Austrália',
  AUT: 'Áustria',
  BEL: 'Bélgica',
  BIH: 'Bósnia e Herzegovina',
  BRA: 'Brasil',
  CAN: 'Canadá',
  CIV: 'Costa do Marfim',
  COD: 'RD Congo',
  COL: 'Colômbia',
  CPV: 'Cabo Verde',
  CRO: 'Croácia',
  CUR: 'Curaçao',
  CZE: 'Tchéquia',
  ECU: 'Equador',
  EGY: 'Egito',
  ENG: 'Inglaterra',
  ESP: 'Espanha',
  FRA: 'França',
  GER: 'Alemanha',
  GHA: 'Gana',
  HAI: 'Haiti',
  IRN: 'Irã',
  IRQ: 'Iraque',
  JOR: 'Jordânia',
  JPN: 'Japão',
  KOR: 'Coreia do Sul',
  KSA: 'Arábia Saudita',
  MAR: 'Marrocos',
  MEX: 'México',
  NED: 'Países Baixos',
  NOR: 'Noruega',
  NZL: 'Nova Zelândia',
  PAN: 'Panamá',
  PAR: 'Paraguai',
  POR: 'Portugal',
  QAT: 'Catar',
  RSA: 'África do Sul',
  SCO: 'Escócia',
  SEN: 'Senegal',
  SUI: 'Suíça',
  SWE: 'Suécia',
  TUN: 'Tunísia',
  TUR: 'Turquia',
  URY: 'Uruguai',
  USA: 'Estados Unidos',
  UZB: 'Uzbequistão',
}

function translateRound(round) {
  if (!round) return 'Rodada a definir'

  return round
}

function translateGroup(group) {
  if (!group) return ''

  const normalized = group.replaceAll('_', ' ')
  const match = normalized.match(/GROUP\s+([A-Z])/i)

  if (match) return `Grupo ${match[1].toUpperCase()}`

  return normalized
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .replace('Group', 'Grupo')
}

function buildRoundLabel(match) {
  const stage = stageLabels[match.stage] ?? match.stage?.replaceAll('_', ' ')
  const group = translateGroup(match.group)

  if (match.stage === 'GROUP_STAGE') {
    return [stage, group, match.matchday ? `Rodada ${match.matchday}` : null]
      .filter(Boolean)
      .join(' - ')
  }

  return [stage, group].filter(Boolean).join(' - ') || 'Rodada a definir'
}

function formatDateKey(value) {
  const date = new Date(value)
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: BRAZIL_TIME_ZONE,
  }).format(date)
}

function normalizeTeam(team) {
  const tla = team?.tla
  const originalName = team?.shortName ?? team?.name

  return {
    id: team?.id,
    name: countryNamePtBrByTla[tla] ?? originalName,
    originalName,
    tla,
    logo: team?.crest,
  }
}

function normalizeFixture(match) {
  return {
    id: match.id,
    date: match.utcDate,
    round: buildRoundLabel(match),
    status: match.status,
    venue: { name: match.venue },
    home: normalizeTeam(match.homeTeam),
    away: normalizeTeam(match.awayTeam),
    goals: {
      home: match.score?.fullTime?.home,
      away: match.score?.fullTime?.away,
    },
    score: match.score ?? {},
    winner: match.score?.winner,
  }
}

function groupFixturesByDate(fixtures) {
  return fixtures.reduce((groups, fixture) => {
    const key = formatDateKey(fixture.date)

    if (!groups[key]) {
      groups[key] = []
    }

    groups[key].push(fixture)
    return groups
  }, {})
}

function sortByDate(a, b) {
  return new Date(a.date).getTime() - new Date(b.date).getTime()
}

function getScore(fixture) {
  if (fixture.goals.home === null || fixture.goals.home === undefined) {
    return null
  }

  return `${fixture.goals.home} x ${fixture.goals.away}`
}

function normalizeSearchText(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function getWinnerSide(fixture) {
  if (fixture.status !== 'FINISHED') return null

  if (fixture.winner === 'HOME_TEAM') return 'home'
  if (fixture.winner === 'AWAY_TEAM') return 'away'
  if (fixture.winner === 'DRAW') return 'draw'

  return null
}

function getStatusTone(status) {
  if (['IN_PLAY', 'LIVE'].includes(status)) return 'live'
  if (status === 'PAUSED') return 'paused'
  if (status === 'FINISHED') return 'finished'
  if (['POSTPONED', 'SUSPENDED', 'CANCELLED'].includes(status)) return 'warning'

  return 'scheduled'
}

function getStatusLabel(status) {
  return statusLabels[status] ?? 'Status indisponível'
}

function hasTeamMatch(fixture, query) {
  if (!query) return true

  const term = normalizeSearchText(query)
  return [
    fixture.home.name,
    fixture.home.originalName,
    fixture.home.tla,
    fixture.away.name,
    fixture.away.originalName,
    fixture.away.tla,
    fixture.round,
    fixture.venue.name,
  ]
    .filter(Boolean)
    .some((value) => normalizeSearchText(value).includes(term))
}

function EmptyState({ hasError }) {
  return (
    <div className="empty-state">
      {hasError ? <AlertCircle size={28} /> : <CalendarDays size={28} />}
      <h2>{hasError ? 'Não foi possível carregar os jogos' : 'Nenhum jogo encontrado'}</h2>
      <p>
        {hasError
          ? 'Confira o token do football-data.org e tente atualizar a lista.'
          : 'Ajuste os filtros para visualizar outras partidas da Copa.'}
      </p>
    </div>
  )
}

function TeamBadge({ team, side, isWinner }) {
  return (
    <div className={`team team-${side}${isWinner ? ' team-winner' : ''}`}>
      {team.logo ? (
        <img
          src={team.logo}
          alt={`Bandeira de ${team.name ?? 'seleção a definir'}`}
          loading="lazy"
        />
      ) : (
        <span className="flag-placeholder" aria-hidden="true">
          --
        </span>
      )}
      <span>{team.name ?? 'A definir'}</span>
      {isWinner && <strong className="winner-pill">Vencedor</strong>}
    </div>
  )
}

function FixtureCard({ fixture }) {
  const score = getScore(fixture)
  const winnerSide = getWinnerSide(fixture)

  return (
    <article className={`fixture-card${winnerSide ? ' fixture-finished' : ''}`}>
      <div className="fixture-time">
        <span className="time">{timeFormatter.format(new Date(fixture.date))}</span>
        <span className="timezone">horário de Brasília</span>
      </div>

      <div className="fixture-main">
        <div className="fixture-header">
          <div className="fixture-round">{translateRound(fixture.round)}</div>
          <span className={`status-pill status-${getStatusTone(fixture.status)}`}>
            {getStatusLabel(fixture.status)}
          </span>
        </div>
        <div className="teams-row">
          <TeamBadge
            team={fixture.home}
            side="home"
            isWinner={winnerSide === 'home'}
          />
          <div className={`versus${winnerSide === 'draw' ? ' versus-draw' : ''}`}>
            {score ?? 'x'}
            {winnerSide === 'draw' && <span>Empate</span>}
          </div>
          <TeamBadge
            team={fixture.away}
            side="away"
            isWinner={winnerSide === 'away'}
          />
        </div>
      </div>
    </article>
  )
}

function App() {
  const [fixtures, setFixtures] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [selectedRound, setSelectedRound] = useState('todos')
  const [selectedDate, setSelectedDate] = useState('todos')
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  async function loadFixtures({ silent = false } = {}) {
    if (!silent) {
      setIsLoading(true)
    }

    setError('')

    try {
      const data = await fetchWorldCupFixtures({ forceRefresh: !silent })
      setFixtures(data.matches.map(normalizeFixture).sort(sortByDate))
      setCurrentTime(Date.now())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let didCancel = false

    fetchWorldCupFixtures()
      .then((data) => {
        if (didCancel) return
        setFixtures(data.matches.map(normalizeFixture).sort(sortByDate))
        setCurrentTime(Date.now())
      })
      .catch((requestError) => {
        if (didCancel) return
        setError(requestError.message)
      })
      .finally(() => {
        if (didCancel) return
        setIsLoading(false)
      })

    return () => {
      didCancel = true
    }
  }, [])

  const rounds = useMemo(() => {
    return [...new Set(fixtures.map((fixture) => fixture.round).filter(Boolean))]
  }, [fixtures])

  const dates = useMemo(() => {
    return [...new Set(fixtures.map((fixture) => formatDateKey(fixture.date)))].sort()
  }, [fixtures])

  const filteredFixtures = useMemo(() => {
    return fixtures.filter((fixture) => {
      const matchesRound = selectedRound === 'todos' || fixture.round === selectedRound
      const matchesDate =
        selectedDate === 'todos' || formatDateKey(fixture.date) === selectedDate

      return matchesRound && matchesDate && hasTeamMatch(fixture, query)
    })
  }, [fixtures, query, selectedDate, selectedRound])

  const groupedFixtures = useMemo(() => {
    return groupFixturesByDate(filteredFixtures)
  }, [filteredFixtures])

  const groupedDates = Object.keys(groupedFixtures).sort()
  const totalDates = new Set(fixtures.map((fixture) => formatDateKey(fixture.date))).size
  const nextFixture = fixtures.find(
    (fixture) => new Date(fixture.date).getTime() >= currentTime,
  )

  return (
    <main className="app-shell">
      <section className="summary-band">
        <div>
          <p className="eyebrow">FIFA World Cup 2026</p>
          <h1>Calendário de jogos</h1>
          <p className="summary-copy">
            Partidas carregadas pelo football-data.org com datas e horários convertidos
            automaticamente para o padrão brasileiro.
          </p>
        </div>

        <div className="stats-grid" aria-label="Resumo do calendário">
          <div className="stat">
            <Trophy size={20} />
            <strong>{fixtures.length || '--'}</strong>
            <span>jogos</span>
          </div>
          <div className="stat">
            <CalendarDays size={20} />
            <strong>{totalDates || '--'}</strong>
            <span>datas</span>
          </div>
          <div className="stat">
            <Clock size={20} />
            <strong>{nextFixture ? shortDateFormatter.format(new Date(nextFixture.date)) : '--'}</strong>
            <span>próximo jogo</span>
          </div>
        </div>
      </section>

      <section className="toolbar" aria-label="Filtros do calendário">
        <label className="search-field">
          <Search size={18} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar seleção, estádio ou fase"
          />
        </label>

        <label className="select-field">
          <Filter size={18} />
          <select
            value={selectedRound}
            onChange={(event) => setSelectedRound(event.target.value)}
          >
            <option value="todos">Todas as fases</option>
            {rounds.map((round) => (
              <option key={round} value={round}>
                {translateRound(round)}
              </option>
            ))}
          </select>
        </label>

        <label className="select-field">
          <CalendarDays size={18} />
          <select
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          >
            <option value="todos">Todas as datas</option>
            {dates.map((dateKey) => (
              <option key={dateKey} value={dateKey}>
                {dateFormatter.format(new Date(`${dateKey}T12:00:00`))}
              </option>
            ))}
          </select>
        </label>

        <button type="button" className="refresh-button" onClick={() => loadFixtures()}>
          <RefreshCw size={18} />
          Atualizar
        </button>
      </section>

      {error && (
        <div className="api-alert" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <section className="calendar-list" aria-live="polite">
        {isLoading ? (
          <div className="loading-state">
            <RefreshCw className="spin" size={26} />
            <span>Carregando calendário do football-data.org...</span>
          </div>
        ) : groupedDates.length === 0 ? (
          <EmptyState hasError={Boolean(error)} />
        ) : (
          groupedDates.map((dateKey) => (
            <section className="day-section" key={dateKey}>
              <header className="day-header">
                <h2>{dateFormatter.format(new Date(`${dateKey}T12:00:00`))}</h2>
                <span>{groupedFixtures[dateKey].length} jogos</span>
              </header>

              <div className="fixtures-grid">
                {groupedFixtures[dateKey].map((fixture) => (
                  <FixtureCard key={fixture.id} fixture={fixture} />
                ))}
              </div>
            </section>
          ))
        )}
      </section>
    </main>
  )
}

export default App
