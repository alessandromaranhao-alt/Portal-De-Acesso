
import React, { useState, useEffect } from 'react';
import { Shield, Cpu, RefreshCw, CheckCircle, AlertTriangle, DollarSign, TrendingUp, Zap, Server, Activity, User } from 'lucide-react';
import { SystemUpdate, SecurityModule, FinancialAllocation } from '../types';
import { performSystemDiagnostics } from '../services/geminiService';

const mockUpdates: SystemUpdate[] = [
  { id: 'u1', version: '2.1.0', description: 'Protocolo de criptografia quântica para logs', type: 'security_patch', status: 'completed', aiGenerated: true, timestamp: '2023-10-24 08:00' },
  { id: 'u2', version: '2.1.1', description: 'Correção de latência em reconhecimento facial', type: 'bug_fix', status: 'completed', aiGenerated: true, timestamp: '2023-10-24 10:30' },
];

const mockModules: SecurityModule[] = [
  { id: 'm1', name: 'Reconhecimento de Placas LPR', description: 'Módulo de leitura automática de placas veiculares', status: 'active', integrationLevel: 100, lastUpdate: '2023-10-01' },
  { id: 'm2', name: 'Detecção de Drone', description: 'Radar de proximidade para drones não autorizados', status: 'active', integrationLevel: 95, lastUpdate: '2023-10-20' },
  { id: 'm3', name: 'Biometria Comportamental', description: 'Análise de padrão de caminhada', status: 'integrating', integrationLevel: 45, lastUpdate: 'Agora' },
];

const mockFinancials: FinancialAllocation = {
  totalInvestment: 2500000, // 2.5M
  creatorSharePercentage: 50,
  creatorShareValue: 1250000,
  bankDetails: {
    bank: '000 (Banco Digital Simulado)',
    branch: '0001',
    account: '0000000-0'
  },
  allocations: [
    { category: 'P&D (IA Autônoma)', amount: 750000, percentage: 30 },
    { category: 'Infraestrutura Cloud', amount: 250000, percentage: 10 },
    { category: 'Marketing', amount: 250000, percentage: 10 },
    { category: 'Share do Criador', amount: 1250000, percentage: 50 },
  ]
};

