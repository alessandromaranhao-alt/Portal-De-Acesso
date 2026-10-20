
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Download, Calendar, ArrowUpRight, ArrowDownLeft, AlertCircle, CheckCircle, XCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Camera, FileText, X, ArrowUpDown, Sparkles, Image as ImageIcon, Bell } from 'lucide-react';
import { AccessLog, UserType, AccessStatus } from '../types';
import { StorageService } from '../services/storageService';
import { analyzeFace } from '../services/geminiService';

// Extended Mock Data for History
const INITIAL_LOGS: AccessLog[] = [
  { id: '1', userName: 'Alice Souza', userType: UserType.RESIDENT, timestamp: '2023-10-24 14:30', location: 'Portão Principal', direction: 'entry', method: 'Facial', status: AccessStatus.GRANTED, confidence: 98 },
  { id: '2', userName: 'Roberto Junior', userType: UserType.VISITOR, timestamp: '2023-10-24 14:28', location: 'Portão Principal', direction: 'entry', method: 'QR Code', status: AccessStatus.GRANTED },
  { id: '3', userName: 'Desconhecido', userType: UserType.VISITOR, timestamp: '2023-10-24 14:15', location: 'Entrada Serviço', direction: 'entry', method: 'Manual', status: AccessStatus.DENIED },
  { id: '4', userName: 'Carlos (Técnico)', userType: UserType.SERVICE_PROVIDER, timestamp: '2023-10-24 13:50', location: 'Portão Principal', direction: 'exit', method: 'QR Code', status: AccessStatus.GRANTED },
  { id: '5', userName: 'Bruno Santos', userType: UserType.OWNER, timestamp: '2023-10-24 12:10', location: 'Garagem S1', direction: 'entry', method: 'App', status: AccessStatus.GRANTED },
  { id: '6', userName: 'Entregador iFood', userType: UserType.VISITOR, timestamp: '2023-10-24 12:05', location: 'Portaria', direction: 'entry', method: 'Manual', status: AccessStatus.PENDING },
  { id: '7', userName: 'Maria Limpeza', userType: UserType.SERVICE_PROVIDER, timestamp: '2023-10-24 08:00', location: 'Entrada Serviço', direction: 'entry', method: 'Facial', status: AccessStatus.GRANTED, confidence: 92 },
  { id: '8', userName: 'João Silva', userType: UserType.RESIDENT, timestamp: '2023-10-23 23:45', location: 'Garagem S1', direction: 'entry', method: 'App', status: AccessStatus.GRANTED },
  { id: '9', userName: 'Visitante Marcos', userType: UserType.VISITOR, timestamp: '2023-10-23 20:30', location: 'Portão Principal', direction: 'exit', method: 'QR Code', status: AccessStatus.GRANTED },
  { id: '10', userName: 'Pedro Silva', userType: UserType.DEPENDENT, timestamp: '2023-10-23 18:15', location: 'Portão Pedestre', direction: 'entry', method: 'Facial', status: AccessStatus.GRANTED, confidence: 89 },
];

