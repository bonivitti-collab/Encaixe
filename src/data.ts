export type ApptStatus =
  | 'pendente'
  | 'confirmado'
  | 'chegou'
  | 'feito'
  | 'remarcado'
  | 'cancelado'
  | 'vago'

export type Appointment = {
  id: string
  time: string
  durationMin: number
  client: string
  phone: string
  service: string
  price: number
  status: ApptStatus
  note?: string
}

export type Client = {
  id: string
  name: string
  phone: string
  lastService: string
  visits: number
  risk: 'baixa' | 'media' | 'alta'
  /** Quer ser avisada quando surgir encaixe */
  waitlist: boolean
}

export const PRO = {
  name: 'Marina Alves',
  craft: 'Nail designer · MEI',
  city: 'São Paulo',
}

export const TODAY_LABEL = 'Domingo, 25 de out'

export const initialAppointments: Appointment[] = [
  {
    id: 'a1',
    time: '09:00',
    durationMin: 90,
    client: 'Camila Rocha',
    phone: '5511999887766',
    service: 'Alongamento em gel',
    price: 180,
    status: 'confirmado',
  },
  {
    id: 'a2',
    time: '11:00',
    durationMin: 60,
    client: 'Juliana Pires',
    phone: '5511988776655',
    service: 'Manutenção + esmaltação',
    price: 120,
    status: 'pendente',
    note: 'Pediu horário pelo Zap ontem à noite',
  },
  {
    id: 'a3',
    time: '14:30',
    durationMin: 75,
    client: 'Bianca Mendes',
    phone: '5511977665544',
    service: 'Blindagem + nail art',
    price: 150,
    status: 'pendente',
  },
  {
    id: 'a4',
    time: '16:30',
    durationMin: 45,
    client: 'Patrícia Nogueira',
    phone: '5511966554433',
    service: 'Remoção + hidratação',
    price: 90,
    status: 'confirmado',
  },
  {
    id: 'a5',
    time: '18:00',
    durationMin: 60,
    client: 'Larissa Campos',
    phone: '5511955443322',
    service: 'Spa dos pés',
    price: 110,
    status: 'pendente',
    note: 'Cliente nova — veio do Instagram',
  },
]

export const clients: Client[] = [
  {
    id: 'c1',
    name: 'Camila Rocha',
    phone: '5511999887766',
    lastService: 'Alongamento',
    visits: 14,
    risk: 'baixa',
    waitlist: false,
  },
  {
    id: 'c2',
    name: 'Juliana Pires',
    phone: '5511988776655',
    lastService: 'Manutenção',
    visits: 6,
    risk: 'media',
    waitlist: true,
  },
  {
    id: 'c3',
    name: 'Bianca Mendes',
    phone: '5511977665544',
    lastService: 'Blindagem',
    visits: 3,
    risk: 'alta',
    waitlist: true,
  },
  {
    id: 'c4',
    name: 'Patrícia Nogueira',
    phone: '5511966554433',
    lastService: 'Remoção',
    visits: 9,
    risk: 'baixa',
    waitlist: false,
  },
  {
    id: 'c5',
    name: 'Larissa Campos',
    phone: '5511955443322',
    lastService: '—',
    visits: 0,
    risk: 'media',
    waitlist: true,
  },
  {
    id: 'c6',
    name: 'Fernanda Dias',
    phone: '5511944332211',
    lastService: 'Esmaltação',
    visits: 8,
    risk: 'baixa',
    waitlist: true,
  },
  {
    id: 'c7',
    name: 'Amanda Souza',
    phone: '5511933221100',
    lastService: 'Spa das mãos',
    visits: 4,
    risk: 'media',
    waitlist: true,
  },
]

export function confirmationMessage(appt: Appointment, proName: string) {
  const first = appt.client.split(' ')[0]
  const pro = proName.split(' ')[0]
  return (
    `Oi, ${first}! Aqui é ${pro}.\n\n` +
    `Confirmando *hoje às ${appt.time}* — ${appt.service}.\n\n` +
    `Responde só com uma palavra:\n` +
    `*CONFIRMO* · *REMARCO* · *CANCELA*`
  )
}

export function openSlotMessage(
  client: Client,
  slot: { time: string; durationMin: number },
  proName: string,
) {
  const first = client.name.split(' ')[0]
  const pro = proName.split(' ')[0]
  return (
    `Oi, ${first}! Aqui é ${pro}.\n\n` +
    `Vagou um horário *hoje às ${slot.time}* (${slot.durationMin} min).\n\n` +
    `Quer encaixar? Responde *QUERO* agora que eu te seguro.`
  )
}

export function waLink(phone: string, text: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}

export function isOpenSlot(status: ApptStatus) {
  return status === 'vago' || status === 'cancelado' || status === 'remarcado'
}
