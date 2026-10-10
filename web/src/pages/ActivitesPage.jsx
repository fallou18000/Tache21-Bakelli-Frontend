import { useEffect, useMemo, useRef, useState } from 'react'
import { Building2, ChevronDown, PhoneIncoming, PhoneOff, PhoneOutgoing } from 'lucide-react'
import { getActivites, isActivitesDemoMode } from '../api/activites.api.js'

const callFilters = {
  ALL: 'tous',
  OUTGOING: 'sortant',
  INCOMING: 'entrant',
  MISSED: 'manque',
}

const callFilterOptions = [
  { value: callFilters.ALL, label: 'Tous les types d’appels' },
  { value: callFilters.OUTGOING, label: 'Appels sortants' },
  { value: callFilters.INCOMING, label: 'Appels entrants' },
  { value: callFilters.MISSED, label: 'Appel manqué' },
]

const resultLabels = {
  interested: 'Intéressé',
  no_answer: 'Appel manqué',
  'no answer': 'Appel manqué',
  missed: 'Appel manqué',
  answered: 'Répondu',
  busy: 'Occupé',
}

function extractActivites(response) {
  return {
    appels: Array.isArray(response?.appels) ? response.appels : [],
    prospects: Array.isArray(response?.prospects) ? response.prospects : [],
    users: Array.isArray(response?.users) ? response.users : [],
  }
}

function formatResult(result) {
  const value = result.trim().toLocaleLowerCase('fr')
  return resultLabels[value] || result.replaceAll('_', ' ')
}

function isMissedCall(appel) {
  const result = (appel.resultat || '')
    .trim()
    .toLocaleLowerCase('fr')
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')

  return ['no answer', 'missed', 'sans réponse', 'non répondu', 'manqué']
    .some((label) => result.includes(label))
}

function matchesFilter(appel, filter) {
  if (filter === callFilters.ALL) return true
  if (filter === callFilters.OUTGOING) return appel.sens === callFilters.OUTGOING
  if (filter === callFilters.INCOMING) return appel.sens === callFilters.INCOMING
  if (filter === callFilters.MISSED) return isMissedCall(appel)
  return false
}

function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('fr')
}

function ActivityRow({ appel, prospects, users }) {
  const prospect = prospects.find(({ id }) => id === appel.prospect_id)
  const user = users.find(({ id }) => id === appel.user_id)
  const missed = isMissedCall(appel)
  const Icon = missed
    ? PhoneOff
    : appel.sens === 'entrant'
      ? PhoneIncoming
      : PhoneOutgoing

  return (
    <article className="activite-row">
      <div className={`activite-icon ${missed ? 'missed' : appel.sens}`} aria-hidden="true">
        <Icon size={19} />
      </div>
      <div className="activite-content">
        <div className="activite-heading">
          <strong>{prospect?.nom || appel.numero || 'Appel'}</strong>
          {prospect?.societe && (
            <span className="activite-company">
              <Building2 size={14} aria-hidden="true" />
              {prospect.societe}
            </span>
          )}
        </div>
        <p>{appel.note || 'Interaction enregistrée'}</p>
      </div>
      <div className="activite-meta">
        {appel.resultat && <span className="activite-result">{formatResult(appel.resultat)}</span>}
        {user && (
          <span className="activite-avatar" aria-label={user.nom}>
            {getInitials(user.nom || '')}
          </span>
        )}
      </div>
    </article>
  )
}

function ActivitesPage() {
  const [data, setData] = useState({ appels: [], prospects: [], users: [] })
  const [callFilter, setCallFilter] = useState(callFilters.ALL)
  const [filterOpen, setFilterOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const filterRef = useRef(null)

  useEffect(() => {
    let active = true

    getActivites()
      .then((response) => {
        if (active) setData(extractActivites(response))
      })
      .catch(() => {
        if (active) setError('Impossible de charger les activités pour le moment.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!filterOpen) return undefined

    function closeOnOutsideClick(event) {
      if (!filterRef.current?.contains(event.target)) setFilterOpen(false)
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') setFilterOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [filterOpen])

  const appels = useMemo(() => data.appels
    .filter((appel) => matchesFilter(appel, callFilter))
    .sort((left, right) => new Date(right.date_heure) - new Date(left.date_heure)),
  [data.appels, callFilter])

  return (
    <main className="activites-page">
      <header className="activites-header">
        <div>
          <h1>Flux des Activités Commerciales</h1>
          <p>Journal consolidé en temps réel des interactions téléphoniques qualifiées</p>
        </div>
        <div className="activites-filter" ref={filterRef}>
          <button
            className="activites-filter-trigger"
            type="button"
            aria-label="Filtrer par type d’appel"
            aria-expanded={filterOpen}
            onClick={() => setFilterOpen((open) => !open)}
          >
            {callFilterOptions.find(({ value }) => value === callFilter)?.label}
            <ChevronDown size={16} aria-hidden="true" />
          </button>
          {filterOpen && (
            <div className="activites-filter-menu">
              {callFilterOptions.map(({ value, label }) => (
                <button
                  className={callFilter === value ? 'selected' : ''}
                  key={value}
                  type="button"
                  aria-pressed={callFilter === value}
                  onClick={() => {
                    setCallFilter(value)
                    setFilterOpen(false)
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {isActivitesDemoMode && (
        <p className="activites-demo">Données de démonstration</p>
      )}

      <section className="activites-list" aria-label="Activités commerciales">
        {loading ? (
          <p className="activites-message">Chargement des activités…</p>
        ) : error ? (
          <p className="activites-message" role="alert">{error}</p>
        ) : appels.length ? (
          appels.map((appel) => (
            <ActivityRow
              key={appel.id}
              appel={appel}
              prospects={data.prospects}
              users={data.users}
            />
          ))
        ) : (
          <p className="activites-message">Aucun appel correspondant à ce filtre.</p>
        )}
      </section>
    </main>
  )
}

export default ActivitesPage
