import { useEffect, useMemo, useState } from 'react'
import { Building2, PhoneIncoming, PhoneOutgoing } from 'lucide-react'
import { getActivites, isActivitesDemoMode } from '../api/activites.api.js'

function extractActivites(response) {
  return {
    appels: Array.isArray(response?.appels) ? response.appels : [],
    prospects: Array.isArray(response?.prospects) ? response.prospects : [],
    users: Array.isArray(response?.users) ? response.users : [],
  }
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
  const isIncoming = appel.sens === 'entrant'
  const ActivityIcon = isIncoming ? PhoneIncoming : PhoneOutgoing

  return (
    <article className="activite-row">
      <div className={`activite-icon ${isIncoming ? 'incoming' : 'outgoing'}`} aria-hidden="true">
        <ActivityIcon size={19} />
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
        {appel.resultat && <span className="activite-result">{appel.resultat}</span>}
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
  const [sensFilter, setSensFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const appels = useMemo(() => data.appels
    .filter((appel) => !sensFilter || appel.sens === sensFilter)
    .sort((left, right) => new Date(right.date_heure) - new Date(left.date_heure)),
  [data.appels, sensFilter])

  return (
    <main className="activites-page">
      <header className="activites-header">
        <div>
          <h1>Flux des Activités Commerciales</h1>
          <p>Journal consolidé en temps réel des interactions téléphoniques qualifiées</p>
        </div>
        <label className="activites-filter">
          <span className="visually-hidden">Filtrer par type d’appel</span>
          <select value={sensFilter} onChange={(event) => setSensFilter(event.target.value)}>
            <option value="">Tous les types d’appels</option>
            <option value="entrant">Appels entrants</option>
            <option value="sortant">Appels sortants</option>
          </select>
        </label>
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
          <p className="activites-message">Aucune activité pour ce type d’appel.</p>
        )}
      </section>
    </main>
  )
}

export default ActivitesPage
