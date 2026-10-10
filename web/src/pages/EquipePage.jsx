import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Award,
  CalendarDays,
  ChevronRight,
  Mail,
  Phone,
} from 'lucide-react'
import { getEquipe, isEquipeDemoMode } from '../api/equipe.api.js'

function getNameById(records, id) {
  return records.find((record) => record.id === id)?.nom || '—'
}

function extractEquipe(response) {
  const users = Array.isArray(response?.users) ? response.users : []
  const roles = Array.isArray(response?.roles) ? response.roles : []
  const equipes = Array.isArray(response?.equipes) ? response.equipes : []
  const departements = Array.isArray(response?.departements) ? response.departements : []

  return {
    members: users.map((user) => {
      const equipe = equipes.find((item) => item.id === user.equipe_id)
      const departementId = equipe?.departement_id

      return {
        ...user,
        role: getNameById(roles, user.role_id),
        equipe: getNameById(equipes, user.equipe_id),
        departement: getNameById(departements, departementId),
        manager: getNameById(users, user.manager_id),
      }
    }),
    prospects: Array.isArray(response?.prospects) ? response.prospects : [],
    appels: Array.isArray(response?.appels) ? response.appels : [],
    objectifs: Array.isArray(response?.objectifs) ? response.objectifs : [],
    relances: Array.isArray(response?.relances) ? response.relances : [],
  }
}

