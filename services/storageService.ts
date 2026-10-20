import { User, UserType, AccessLog, AccessStatus, Visitor, Delivery, Reservation, Notification, SystemSettings } from '../types';

const STORAGE_KEYS = {
  USERS: 'aml_users_v1',
  LOGS: 'aml_access_logs_v1',
  VISITORS: 'aml_visitors_v1',
  DELIVERIES: 'aml_deliveries_v1',
  RESERVATIONS: 'aml_reservations_v1',
  NOTIFICATIONS: 'aml_notifications_v1',
  SETTINGS: 'aml_settings_v1',
};

// Initial default data if storage is empty
const defaultUsers: User[] = [
  {
    id: 'u-1',
    name: 'Ana Cláudia Ferreira',
    email: 'ana.ferreira@email.com',
    phone: '(11) 98765-4321',
    type: UserType.RESIDENT,
    unit: '101A',
    status: 'active',
    registeredAt: '2023-01-15',
    vehicles: [
      { plate: 'BRA2E19', make: 'Toyota', model: 'Corolla', color: 'Prata' }
    ],
    pets: [
      { id: 'pet-1', name: 'Thor', type: 'Cachorro', breed: 'Golden Retriever' }
    ]
  },
  {
    id: 'u-2',
    name: 'Marcos Vinícius Santos',
    email: 'marcos.santos@email.com',
    phone: '(11) 97654-3210',
    type: UserType.RESIDENT,
    unit: '204B',
    status: 'active',
    registeredAt: '2023-03-20',
    vehicles: [
      { plate: 'ABC1D23', make: 'Honda', model: 'Civic', color: 'Preto' }
    ]
  },
  {
    id: 'u-3',
    name: 'Carlos Alberto (Zelador)',
    email: 'zeladoria@condominio.com',
    phone: '(11) 91234-5678',
    type: UserType.EMPLOYEE,
    status: 'active',
    registeredAt: '2022-08-10'
  },
  {
    id: 'u-4',
    name: 'Roberto Elevadores Tech',
    email: 'contato@elevadortech.com',
    phone: '(11) 99887-7665',
    type: UserType.SERVICE_PROVIDER,
    status: 'active',
    registeredAt: '2023-05-12',
    serviceType: 'Manutenção de Elevadores'
  }
];

const defaultLogs: AccessLog[] = [
  { id: '1', userName: 'Ana Cláudia Ferreira', userType: UserType.RESIDENT, timestamp: '2023-10-24 14:30', location: 'Portão Principal', direction: 'entry', method: 'Facial', status: AccessStatus.GRANTED },
  { id: '2', userName: 'Roberto (Técnico)', userType: UserType.SERVICE_PROVIDER, timestamp: '2023-10-24 14:28', location: 'Portão de Serviço', direction: 'entry', method: 'QR Code', status: AccessStatus.GRANTED },
  { id: '3', userName: 'Desconhecido', userType: UserType.VISITOR, timestamp: '2023-10-24 14:15', location: 'Portão Garagem', direction: 'entry', method: 'Manual', status: AccessStatus.DENIED },
  { id: '4', userName: 'Carlos Alberto', userType: UserType.EMPLOYEE, timestamp: '2023-10-24 13:50', location: 'Portão Principal', direction: 'exit', method: 'Facial', status: AccessStatus.GRANTED },
];

const defaultVisitors: Visitor[] = [
  { 
    id: 'v1', 
    name: 'Juliana Costa', 
    hostId: 'u-1', 
    hostName: 'Ana Cláudia Ferreira', 
    hostUnit: '101A', 
    purpose: 'Visita Familiar', 
    expectedDate: '2023-10-24 16:00', 
    status: 'scheduled', 
    authorizationMethod: 'qr_instant', 
    approvalStatus: 'approved' 
  },
  { 
    id: 'v2', 
    name: 'Técnico Internet (Fibra)', 
    hostId: 'u-2', 
    hostName: 'Marcos Vinícius Santos', 
    hostUnit: '204B', 
    purpose: 'Instalação de Roteador', 
    expectedDate: '2023-10-24 15:30', 
    status: 'scheduled', 
    authorizationMethod: 'whatsapp_request', 
    approvalStatus: 'pending_whatsapp' 
  }
];

const defaultDeliveries: Delivery[] = [
  {
    id: 'del-1',
    trackingCode: 'BR123456789AA',
    recipientId: 'u-1',
    recipientName: 'Ana Cláudia Ferreira',
    recipientUnit: '101A',
    carrier: 'Mercado Livre',
    type: 'Caixa',
    arrivedAt: '2023-10-24 10:15',
    status: 'waiting'
  },
  {
    id: 'del-2',
    trackingCode: 'AMZ987654321',
    recipientId: 'u-2',
    recipientName: 'Marcos Vinícius Santos',
    recipientUnit: '204B',
    carrier: 'Amazon',
    type: 'Envelope',
    arrivedAt: '2023-10-24 11:30',
    status: 'waiting'
  }
];

function get<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultValue;
  }
}

function set<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

export const StorageService = {
  getUsers: (): User[] => get<User[]>(STORAGE_KEYS.USERS, defaultUsers),
  saveUser: (user: User): User[] => {
    const users = StorageService.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    let updated: User[];
    if (index >= 0) {
      updated = [...users];
      updated[index] = user;
    } else {
      updated = [user, ...users];
    }
    set(STORAGE_KEYS.USERS, updated);
    return updated;
  },
  deleteUser: (id: string): User[] => {
    const users = StorageService.getUsers().filter(u => u.id !== id);
    set(STORAGE_KEYS.USERS, users);
    return users;
  },

  getLogs: (): AccessLog[] => get<AccessLog[]>(STORAGE_KEYS.LOGS, defaultLogs),
  addLog: (log: Omit<AccessLog, 'id' | 'timestamp'> & { timestamp?: string }): AccessLog[] => {
    const logs = StorageService.getLogs();
    const newLog: AccessLog = {
      id: `log-${Date.now()}`,
      timestamp: log.timestamp || new Date().toLocaleString('pt-BR'),
      ...log
    };
    const updated = [newLog, ...logs];
    set(STORAGE_KEYS.LOGS, updated);
    return updated;
  },

  getVisitors: (): Visitor[] => get<Visitor[]>(STORAGE_KEYS.VISITORS, defaultVisitors),
  saveVisitor: (visitor: Visitor): Visitor[] => {
    const list = StorageService.getVisitors();
    const index = list.findIndex(v => v.id === visitor.id);
    let updated: Visitor[];
    if (index >= 0) {
      updated = [...list];
      updated[index] = visitor;
    } else {
      updated = [visitor, ...list];
    }
    set(STORAGE_KEYS.VISITORS, updated);
    return updated;
  },

  getDeliveries: (): Delivery[] => get<Delivery[]>(STORAGE_KEYS.DELIVERIES, defaultDeliveries),
  saveDelivery: (delivery: Delivery): Delivery[] => {
    const list = StorageService.getDeliveries();
    const index = list.findIndex(d => d.id === delivery.id);
    let updated: Delivery[];
    if (index >= 0) {
      updated = [...list];
      updated[index] = delivery;
    } else {
      updated = [delivery, ...list];
    }
    set(STORAGE_KEYS.DELIVERIES, updated);
    return updated;
  }
};