export const AccessHistory: React.FC = () => {
  const [logs, setLogs] = useState<AccessLog[]>(() => StorageService.getLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterDirection, setFilterDirection] = useState<string>('all');
  const [onlyWithPhoto, setOnlyWithPhoto] = useState(false);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  
  // Sorting State
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Row Expansion & Modal State
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<AccessLog | null>(null);

  // AI Analysis State
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [aiAnalysisResults, setAiAnalysisResults] = useState<Record<string, string>>({});

  // Notification State
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);

  // Simulate incoming live access log
  useEffect(() => {
    const timer = setTimeout(() => {
      const now = new Date();
      const newLog: AccessLog = {
        id: `live-${now.getTime()}`,
        userName: 'Visitante Simulado (Live)',
        userType: UserType.VISITOR,
        timestamp: `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString()}`,
        location: 'Portaria (Simulação)',
        direction: 'entry',
        method: 'Facial',
        status: AccessStatus.GRANTED,
        confidence: 95
      };
      
      setLogs(prev => [newLog, ...prev]);
      setNotification({ message: `Acesso Permitido: ${newLog.userName}`, type: 'success' });
      
      // Auto dismiss
      setTimeout(() => setNotification(null), 4000);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Text Search
      const matchesSearch = log.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            log.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Type Filter
      const matchesType = filterType === 'all' || log.userType === filterType;
      
      // Status Filter
      const matchesStatus = filterStatus === 'all' || log.status === filterStatus;

      // Method Filter
      const matchesMethod = filterMethod === 'all' || log.method === filterMethod;

      // Direction Filter
      const matchesDirection = filterDirection === 'all' || log.direction === filterDirection;

      // Photo Filter
      const matchesPhoto = onlyWithPhoto ? (log.method === 'Facial') : true;

      // Date Filter
      let matchesDate = true;
      if (dateStart || dateEnd) {
        const logDatePart = log.timestamp.split(' ')[0]; 
        if (dateStart && logDatePart < dateStart) matchesDate = false;
        if (dateEnd && logDatePart > dateEnd) matchesDate = false;
      }

      return matchesSearch && matchesType && matchesStatus && matchesMethod && matchesDate && matchesDirection && matchesPhoto;
    }).sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.timestamp.localeCompare(b.timestamp);
      } else {
        return b.timestamp.localeCompare(a.timestamp);
      }
    });
  }, [logs, searchTerm, filterType, filterStatus, filterMethod, filterDirection, onlyWithPhoto, dateStart, dateEnd, sortOrder]);

  const handleExport = () => {
    if (filteredLogs.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }

    const headers = ["ID", "Data/Hora", "Usuário", "Tipo", "Local", "Direção", "Método", "Status", "Confiança IA"];
    
    const csvRows = filteredLogs.map(log => {
      return [
        log.id,
        log.timestamp,
        `"${log.userName}"`,
        log.userType,
        `"${log.location}"`,
        log.direction === 'entry' ? 'Entrada' : 'Saída',
        log.method,
        log.status,
        log.confidence ? `${log.confidence}%` : 'N/A'
      ].join(",");
    });

    const csvString = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_acessos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const handleAnalyzePhoto = async (log: AccessLog) => {
    if (analyzingId || aiAnalysisResults[log.id]) return;
    
    setAnalyzingId(log.id);
    try {
      // In a real app, we would fetch the actual image base64. 
      // Here we simulate by passing a dummy string, relying on the service to handle or mock.
      const result = await analyzeFace("dummy_base64_string_for_simulation");
      setAiAnalysisResults(prev => ({
        ...prev,
        [log.id]: result.length > 50 ? result : "Rosto identificado com sucesso. Correspondência biométrica confirmada com alta precisão."
      }));
    } catch (error) {
      setAiAnalysisResults(prev => ({
        ...prev,
        [log.id]: "Erro na análise de IA. Tente novamente."
      }));
    } finally {
      setAnalyzingId(null);
    }
  };

  const getStatusStyle = (status: AccessStatus) => {
    switch (status) {
      case AccessStatus.GRANTED: return 'bg-green-100 text-green-700 border-green-200';
      case AccessStatus.DENIED: return 'bg-red-100 text-red-700 border-red-200';
      case AccessStatus.PENDING: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: AccessStatus) => {
    switch (status) {
      case AccessStatus.GRANTED: return <CheckCircle size={14} />;
      case AccessStatus.DENIED: return <XCircle size={14} />;
      case AccessStatus.PENDING: return <AlertCircle size={14} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Live Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-4 flex items-center gap-3 pr-8">
            <div className={`p-2 rounded-full ${notification.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
              <Bell size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Novo Evento</h4>
              <p className="text-xs text-slate-600">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-end lg:items-center mb-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
            <Filter size={20} className="text-blue-600" /> Filtros de Pesquisa
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={() => setOnlyWithPhoto(!onlyWithPhoto)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors text-sm font-medium ${
                onlyWithPhoto 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Camera size={16} /> Apenas com Foto
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              <Download size={16} /> Exportar CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou local..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <select 
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-600"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Tipo: Todos</option>
              {Object.values(UserType).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <select 
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-600"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Status: Todos</option>
              {Object.values(AccessStatus).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div>
            <select 
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-600"
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
            >
              <option value="all">Método: Todos</option>
              <option value="Facial">Facial</option>
              <option value="QR Code">QR Code</option>
              <option value="Manual">Manual</option>
              <option value="App">App</option>
            </select>
          </div>

          <div>
            <select 
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-600"
              value={filterDirection}
              onChange={(e) => setFilterDirection(e.target.value)}
            >
              <option value="all">Direção: Todas</option>
              <option value="entry">Entrada</option>
              <option value="exit">Saída</option>
            </select>
          </div>

          <div className="flex gap-2 xl:col-span-1">
            <input 
              type="date" 
              className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-600"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              title="Data Inicial"
            />
            <input 
              type="date" 
              className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-600"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              title="Data Final"
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-4 w-10"></th>
                <th className="px-6 py-4 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors" onClick={toggleSort}>
                  <div className="flex items-center gap-2">
                    Data/Hora
                    <ArrowUpDown size={14} className="text-slate-400" />
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold text-slate-600">Usuário</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Tipo</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Local</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Método</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-center">Dir.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className={`hover:bg-slate-50 transition-colors ${expandedLogId === log.id ? 'bg-blue-50/30' : ''}`}>
                      <td className="px-4 py-4 text-center">
                        <button 
                          onClick={() => toggleExpand(log.id)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                        >
                          {expandedLogId === log.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{log.timestamp}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{log.userName}</p>
                        {log.confidence && (
                          <p className="text-[10px] text-slate-400">Confiança: {log.confidence}%</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          {log.userType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{log.location}</td>
                      <td className="px-6 py-4 text-slate-600">{log.method}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(log.status)}`}>
                          {getStatusIcon(log.status)} {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {log.direction === 'entry' ? (
                          <span title="Entrada" className="inline-block p-1.5 bg-green-100 text-green-600 rounded-lg">
                            <ArrowDownLeft size={16} />
                          </span>
                        ) : (
                          <span title="Saída" className="inline-block p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                            <ArrowUpRight size={16} />
                          </span>
                        )}
                      </td>
                    </tr>
                    
                    {/* Expanded Detail Row */}
                    {expandedLogId === log.id && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={8} className="px-6 py-6">
                          <div className="flex flex-col md:flex-row gap-8 animate-in fade-in slide-in-from-top-2 duration-200">
                            
                            {/* Evidence Photo */}
                            <div className="flex-shrink-0 w-48">
                              <div className="flex justify-between items-center mb-3">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                  <Camera size={12} /> Registro Visual
                                </p>
                                {log.method === 'Facial' && (
                                  <button 
                                    onClick={() => setViewingPhoto(log)}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center gap-1"
                                  >
                                    <ImageIcon size={12} /> Ver Ampliado
                                  </button>
                                )}
                              </div>
                              <div className="w-full aspect-square bg-slate-200 rounded-lg border border-slate-300 flex items-center justify-center overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all" onClick={() => log.method === 'Facial' && setViewingPhoto(log)}>
                                <img 
                                  src={`https://picsum.photos/seed/${log.id}/300/300`} 
                                  alt="Access Log Evidence" 
                                  className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                                />
                              </div>
                            </div>

                            {/* Details Grid - Two Columns */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Column 1: Technical Details */}
                              <div className="space-y-4">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 pb-1 border-b border-slate-200">
                                  <FileText size={12} /> Detalhes Técnicos
                                </p>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">ID Único:</span>
                                    <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">#{log.id}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Método de Validação:</span>
                                    <span className="text-slate-700 font-medium">{log.method}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Credencial Usada:</span>
                                    <span className="text-slate-700">{log.method === 'Facial' ? 'Biometria' : 'Token Digital'}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Operador:</span>
                                    <span className="text-slate-700">Sistema Automático (v2.1)</span>
                                  </div>
                                </div>
                              </div>

                              {/* Column 2: AI Security Analysis */}
                              <div className="space-y-4">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 pb-1 border-b border-slate-200">
                                  <Sparkles size={12} className="text-purple-500" /> Análise de Segurança (Gemini AI)
                                </p>
                                
                                {log.method === 'Facial' ? (
                                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-500">Score de Risco:</span>
                                      <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded text-xs border border-green-100">BAIXO RISCO</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-500">Correspondência:</span>
                                      <div className="flex items-center gap-2">
                                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                          <div className="h-full bg-green-500" style={{ width: `${log.confidence}%` }}></div>
                                        </div>
                                        <span className="text-slate-700 font-medium">{log.confidence}%</span>
                                      </div>
                                    </div>
                                    
                                    <div className="pt-2 border-t border-slate-50">
                                      {aiAnalysisResults[log.id] ? (
                                        <p className="text-xs text-slate-600 leading-relaxed italic bg-purple-50 p-2 rounded-lg border border-purple-100">
                                          "{aiAnalysisResults[log.id]}"
                                        </p>
                                      ) : (
                                        <button 
                                          onClick={() => handleAnalyzePhoto(log)}
                                          disabled={analyzingId === log.id}
                                          className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                          {analyzingId === log.id ? 'Analisando...' : 'Executar Análise Detalhada'}
                                          {!analyzingId && <Sparkles size={12} />}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center h-24 text-slate-400 text-sm bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                                    Análise IA indisponível para método {log.method}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Simple Pagination Mock */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
          <p className="text-sm text-slate-500">
            Mostrando <span className="font-medium text-slate-900">{filteredLogs.length}</span> resultados
          </p>
          <div className="flex gap-2">
            <button className="p-2 border border-slate-300 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50" disabled>
              <ChevronLeft size={16} />
            </button>
            <button className="p-2 border border-slate-300 rounded-lg text-slate-500 hover:bg-slate-100">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Photo Modal */}
      {viewingPhoto && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewingPhoto(null)}>
          <div className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                  <Camera size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Registro Visual de Acesso</h3>
                  <p className="text-xs text-slate-500">{viewingPhoto.timestamp} • {viewingPhoto.location}</p>
                </div>
              </div>
              <button onClick={() => setViewingPhoto(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="relative bg-black h-[500px] flex items-center justify-center group">
              <img 
                src={`https://picsum.photos/seed/${viewingPhoto.id}/800/600`} 
                alt="Captured Face" 
                className="max-h-full max-w-full object-contain"
              />
              <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full backdrop-blur-md text-xs font-bold border border-white/20">
                Log ID: #{viewingPhoto.id}
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-200">
              <div className="grid grid-cols-3 gap-6 text-sm">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <span className="text-slate-500 block text-xs uppercase font-bold mb-1">Usuário</span>
                  <span className="text-slate-900 font-bold text-lg block">{viewingPhoto.userName}</span>
                  <span className="text-slate-500 text-xs">{viewingPhoto.userType}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <span className="text-slate-500 block text-xs uppercase font-bold mb-1">Validação IA</span>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-bold text-2xl">{viewingPhoto.confidence}%</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">Positivo</span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-center">
                  <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-xs transition-colors mb-2">
                    Download Imagem
                  </button>
                  <button className="w-full py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium text-xs transition-colors">
                    Reportar Erro
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
