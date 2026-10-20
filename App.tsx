
import React, { useState } from 'react';
import { LayoutDashboard, Users, UserPlus, Shield, Receipt, Settings as SettingsIcon, Bell, Package, Calendar, ChevronRight, Menu, X, LogOut, User, Home, Briefcase, Wrench, Building, History, Cpu } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Registration } from './components/Registration';
import { VisitorManagement } from './components/VisitorManagement';
import { AccessControl } from './components/AccessControl';
import { AccessHistory } from './components/AccessHistory';
import { SalesAndPricing } from './components/SalesAndPricing';
import { Settings } from './components/Settings';
import { Deliveries } from './components/Deliveries';
import { Reservations } from './components/Reservations';
import { UserList } from './components/UserList';
import { UnitList } from './components/UnitList';
import { AutonomousSystem } from './components/AutonomousSystem';
import { SystemMetrics, AccessLog, UserType, AccessStatus, Notification } from './types';
import { StorageService } from './services/storageService';

// Mock Data
const mockMetrics: SystemMetrics = {
  totalUsers: 145,
  activeVisitors: 12,
  dailyAccesses: 482,
  securityAlerts: 3,
  pendingDeliveries: 2 
};

const mockLogs: AccessLog[] = [
  { id: '1', userName: 'Alice Souza', userType: UserType.RESIDENT, timestamp: '2023-10-24 14:30', location: 'Portão Principal', direction: 'entry', method: 'Facial', status: AccessStatus.GRANTED },
  { id: '2', userName: 'Roberto Junior', userType: UserType.VISITOR, timestamp: '2023-10-24 14:28', location: 'Portão Principal', direction: 'entry', method: 'QR Code', status: AccessStatus.GRANTED },
  { id: '3', userName: 'Desconhecido', userType: UserType.VISITOR, timestamp: '2023-10-24 14:15', location: 'Entrada Serviço', direction: 'entry', method: 'Manual', status: AccessStatus.DENIED },
  { id: '4', userName: 'Carlos (Técnico)', userType: UserType.SERVICE_PROVIDER, timestamp: '2023-10-24 13:50', location: 'Portão Principal', direction: 'exit', method: 'QR Code', status: AccessStatus.GRANTED },
];