export const AutonomousSystem: React.FC = () => {
  const [updates, setUpdates] = useState<SystemUpdate[]>(mockUpdates);
  const [modules, setModules] = useState<SecurityModule[]>(mockModules);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'system' | 'financial'>('system');

  const runDiagnostics = async () => {
    setIsDiagnosing(true);
    // Simulate logs for AI analysis
    const sampleLogs = [
      "[SYSTEM] Latency spike detected in Module: FacialRecog",
      "[WARN] Unsuccessful handshake with drone radar",
      "[INFO] Auto-scaling database due to high traffic"
    ];
    
    const result = await performSystemDiagnostics(sampleLogs);
    
    setTimeout(() => {
      setDiagnosticResult(result);
      setIsDiagnosing(false);
      
      // Simulate creating a new update based on diagnostics
      const newUpdate: SystemUpdate = {
        id: `u-${Date.now()}`,
        version: '2.1.2-hotfix',
        description: 'Correção automática baseada em diagnóstico de latência',
        type: 'bug_fix',
        status: 'installing',
        aiGenerated: true,
        timestamp: new Date().toLocaleString()
      };
      setUpdates(prev => [newUpdate, ...prev]);
      
      setTimeout(() => {
        setUpdates(prev => prev.map(u => u.id === newUpdate.id ? { ...u, status: 'completed' } : u));
      }, 3000);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100 w-fit mx-auto mb-6">
        <button
          onClick={() => setActiveTab('system')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === 'system' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Cpu size={18} /> Sistema Autônomo
        </button>
        <button
          onClick={() => setActiveTab('financial')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === 'financial' ? 'bg-green-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <DollarSign size={18} /> Investimento & Shares
        </button>
      </div>

      {activeTab === 'system' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Autonomous Updates Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <RefreshCw className="text-indigo-600" size={24} /> Atualizações Autônomas
                </h3>
                <p className="text-sm text-slate-500">IA detecta e corrige falhas automaticamente.</p>
              </div>
              <button 
                onClick={runDiagnostics}
                disabled={isDiagnosing}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center gap-2"
              >
                {isDiagnosing ? <Activity className="animate-spin" size={16} /> : <Zap size={16} />}
                Executar Diagnóstico
              </button>
            </div>

            {diagnosticResult && (
              <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 animate-fade-in-down">
                <strong className="block mb-1 text-indigo-600 flex items-center gap-1"><Server size={14} /> Análise da IA:</strong>
                {diagnosticResult}
              </div>
            )}

            <div className="space-y-4">
              {updates.map(update => (
                <div key={update.id} className="flex items-start gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className={`p-2 rounded-full ${update.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    {update.status === 'completed' ? <CheckCircle size={20} /> : <RefreshCw size={20} className="animate-spin" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-slate-800">{update.description}</h4>
                      <span className="text-xs font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-600">v{update.version}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${update.type === 'security_patch' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                        {update.type === 'security_patch' ? 'Patch de Segurança' : 'Correção de Bug'}
                      </span>
                      {update.aiGenerated && (
                        <span className="text-xs flex items-center gap-1 text-purple-600 font-medium">
                          <Cpu size={12} /> Gerado por IA
                        </span>
                      )}
                      <span className="text-xs text-slate-400 ml-auto">{update.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Integration Modules Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Shield className="text-blue-600" size={24} /> Módulos de Segurança
              </h3>
              <p className="text-sm text-slate-500">Integração instantânea com novas tecnologias.</p>
            </div>

            <div className="space-y-4">
              {modules.map(module => (
                <div key={module.id} className="relative overflow-hidden p-5 border border-slate-200 rounded-xl group hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800">{module.name}</h4>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${
                      module.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {module.status === 'integrating' ? 'Integrando...' : 'Ativo'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{module.description}</p>
                  
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-blue-600">
                          Nível de Integração: {module.integrationLevel}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-100">
                      <div style={{ width: `${module.integrationLevel}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${module.status === 'integrating' ? 'bg-blue-500 animate-pulse' : 'bg-blue-600'}`}></div>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center text-slate-500 hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer">
                <p className="font-medium">+ Descobrir Novos Módulos</p>
                <p className="text-xs mt-1">A IA busca compatibilidade automaticamente</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Financial Dashboard */
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="text-green-600" size={28} /> Dashboard Financeiro
              </h2>
              <p className="text-slate-500">Visão geral de investimentos e alocação de recursos.</p>
            </div>
            <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-100">
              <span className="text-sm text-green-700 font-medium">Status da Rodada</span>
              <p className="text-xl font-bold text-green-800">Aberta para Investimento</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 bg-slate-900 rounded-2xl text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <DollarSign size={120} />
              </div>
              <p className="text-slate-400 text-sm font-medium mb-1">Total Captado (Simulado)</p>
              <h3 className="text-3xl font-bold">R$ {mockFinancials.totalInvestment.toLocaleString('pt-BR')}</h3>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-300">
                <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded">+15% este mês</span>
              </div>
            </div>

            <div className="p-6 bg-indigo-600 rounded-2xl text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <User size={120} />
              </div>
              <p className="text-indigo-200 text-sm font-medium mb-1">Share do Criador (50%)</p>
              <h3 className="text-3xl font-bold">R$ {mockFinancials.creatorShareValue.toLocaleString('pt-BR')}</h3>
              <div className="mt-4 pt-4 border-t border-indigo-500/30">
                <p className="text-xs font-mono text-indigo-200 mb-1">DADOS BANCÁRIOS VINCULADOS:</p>
                <div className="text-sm font-mono">
                  <p>Banco: {mockFinancials.bankDetails.bank}</p>
                  <p>Ag: {mockFinancials.bankDetails.branch} | CC: {mockFinancials.bankDetails.account}</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <h4 className="font-bold text-slate-800 mb-4">Alocação de Recursos</h4>
              <div className="space-y-3">
                {mockFinancials.allocations.map((alloc, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{alloc.category}</span>
                      <span className="font-medium text-slate-900">{alloc.percentage}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${idx === 3 ? 'bg-indigo-500' : 'bg-green-500'}`} 
                        style={{ width: `${alloc.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="text-amber-600 flex-shrink-0" size={24} />
            <div>
              <h4 className="font-bold text-amber-800">Aviso Legal</h4>
              <p className="text-sm text-amber-700">
                Esta é uma simulação de dashboard financeiro integrada ao sistema. Nenhuma transação bancária real é processada por esta interface. Os valores apresentados são projeções baseadas no valor de mercado da tecnologia autônoma implementada.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