function formatDuration(seconds) {
  const totalMinutes = Math.floor(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (!hours) return `${minutes} min`
  return `${hours} h ${String(minutes).padStart(2, '0')}`
}

function getUserCalls(user, appels) {
  return appels.filter((appel) => appel.user_id === user.id)
}

function getUserProspects(user, prospects) {
  return prospects.filter((prospect) => prospect.commercial_id === user.id)
}

function getUserMetrics(user, data) {
  const calls = getUserCalls(user, data.appels)
  const prospects = getUserProspects(user, data.prospects)

  return {
    calls,
    prospects,
    callCount: calls.length,
    duration: calls.reduce((total, call) => total + Number(call.duree || 0), 0),
    appointments: calls.filter((call) => /rendez.?vous|rdv/i.test(call.resultat || '')).length,
    contacts: calls.filter((call) => /contact établi|contacte|joint/i.test(call.resultat || '')).length,
    proposals: prospects.filter((prospect) => prospect.statut?.toLocaleLowerCase('fr') === 'proposition').length,
    won: prospects.filter((prospect) => prospect.statut?.toLocaleLowerCase('fr') === 'gagné').length,
    objectives: data.objectifs.filter((objective) => objective.user_id === user.id),
    reminders: data.relances
      .filter((reminder) => !reminder.fait)
      .map((reminder) => ({
        ...reminder,
        prospect: data.prospects.find(({ id }) => id === reminder.prospect_id),
      }))
      .filter(({ prospect }) => prospect?.commercial_id === user.id)
      .sort((left, right) => new Date(left.date_prevue) - new Date(right.date_prevue)),
  }
}

function getCallsToday(calls) {
  const today = new Date().toLocaleDateString('fr-CA')
  return calls.filter((call) => new Date(call.date_heure).toLocaleDateString('fr-CA') === today).length
}

function getCallObjectiveProgress(metrics) {
  const objective = metrics.objectives.find(({ type }) => /appel/i.test(type))
  if (!objective || objective.valeur_cible <= 0) return null

  const actual = objective.periode.toLocaleLowerCase('fr').includes('jour')
    ? getCallsToday(metrics.calls)
    : metrics.callCount

  return Math.min(100, Math.round((actual / objective.valeur_cible) * 100))
}

function getWeeklyActivity(user, appels, prospects) {
  const weeks = Array.from({ length: 4 }, (_, index) => ({
    label: index === 0 ? 'S-3' : index === 1 ? 'S-2' : index === 2 ? 'S-1' : 'Cette semaine',
    calls: 0,
    appointments: 0,
    won: 0,
  }))
  const now = Date.now()

  appels.filter(({ user_id }) => user_id === user.id).forEach((call) => {
    const daysAgo = Math.floor((now - new Date(call.date_heure).getTime()) / 86400000)
    const weekIndex = 3 - Math.floor(daysAgo / 7)
    if (weekIndex < 0 || weekIndex > 3) return
    weeks[weekIndex].calls += 1
    if (/rendez.?vous|rdv/i.test(call.resultat || '')) weeks[weekIndex].appointments += 1
    if (prospects.some((prospect) => (
      prospect.id === call.prospect_id && prospect.statut?.toLocaleLowerCase('fr') === 'gagné'
    ))) {
      weeks[weekIndex].won += 1
    }
  })

  return weeks
}

function MemberCard({ member, metrics }) {
  const progress = getCallObjectiveProgress(metrics)

  return (
    <Link className="equipe-member-card" to={`/equipe/${member.id}`}>
      <div className="equipe-member-heading">
        <div className="equipe-avatar" aria-hidden="true">
          {(member.nom || '?').trim().slice(0, 2).toLocaleUpperCase('fr')}
        </div>
        <div className="equipe-member-name">
          <h2>{member.nom || '—'}</h2>
          <p>{member.role || '—'}{member.equipe && member.equipe !== '—' ? ` · ${member.equipe}` : ''}</p>
        </div>
        {progress !== null && <span className="equipe-progress">{progress}%</span>}
      </div>

      <div className="equipe-card-metrics">
        <div><span><Phone size={15} />Appels</span><strong>{metrics.callCount}</strong></div>
        <div><span><CalendarDays size={15} />Rendez-vous</span><strong className="equipe-number-orange">{metrics.appointments}</strong></div>
        <div><span><Award size={15} />Gagnés</span><strong className="equipe-number-green">{metrics.won}</strong></div>
        <div><span>Temps total</span><strong className="equipe-time">{formatDuration(metrics.duration)}</strong></div>
      </div>

      <div className="equipe-card-link">
        <span>Consulter le détail individuel</span>
        <ChevronRight size={17} aria-hidden="true" />
      </div>
    </Link>
  )
}

function MemberDetail({ member, metrics, activity, onBack }) {
  const objective = metrics.objectives.find(({ type }) => /appel/i.test(type))
  const progress = getCallObjectiveProgress(metrics)
  const maxActivity = Math.max(1, ...activity.flatMap(({ calls, appointments, won }) => [calls, appointments, won]))

  return (
    <div className="equipe-detail">
      <button className="equipe-back" type="button" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" /> Retour à l’équipe
      </button>

      <section className="equipe-profile">
        <div className="equipe-avatar equipe-avatar-large" aria-hidden="true">
          {(member.nom || '?').trim().slice(0, 2).toLocaleUpperCase('fr')}
        </div>
        <div className="equipe-profile-info">
          <h1>{member.nom || '—'}</h1>
          <p>{member.role || '—'}{member.equipe && member.equipe !== '—' ? ` · ${member.equipe}` : ''}</p>
          <div className="equipe-contact-row">
            {member.telephone && <span><Phone size={15} />{member.telephone}</span>}
            {member.email && <span><Mail size={15} />{member.email}</span>}
          </div>
        </div>
        {progress !== null && (
          <div className="equipe-profile-goal">
            <span>Objectif appels ({objective.periode})</span>
            <strong>{progress}%</strong>
            <small>{objective.valeur_cible} appels visés</small>
          </div>
        )}
      </section>

      <div className="equipe-detail-columns">
        <section className="equipe-detail-panel">
          <h2><Phone size={17} aria-hidden="true" /> Activité téléphonique</h2>
          <div className="equipe-stat-grid">
            <div><strong>{metrics.callCount}</strong><span>Appels émis</span></div>
            <div><strong>{metrics.contacts}</strong><span>Contacts joints</span></div>
            <div><strong>{formatDuration(metrics.duration)}</strong><span>Temps d’appel</span></div>
          </div>
        </section>

        <section className="equipe-detail-panel">
          <h2><Award size={17} aria-hidden="true" /> Résultats commerciaux</h2>
          <div className="equipe-stat-grid">
            <div className="equipe-stat-orange"><strong>{metrics.appointments}</strong><span>Rendez-vous</span></div>
            <div className="equipe-stat-blue"><strong>{metrics.proposals}</strong><span>Propositions en cours</span></div>
            <div className="equipe-stat-green"><strong>{metrics.won}</strong><span>Prospects gagnés</span></div>
          </div>
        </section>
      </div>

      <section className="equipe-detail-panel equipe-trend-panel">
        <div className="equipe-trend-heading">
          <div>
            <h2>Activité téléphonique sur 4 semaines</h2>
            <p>Appels et rendez-vous d’après l’historique des appels</p>
          </div>
        </div>
        <div className="equipe-week-grid">
          {activity.map((week) => (
            <div className="equipe-week" key={week.label}>
              <div className="equipe-bars" aria-label={`${week.calls} appels, ${week.appointments} rendez-vous`}>
                <span className="equipe-bar-calls" style={{ height: `${Math.max(5, (week.calls / maxActivity) * 100)}%` }} />
                <span className="equipe-bar-appointments" style={{ height: `${Math.max(5, (week.appointments / maxActivity) * 100)}%` }} />
              </div>
              <strong>{week.label}</strong>
              <small>{week.calls} appels · {week.appointments} RDV</small>
            </div>
          ))}
        </div>
        <div className="equipe-chart-legend">
          <span><i className="equipe-bar-calls" /> Appels</span>
          <span><i className="equipe-bar-appointments" /> Rendez-vous</span>
        </div>
      </section>

      <section className="equipe-detail-panel equipe-reminders">
        <h2><CalendarDays size={17} aria-hidden="true" /> Relances à venir</h2>
        {metrics.reminders.length ? (
          <ul>
            {metrics.reminders.map(({ id, date_prevue, type, prospect }) => (
              <li key={id}>
                <div>
                  <strong>{prospect.nom}</strong>
                  <span>{prospect.societe || prospect.telephone || '—'}</span>
                </div>
                <span className="equipe-reminder-type">{type || 'Relance'}</span>
                <time dateTime={date_prevue}>
                  {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date_prevue))}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucune relance en attente pour ce membre.</p>
        )}
      </section>

      <section className="equipe-detail-panel equipe-objectives">
        <h2>Objectifs attribués</h2>
        {metrics.objectives.length ? (
          <ul>
            {metrics.objectives.map(({ id, type, valeur_cible, periode }) => (
              <li key={id}><span>{type}</span><strong>{valeur_cible}</strong><small>{periode}</small></li>
            ))}
          </ul>
        ) : (
          <p>Aucun objectif renseigné.</p>
        )}
      </section>
    </div>
  )
}

function EquipePage() {
  const { memberId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState({ members: [], prospects: [], appels: [], objectifs: [], relances: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    getEquipe()
      .then((response) => {
        if (active) setData(extractEquipe(response))
      })
      .catch(() => {
        if (active) setError('Impossible de charger les membres de l’équipe.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const selectedMember = memberId
    ? data.members.find((member) => String(member.id) === memberId)
    : null

  return (
    <div className="equipe-page">
      <main className="workspace">
        {memberId ? (
          loading ? (
            <section className="equipe-empty">Chargement du détail du membre…</section>
          ) : selectedMember ? (
            <MemberDetail
              member={selectedMember}
              metrics={getUserMetrics(selectedMember, data)}
              activity={getWeeklyActivity(selectedMember, data.appels, data.prospects)}
              onBack={() => navigate('/equipe')}
            />
          ) : (
            <section className="equipe-empty">
              <p>{error || 'Ce membre est introuvable.'}</p>
              <Link to="/equipe">Retour à l’équipe</Link>
            </section>
          )
        ) : (
          <>
            <header className="page-header equipe-page-header">
              <div>
                <h1>Équipe commerciale</h1>
                <p className="page-subtitle">
                  {loading
                    ? 'Chargement des membres…'
                    : `${data.members.length} commercial${data.members.length > 1 ? 's' : ''} actif${data.members.length > 1 ? 's' : ''} dans l’équipe`}
                </p>
              </div>
              <div className="result-count" aria-live="polite">
                {loading
                  ? 'Chargement…'
                  : `${data.members.length} membre${data.members.length > 1 ? 's' : ''} affiché${data.members.length > 1 ? 's' : ''}`}
              </div>
            </header>

            {isEquipeDemoMode && (
              <div className="api-demo" role="status">
                Données fictives pour la démonstration — aucune donnée n’a été enregistrée dans la base.
              </div>
            )}

            {error && <div className="api-error" role="alert"><AlertCircle size={17} />{error}</div>}

            {loading ? (
              <section className="equipe-empty">Chargement des commerciaux…</section>
            ) : data.members.length ? (
              <section className="equipe-cards" aria-label="Équipe commerciale">
                {data.members.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    metrics={getUserMetrics(member, data)}
                  />
                ))}
              </section>
            ) : (
              <section className="equipe-empty">
                {error
                  ? 'Les données de l’équipe ne sont pas disponibles.'
                  : 'Aucun membre dans l’équipe.'}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default EquipePage