const mockNotifications: Notification[] = [
  { id: '1', title: 'Alerta de Segurança', message: 'Portão da garagem aberto por mais de 5 min', time: '5 min atrás', read: false, type: 'alert' },
  { id: '2', title: 'Novo Visitante', message: 'Carlos Silva registrado por Unidade 302', time: '15 min atrás', read: false, type: 'info' },
  { id: '3', title: 'Sistema Atualizado', message: 'AML Security atualizado para v2.1', time: '1 hora atrás', read: true, type: 'success' },
  { id: '4', title: 'Encomenda Recebida', message: 'Pacote Amazon para Unidade 101 chegou na portaria.', time: '2 horas atrás', read: false, type: 'info' },
];

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [logs, setLogs] = useState<AccessLog[]>(() => StorageService.getLogs());
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const currentMetrics: SystemMetrics = {
    totalUsers: StorageService.getUsers().length,
    activeVisitors: StorageService.getVisitors().filter(v => v.status !== "checked-out").length,
    dailyAccesses: logs.length,
    securityAlerts: logs.filter(l => l.status === AccessStatus.DENIED).length,
    pendingDeliveries: StorageService.getDeliveries().filter(d => d.status === "waiting").length
  };
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard metrics={currentMetrics} logs={logs} />;
      case 'access': return <AccessControl />;
      case 'history': return <AccessHistory />;
      // People Management
      case 'units': return <UnitList />;
      case 'residents': return <UserList category="residents" />;
      case 'employees': return <UserList category="employees" />;
      case 'providers': return <UserList category="providers" />;
      case 'visitors': return <VisitorManagement />;
      case 'registration': return <Registration />;
      // Operational
      case 'deliveries': return <Deliveries />;
      case 'reservations': return <Reservations />;
      // Autonomous System
      case 'autonomous': return <AutonomousSystem />;
      // Admin
      case 'sales': return <SalesAndPricing />;
      case 'settings': return <Settings />;
      default: return <Dashboard metrics={mockMetrics} logs={mockLogs} />;
    }
  };

  const getViewInfo = (view: string) => {
     switch (view) {
      case 'dashboard': return { title: 'Painel de Controle', subtitle: 'Visão geral do sistema e métricas em tempo real.' };
      case 'access': return { title: 'Controle de Acesso', subtitle: 'Monitoramento ao vivo e ações de segurança.' };
      case 'history': return { title: 'Histórico de Acessos', subtitle: 'Logs detalhados de entradas e saídas.' };
      
      case 'units': return { title: 'Gestão de Unidades', subtitle: 'Detalhes residenciais, moradores, pets e veículos.' };
      case 'residents': return { title: 'Lista de Moradores', subtitle: 'Todos os proprietários, inquilinos e dependentes.' };
      case 'employees': return { title: 'Funcionários', subtitle: 'Equipe do condomínio e administração.' };
      case 'providers': return { title: 'Prestadores de Serviço', subtitle: 'Empresas terceirizadas e técnicos.' };
      case 'visitors': return { title: 'Gestão de Visitantes', subtitle: 'Emita credenciais e autorizações temporárias.' };
      case 'registration': return { title: 'Novo Cadastro', subtitle: 'Adicione usuários de qualquer categoria.' };
      
      case 'deliveries': return { title: 'Encomendas', subtitle: 'Rastreamento de pacotes e correspondências.' };
      case 'reservations': return { title: 'Reservas', subtitle: 'Agendamento de áreas comuns e recursos.' };
      
      case 'autonomous': return { title: 'Sistema Autônomo', subtitle: 'Atualizações de segurança, integridade e finanças.' };
      
      case 'sales': return { title: 'Planos e Preços', subtitle: 'Informações comerciais e apresentação.' };
      case 'settings': return { title: 'Configurações', subtitle: 'Ajustes do sistema e preferências.' };
      default: return { title: 'Painel de Controle', subtitle: '' };
    }
  }

  const markAllRead = () => {
    if (window.confirm("Tem certeza que deseja marcar todas as notificações como lidas?")) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const handleNavClick = (view: string) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
  };

  const currentViewInfo = getViewInfo(activeView);

  return (
    <div className="min-h-screen bg-gray-50 flex font-inter text-slate-900">
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-950 to-slate-900 text-white flex flex-col transition-transform duration-300 shadow-2xl border-r border-slate-800
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-cyan-900/30 p-2 rounded-xl border border-cyan-500/30 shadow-lg shadow-cyan-900/20">
              <Shield className="text-cyan-400" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
                AML
              </h1>
              <p className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase">Security Solutions</p>
            </div>
          </div>
        </div>
        
        <div className="px-4 py-2">
          <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent w-full my-2"></div>
        </div>

        <nav className="flex-1 px-4 space-y-4 overflow-y-auto custom-scrollbar py-4">
          
          <div>
            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Visão Geral</p>
            <div className="space-y-1">
              <NavItem 
                icon={<LayoutDashboard size={20} />} 
                label="Dashboard" 
                active={activeView === 'dashboard'} 
                onClick={() => handleNavClick('dashboard')} 
              />
              <NavItem 
                icon={<Shield size={20} />} 
                label="Controle de Acesso" 
                active={activeView === 'access'} 
                onClick={() => handleNavClick('access')} 
              />
              <NavItem 
                icon={<History size={20} />} 
                label="Histórico de Acesso" 
                active={activeView === 'history'} 
                onClick={() => handleNavClick('history')} 
              />
            </div>
          </div>

          <div>
            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Gestão de Pessoas</p>
            <div className="space-y-1">
              <NavItem 
                icon={<Building size={20} />} 
                label="Unidades" 
                active={activeView === 'units'} 
                onClick={() => handleNavClick('units')} 
              />
              <NavItem 
                icon={<Home size={20} />} 
                label="Moradores" 
                active={activeView === 'residents'} 
                onClick={() => handleNavClick('residents')} 
              />
              <NavItem 
                icon={<Users size={20} />} 
                label="Visitantes" 
                active={activeView === 'visitors'} 
                onClick={() => handleNavClick('visitors')} 
              />
              <NavItem 
                icon={<Briefcase size={20} />} 
                label="Funcionários" 
                active={activeView === 'employees'} 
                onClick={() => handleNavClick('employees')} 
              />
              <NavItem 
                icon={<Wrench size={20} />} 
                label="Prestadores" 
                active={activeView === 'providers'} 
                onClick={() => handleNavClick('providers')} 
              />
              <NavItem 
                icon={<UserPlus size={20} />} 
                label="Novo Cadastro" 
                active={activeView === 'registration'} 
                onClick={() => handleNavClick('registration')} 
              />
            </div>
          </div>
          
          <div>
            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Serviços</p>
            <div className="space-y-1">
              <NavItem 
                icon={<Package size={20} />} 
                label="Encomendas" 
                active={activeView === 'deliveries'} 
                onClick={() => handleNavClick('deliveries')} 
              />
              <NavItem 
                icon={<Calendar size={20} />} 
                label="Reservas" 
                active={activeView === 'reservations'} 
                onClick={() => handleNavClick('reservations')} 
              />
            </div>
          </div>

          <div>
            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Sistema</p>
            <div className="space-y-1">
              <NavItem 
                icon={<Cpu size={20} />} 
                label="Sistema Autônomo" 
                active={activeView === 'autonomous'} 
                onClick={() => handleNavClick('autonomous')} 
              />
              <NavItem 
                icon={<Receipt size={20} />} 
                label="Planos & Preços" 
                active={activeView === 'sales'} 
                onClick={() => handleNavClick('sales')} 
              />
              <NavItem 
                icon={<SettingsIcon size={20} />} 
                label="Configurações" 
                active={activeView === 'settings'} 
                onClick={() => handleNavClick('settings')} 
              />
            </div>
          </div>

        </nav>

        {/* User Profile */}
        <div className="p-4 mt-auto">
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 flex items-center justify-between group cursor-pointer hover:bg-slate-700/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-sm font-bold shadow-lg shadow-cyan-900/20 text-white border border-cyan-500/20">
                AD
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">Admin User</p>
                <p className="text-xs text-slate-400 truncate">admin@aml.security</p>
              </div>
            </div>
            <LogOut size={18} className="text-slate-400 group-hover:text-white transition-colors" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 md:px-10 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
            
            <div className="hidden md:block">
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-0.5">
                <span>App</span>
                <ChevronRight size={14} />
                <span className="text-slate-600 font-medium">{currentViewInfo.title}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">{currentViewInfo.title}</h2>
            </div>
            
            {/* Mobile Title */}
            <h2 className="md:hidden text-lg font-bold text-slate-800">{currentViewInfo.title}</h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 text-slate-500 hover:bg-slate-100 hover:text-cyan-600 rounded-full transition-all relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-semibold text-slate-800">Notificações</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>
                  <div className="max-h-[350px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Bell size={20} className="text-slate-300" />
                        </div>
                        <p className="text-slate-500 text-sm">Nenhuma notificação nova.</p>
                      </div>
                    ) : (
                      notifications.map(notification => (
                        <div key={notification.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group ${!notification.read ? 'bg-blue-50/30' : ''}`}>
                          <div className="flex justify-between items-start mb-1.5">
                            <h4 className={`text-sm font-semibold ${notification.type === 'alert' ? 'text-red-600' : 'text-slate-800'}`}>
                              {notification.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-medium bg-white px-2 py-0.5 rounded-full border border-slate-100">{notification.time}</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed group-hover:text-slate-900 transition-colors">{notification.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="hidden md:block w-px h-8 bg-slate-200"></div>
            <div className="hidden md:flex items-center gap-3">
               <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">Condomínio Jardins</p>
                  <p className="text-xs text-slate-500">São Paulo, SP</p>
               </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50/50 scroll-smooth">
          <div className="max-w-screen-2xl mx-auto space-y-8 pb-10">
            
            {/* Page Header (visible mainly on desktop for extra context if needed) */}
            <div className="md:flex justify-between items-end hidden">
               <div>
                  <h2 className="text-2xl font-bold text-slate-900">{currentViewInfo.title}</h2>
                  <p className="text-slate-500 mt-1">{currentViewInfo.subtitle}</p>
               </div>
               {/* Place for page-specific actions */}
            </div>

            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
      active 
        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' 
        : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <span className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
    <span className="font-medium text-sm">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
  </button>
);

export default App;