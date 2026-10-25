import { useEffect, useMemo, useState } from 'react'
import {
  PRO,
  TODAY_LABEL,
  clients,
  confirmationMessage,
  initialAppointments,
  isOpenSlot,
  openSlotMessage,
  waLink,
  type Appointment,
  type ApptStatus,
  type Client,
} from './data'

type Tab = 'hoje' | 'confirmar' | 'clientes' | 'conta'
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const statusLabel: Record<ApptStatus, string> = {
  pendente: 'A confirmar',
  confirmado: 'Confirmado',
  chegou: 'Na cadeira',
  feito: 'Feito',
  remarcado: 'Remarcou',
  cancelado: 'Cancelou',
  vago: 'Vago',
}

function IconHome({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5.2v-6.2H10.2V21H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconCheck({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
      />
      <path
        d="m8.5 12.2 2.4 2.4 4.6-5"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconPeople({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="9"
        cy="9"
        r="3.2"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
      />
      <path
        d="M4.5 18.5c.7-2.6 2.7-4 4.5-4s3.8 1.4 4.5 4"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
        strokeLinecap="round"
      />
      <circle
        cx="16.5"
        cy="9.5"
        r="2.4"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
      />
      <path
        d="M15.2 14.6c1.6.3 2.9 1.3 3.5 3.2"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconMore({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="6.5" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="17.5" cy="12" r="1.6" fill="currentColor" />
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="5"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
      />
    </svg>
  )
}

function money(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

function openWa(phone: string, text: string) {
  window.open(waLink(phone, text), '_blank', 'noopener,noreferrer')
}

export default function App() {
  const [entered, setEntered] = useState(false)
  const [tab, setTab] = useState<Tab>('hoje')
  const [appts, setAppts] = useState<Appointment[]>(initialAppointments)
  const [toast, setToast] = useState<string | null>(null)
  const [blastSlotId, setBlastSlotId] = useState<string | null>(null)
  const [blastQueue, setBlastQueue] = useState<Client[]>([])
  const [blastIndex, setBlastIndex] = useState(0)
  const [notifiedIds, setNotifiedIds] = useState<Record<string, string[]>>({})
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 2000)
    return () => window.clearTimeout(id)
  }, [toast])

  const pending = useMemo(
    () => appts.filter((a) => a.status === 'pendente'),
    [appts],
  )

  const openSlots = useMemo(
    () => appts.filter((a) => isOpenSlot(a.status)),
    [appts],
  )

  const bookedPhones = useMemo(() => {
    const set = new Set<string>()
    for (const a of appts) {
      if (!isOpenSlot(a.status) && a.status !== 'feito') set.add(a.phone)
    }
    return set
  }, [appts])

  const waitlist = useMemo(
    () =>
      clients.filter((c) => c.waitlist && !bookedPhones.has(c.phone)),
    [bookedPhones],
  )

  const stats = useMemo(() => {
    const active = appts.filter((a) => !isOpenSlot(a.status))
    const revenue = active.reduce((sum, a) => sum + a.price, 0)
    return {
      total: active.length,
      pending: pending.length,
      open: openSlots.length,
      revenue,
    }
  }, [appts, pending.length, openSlots.length])

  const blastAppt = blastSlotId
    ? appts.find((a) => a.id === blastSlotId) ?? null
    : null

  function setStatus(id: string, status: ApptStatus) {
    setAppts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
  }

  function askConfirm(appt: Appointment) {
    openWa(appt.phone, confirmationMessage(appt, PRO.name))
    setToast(`Zap aberto · ${appt.client.split(' ')[0]}`)
  }

  function markOutcome(
    appt: Appointment,
    outcome: 'confirmado' | 'remarcado' | 'cancelado',
  ) {
    setStatus(appt.id, outcome)
    if (outcome === 'confirmado') {
      setToast('Confirmou')
      return
    }
    const label = outcome === 'remarcado' ? 'Remarcou' : 'Cancelou'
    setToast(`${label} · horário liberado`)
    // Abre aviso da lista na hora — zero fricção
    startBlast(appt.id)
  }

  function startBlast(slotId: string) {
    const queue = waitlist
    if (queue.length === 0) {
      setToast('Ninguém na lista de espera')
      setBlastSlotId(null)
      setBlastQueue([])
      return
    }
    setBlastSlotId(slotId)
    setBlastQueue(queue)
    setBlastIndex(0)
  }

  function notifyClient(slot: Appointment, client: Client) {
    openWa(client.phone, openSlotMessage(client, slot, PRO.name))
    setNotifiedIds((prev) => {
      const already = prev[slot.id] ?? []
      if (already.includes(client.id)) return prev
      return { ...prev, [slot.id]: [...already, client.id] }
    })
  }

  function sendCurrentBlast() {
    if (!blastAppt || !blastQueue[blastIndex]) return
    notifyClient(blastAppt, blastQueue[blastIndex])
    const next = blastIndex + 1
    if (next >= blastQueue.length) {
      setToast(`Lista avisada · ${blastQueue.length}`)
      setBlastSlotId(null)
      setBlastQueue([])
      setBlastIndex(0)
      return
    }
    setBlastIndex(next)
    setToast(`Próxima: ${blastQueue[next].name.split(' ')[0]}`)
  }

  function skipCurrentBlast() {
    const next = blastIndex + 1
    if (next >= blastQueue.length) {
      setBlastSlotId(null)
      setBlastQueue([])
      setBlastIndex(0)
      setToast('Lista encerrada')
      return
    }
    setBlastIndex(next)
  }

  async function installApp() {
    if (!installEvent) {
      setToast('No iPhone: Compartilhar → Adicionar à Tela de Início')
      return
    }
    await installEvent.prompt()
    const choice = await installEvent.userChoice
    if (choice.outcome === 'accepted') {
      setToast('Encaixe instalado na tela inicial')
      setInstallEvent(null)
    }
  }

  function OutcomeRow({ appt }: { appt: Appointment }) {
    return (
      <div className="outcome-row" role="group" aria-label="Resposta da cliente">
        <button
          type="button"
          className="outcome outcome-ok"
          onClick={() => markOutcome(appt, 'confirmado')}
        >
          Confirmou
        </button>
        <button
          type="button"
          className="outcome outcome-re"
          onClick={() => markOutcome(appt, 'remarcado')}
        >
          Remarcou
        </button>
        <button
          type="button"
          className="outcome outcome-no"
          onClick={() => markOutcome(appt, 'cancelado')}
        >
          Cancelou
        </button>
      </div>
    )
  }

  if (!entered) {
    return (
      <div className="landing">
        <section className="landing-hero" aria-label="Apresentação Encaixe">
          <div className="landing-hero__media" aria-hidden />
          <div className="landing-hero__content">
            <p className="brand-mark">
              Enca<span>ixe</span>
            </p>
            <h1>Sua agenda fora da bagunça do WhatsApp.</h1>
            <p className="lede">
              Confirma, remarca ou cancela em 1 toque. Vagou horário? Avisa a
              lista na hora.
            </p>
          </div>
        </section>
        <div className="landing-cta">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setEntered(true)}
          >
            Abrir agenda de hoje
          </button>
          <button type="button" className="btn btn-ghost" onClick={installApp}>
            Instalar app no celular
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      {tab === 'hoje' && (
        <>
          <header className="topbar">
            <div>
              <p className="eyebrow">{TODAY_LABEL}</p>
              <h1 className="title">Hoje</h1>
            </div>
            <div className="pill">
              <span className="pill-dot" />
              {PRO.name.split(' ')[0]}
            </div>
          </header>
          <main className="view">
            <div className="summary-row">
              <div className="summary">
                <strong>{stats.total}</strong>
                <span>ativos</span>
              </div>
              <div className="summary">
                <strong>{stats.pending}</strong>
                <span>a confirmar</span>
              </div>
              <div className="summary">
                <strong>{stats.open}</strong>
                <span>vagos</span>
              </div>
            </div>

            <div className="timeline">
              {appts.map((appt) => {
                const open = isOpenSlot(appt.status)
                const notified = notifiedIds[appt.id]?.length ?? 0
                return (
                  <article
                    key={appt.id}
                    className={`appt ${open ? 'appt-open' : ''}`}
                  >
                    <div className="appt-time">
                      {appt.time}
                      <small>{appt.durationMin} min</small>
                    </div>
                    <div className="appt-body">
                      <header>
                        <div>
                          <h3>{open ? 'Horário vago' : appt.client}</h3>
                          <p className="service">
                            {open
                              ? `${appt.durationMin} min livres · era ${appt.client.split(' ')[0]}`
                              : `${appt.service} · ${money(appt.price)}`}
                          </p>
                        </div>
                        <span className={`status status-${appt.status}`}>
                          {statusLabel[appt.status]}
                        </span>
                      </header>
                      {appt.note && !open ? (
                        <p className="note">{appt.note}</p>
                      ) : null}

                      {appt.status === 'pendente' ? (
                        <div className="appt-actions stacked">
                          <OutcomeRow appt={appt} />
                          <button
                            type="button"
                            className="btn btn-wa btn-sm"
                            onClick={() => askConfirm(appt)}
                          >
                            Cobrar no Zap
                          </button>
                        </div>
                      ) : null}

                      {appt.status === 'confirmado' ? (
                        <div className="appt-actions stacked">
                          <button
                            type="button"
                            className="btn btn-solid btn-sm"
                            onClick={() => {
                              setStatus(appt.id, 'chegou')
                              setToast('Na cadeira')
                            }}
                          >
                            Cliente chegou
                          </button>
                          <OutcomeRow appt={appt} />
                        </div>
                      ) : null}

                      {appt.status === 'chegou' ? (
                        <div className="appt-actions">
                          <button
                            type="button"
                            className="btn btn-soft btn-sm"
                            onClick={() => {
                              setStatus(appt.id, 'feito')
                              setToast('Finalizado')
                            }}
                          >
                            Finalizar
                          </button>
                        </div>
                      ) : null}

                      {open ? (
                        <div className="appt-actions stacked">
                          <button
                            type="button"
                            className="btn btn-blast btn-sm"
                            onClick={() => startBlast(appt.id)}
                          >
                            Avisar lista · {waitlist.length}
                          </button>
                          {notified > 0 ? (
                            <p className="blast-meta">
                              {notified} avisada{notified > 1 ? 's' : ''} neste
                              horário
                            </p>
                          ) : null}
                          <button
                            type="button"
                            className="btn btn-ghost-ink btn-sm"
                            onClick={() => {
                              setStatus(appt.id, 'vago')
                              setToast('Mantido como vago')
                            }}
                          >
                            Só marcar vago
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </article>
                )
              })}
            </div>
          </main>
        </>
      )}

      {tab === 'confirmar' && (
        <>
          <header className="topbar">
            <div>
              <p className="eyebrow">Resposta rápida</p>
              <h1 className="title">Confirmar</h1>
            </div>
            <div className="pill">{pending.length} pendentes</div>
          </header>
          <main className="view">
            <div className="section-head">
              <h2>3 botões. Pronto.</h2>
              <p>Confirmou · Remarcou · Cancelou</p>
            </div>
            {pending.length === 0 ? (
              <div className="empty">
                Ninguém pendente. Se vagou horário, use Avisar lista em Hoje.
              </div>
            ) : (
              <div className="queue">
                {pending.map((appt) => (
                  <article key={appt.id} className="queue-item">
                    <h3>
                      {appt.time} · {appt.client}
                    </h3>
                    <p className="meta">{appt.service}</p>
                    <div className="appt-actions stacked">
                      <OutcomeRow appt={appt} />
                      <button
                        type="button"
                        className="btn btn-wa btn-sm"
                        onClick={() => askConfirm(appt)}
                      >
                        Cobrar no Zap
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </main>
        </>
      )}

      {tab === 'clientes' && (
        <>
          <header className="topbar">
            <div>
              <p className="eyebrow">Mini CRM</p>
              <h1 className="title">Clientes</h1>
            </div>
            <div className="pill">
              {waitlist.length} na lista
            </div>
          </header>
          <main className="view">
            <div className="section-head">
              <h2>Lista de espera</h2>
              <p>Avisadas quando vagou</p>
            </div>
            <div className="client-list">
              {clients.map((client) => (
                <article key={client.id} className="client-row">
                  <div>
                    <h3>{client.name}</h3>
                    <p>
                      {client.lastService} · {client.visits} visitas
                      {client.waitlist ? ' · quer encaixe' : ''}
                    </p>
                  </div>
                  <span
                    className={
                      client.waitlist ? 'wait-tag' : `risk risk-${client.risk}`
                    }
                  >
                    {client.waitlist ? 'lista' : `risco ${client.risk}`}
                  </span>
                </article>
              ))}
            </div>
          </main>
        </>
      )}

      {tab === 'conta' && (
        <>
          <header className="topbar">
            <div>
              <p className="eyebrow">Seu negócio</p>
              <h1 className="title">Conta</h1>
            </div>
          </header>
          <main className="view account">
            <div className="account-card">
              <p className="brand">Encaixe</p>
              <p>
                {PRO.name} · {PRO.craft}
                <br />
                {PRO.city}
              </p>
            </div>

            <div className="install-box">
              <h3>Instale como app</h3>
              <p>
                Abre em tela cheia e fica na home — ideal pra marcar resposta em
                segundos entre uma cliente e outra.
              </p>
              <button
                type="button"
                className="btn btn-solid btn-sm"
                onClick={installApp}
              >
                {installEvent ? 'Instalar Encaixe' : 'Como instalar'}
              </button>
            </div>

            <div className="why">
              <article>
                <h3>Fluxo de 1 toque</h3>
                <p>
                  Confirmou / Remarcou / Cancelou. Se liberou horário, a lista de
                  espera já entra na fila de aviso no WhatsApp.
                </p>
              </article>
            </div>
          </main>
        </>
      )}

      {blastAppt && blastQueue[blastIndex] ? (
        <div className="blast-sheet" role="dialog" aria-label="Avisar lista">
          <div className="blast-sheet__inner">
            <p className="blast-kicker">
              Vago {blastAppt.time} · {blastIndex + 1}/{blastQueue.length}
            </p>
            <h2>{blastQueue[blastIndex].name}</h2>
            <p className="blast-copy">
              Um toque abre o Zap com a mensagem pronta. Depois avance pra
              próxima.
            </p>
            <div className="blast-actions">
              <button
                type="button"
                className="btn btn-blast"
                onClick={sendCurrentBlast}
              >
                Avisar no Zap
              </button>
              <button
                type="button"
                className="btn btn-ghost-ink"
                onClick={skipCurrentBlast}
              >
                Pular
              </button>
              <button
                type="button"
                className="btn btn-ghost-ink"
                onClick={() => {
                  setBlastSlotId(null)
                  setBlastQueue([])
                  setBlastIndex(0)
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <nav className="bottom-nav" aria-label="Navegação principal">
        <button
          type="button"
          className={`nav-btn ${tab === 'hoje' ? 'active' : ''}`}
          onClick={() => setTab('hoje')}
        >
          <IconHome active={tab === 'hoje'} />
          Hoje
        </button>
        <button
          type="button"
          className={`nav-btn ${tab === 'confirmar' ? 'active' : ''}`}
          onClick={() => setTab('confirmar')}
        >
          <IconCheck active={tab === 'confirmar'} />
          Confirmar
          {pending.length > 0 ? (
            <span className="badge">{pending.length}</span>
          ) : null}
        </button>
        <button
          type="button"
          className={`nav-btn ${tab === 'clientes' ? 'active' : ''}`}
          onClick={() => setTab('clientes')}
        >
          <IconPeople active={tab === 'clientes'} />
          Clientes
        </button>
        <button
          type="button"
          className={`nav-btn ${tab === 'conta' ? 'active' : ''}`}
          onClick={() => setTab('conta')}
        >
          <IconMore active={tab === 'conta'} />
          Conta
        </button>
      </nav>

      <div className={`toast ${toast ? 'show' : ''}`} role="status">
        {toast}
      </div>
    </div>
  )
}
