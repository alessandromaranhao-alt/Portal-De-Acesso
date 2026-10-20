
import React, { useState, useRef, useEffect } from 'react';
import { Lock, Unlock, Phone, MessageCircle, AlertTriangle, Video, X, Clock, CheckCircle, RefreshCw, ScanLine, AlertCircle, Smartphone, User, Briefcase, Wrench, LogIn, LogOut, XCircle, Camera, CameraOff, Share2, Timer, Check, ScanFace } from 'lucide-react';
import { Visitor, QRCodePayload } from '../types';
import { validateQRToken, generateDynamicQRToken } from '../services/qrService';
import { StorageService } from '../services/storageService';
import { AccessStatus, UserType } from '../types';
import { analyzeFace } from '../services/geminiService';

// Mock pending visitors for demonstration
const mockPendingVisitors: Visitor[] = [
  { 
    id: 'p1', 
    name: 'Técnico Internet (Vivo)', 
    hostId: '101', 
    hostName: 'João Silva', 
    hostUnit: '101', 
    purpose: 'Manutenção', 
    expectedDate: 'Agora', 
    status: 'scheduled', 
    authorizationMethod: 'email_request', 
    approvalStatus: 'pending_email' 
  },
  { 
    id: 'p2', 
    name: 'Entregador Mobília', 
    hostId: '305', 
    hostName: 'Maria Santos', 
    hostUnit: '305', 
    purpose: 'Entrega', 
    expectedDate: '14:00', 
    status: 'scheduled', 
    authorizationMethod: 'whatsapp_request', 
    approvalStatus: 'pending_whatsapp' 
  },
  { 
    id: 'p3', 
    name: 'Visitante Marcos', 
    hostId: '202', 
    hostName: 'Carlos Oliveira', 
    hostUnit: '202', 
    purpose: 'Visita', 
    expectedDate: '15:30', 
    status: 'scheduled', 
    authorizationMethod: 'sms_request', 
    approvalStatus: 'pending_sms' 
  }
];

export const AccessControl: React.FC = () => {
  const [gateStatus, setGateStatus] = useState<'locked' | 'unlocked'>('locked');
  const [logs, setLogs] = useState<string[]>([]);
  const [showPanicModal, setShowPanicModal] = useState(false);
  const [pendingVisitors, setPendingVisitors] = useState<Visitor[]>(mockPendingVisitors);
  
  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Scanner State
  const [showScanner, setShowScanner] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState<{valid: boolean, msg: string, detail?: string, data?: QRCodePayload} | null>(null);
  const [scanDirection, setScanDirection] = useState<'entry' | 'exit'>('entry');
  const [qrTimeLeft, setQrTimeLeft] = useState<string>('');

  // Facial Recognition State
  const [isAnalyzingFace, setIsAnalyzingFace] = useState(false);

  // Approval Animation State
  const [approvingVisitorId, setApprovingVisitorId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Timer for QR Code Validity
  useEffect(() => {
    let interval: any;
    if (scanResult?.valid && scanResult.data?.exp) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = scanResult.data!.exp - now;
        
        if (diff <= 0) {
          setQrTimeLeft('EXPIRADO');
          setScanResult(prev => prev ? { ...prev, valid: false, msg: 'QR Code Expirou' } : null);
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setQrTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [scanResult]);

  const addLog = (msg: string) => {
    const now = new Date();
    const timestamp = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`;
    setLogs(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 50));
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const toggleCamera = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const captureAndAnalyzeFace = async () => {
    if (!videoRef.current || !isCameraActive) {
      alert("Ative a câmera primeiro.");
      return;
    }

    setIsAnalyzingFace(true);
    addLog("Iniciando reconhecimento facial...");

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      
      const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
      
      const analysisResult = await analyzeFace(base64Image);
      
      // Simple mock logic: if the analysis is successful (string returned), treat as recognized for demo
      if (analysisResult && !analysisResult.includes("Erro") && !analysisResult.includes("Falha")) {
        setScanResult({
          valid: true,
          msg: "Reconhecimento Facial: Sucesso",
          detail: `IA: ${analysisResult.slice(0, 100)}...`
        });
        setShowScanner(true); // Reuse scanner modal to show result
        addLog(`[FACIAL] Reconhecido: ${analysisResult.slice(0, 50)}...`);
        unlockGate(`Facial Auth - IA Detectou Rosto`);
      } else {
        alert("Rosto não identificado ou erro na análise.");
        addLog(`[FACIAL] Falha: ${analysisResult}`);
      }

    } catch (error) {
      console.error("Facial Analysis Error", error);
      alert("Erro ao processar imagem.");
    } finally {
      setIsAnalyzingFace(false);
    }
  };

  const unlockGate = (reason: string) => {
    if (gateStatus === 'unlocked') return;

    setGateStatus('unlocked');
    addLog(`LIBERAÇÃO AUTORIZADA: ${reason} -> Portão Aberto`);
    
    // Auto lock after 5 seconds
    setTimeout(() => {
      setGateStatus('locked');
      addLog('AUTO-LOCK: Portão trancado automaticamente');
    }, 5000);
  };

  const toggleGate = () => {
    if (gateStatus === 'locked') {
      unlockGate('Acionamento Manual (Botão)');
    } else {
      setGateStatus('locked');
      addLog('MANUAL: Portão Trancado');
    }
  };

  const handleCall = () => {
    addLog('Ligando para Morador (Unidade 101)...');
    alert('Simulando Chamada VoIP para Unidade 101...');
  };

  const handleWhatsApp = () => {
    addLog('Enviando solicitação de autorização via WhatsApp para Proprietário...');
    alert('Mensagem WhatsApp enviada! Aguardando resposta...');
  };

  const confirmPanic = () => {
    const now = new Date();
    const location = "Portaria Principal";
    const timestamp = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`;
    
    addLog(`🚨 [ALERTA CRÍTICO] BOTÃO DE PÂNICO ACIONADO em ${location} às ${timestamp}`);
    alert('Alerta enviado para: Segurança Central, Polícia, Síndico.');
    setShowPanicModal(false);
  };

  const handleForceApprove = (visitorId: string, visitorName: string) => {
    // Start animation
    setApprovingVisitorId(visitorId);
    
    addLog(`[ENTRADA] Aprovação manual forçada para: ${visitorName}`);
    
    // Delay removal to show animation
    setTimeout(() => {
      setPendingVisitors(prev => prev.filter(v => v.id !== visitorId));
      setApprovingVisitorId(null);
      
      // Automatically unlock gate upon manual approval
      unlockGate(`Liberação Manual - ${visitorName}`);
    }, 1500); // 1.5s delay for animation
  };

  const handleResend = (visitor: Visitor) => {
    let msg = '';
    if (visitor.authorizationMethod === 'whatsapp_request') msg = 'WhatsApp';
    else if (visitor.authorizationMethod === 'sms_request') msg = 'SMS';
    else msg = 'Email';
    
    addLog(`Reenviando ${msg} de autorização para: ${visitor.hostName}`);
    alert(`${msg} reenviado para ${visitor.hostName}.`);
  };

  const resetScanner = () => {
    setScanInput('');
    setScanResult(null);
    setQrTimeLeft('');
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput) return;

    const result = validateQRToken(scanInput);
    const dirLabel = scanDirection === 'entry' ? 'ENTRADA' : 'SAÍDA';
    
    if (result.isValid) {
      const userDetail = result.data ? `${result.data.nm} (${result.data.t})` : '';
      setScanResult({ 
        valid: true, 
        msg: 'Acesso Permitido', 
        detail: userDetail,
        data: result.data
      });
      addLog(`[${dirLabel}] ACESSO PERMITIDO (${result.data?.t?.toUpperCase()}): ${result.data?.nm}`);
      unlockGate(`Validação QR (${dirLabel}) - ${result.data?.nm}`);
    } else {
      setScanResult({ 
        valid: false, 
        msg: 'Acesso Negado',
        detail: result.message
      });
      addLog(`[${dirLabel}] ACESSO NEGADO (QR): ${result.message}`);
    }
  };

  const simulateRoleAccess = (type: 'resident' | 'employee' | 'provider', name: string) => {
    // Generate valid token
    const token = generateDynamicQRToken('sim-id', name, type, 24, '101');
    setScanInput(token);
    
    // Trigger validation logic
    const result = validateQRToken(token);
    const dirLabel = scanDirection === 'entry' ? 'ENTRADA' : 'SAÍDA';

    if (result.isValid) {
      const userDetail = result.data ? `${result.data.nm} (${result.data.t})` : '';
      setScanResult({ 
        valid: true, 
        msg: 'Acesso Permitido', 
        detail: userDetail,
        data: result.data
      });
      addLog(`[${dirLabel}] ACESSO PERMITIDO (${type.toUpperCase()}): ${result.data?.nm}`);
      unlockGate(`Simulação Auto (${dirLabel}) - ${result.data?.nm}`);
    }
  };

  const handleShareToken = async () => {
    if (!scanResult?.valid) return;
    
    const shareData = {
      title: 'Acesso Portaria',
      text: `Acesso liberado para: ${scanResult.detail}`,
      url: window.location.href // In a real app this might be a deeplink
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      // Fallback copy to clipboard
      navigator.clipboard.writeText(`TOKEN DE ACESSO: ${scanResult.detail} - Válido até: ${qrTimeLeft}`);
      alert("Detalhes do acesso copiados para a área de transferência.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
      {/* Live Feed Placeholder */}
      <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg relative h-[400px] flex items-center justify-center group">
        {/* Video Element */}
        <video 
          ref={videoRef}
          autoPlay 
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isCameraActive ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {!isCameraActive && (
          <img 
            src="https://picsum.photos/800/600" 
            alt="CCTV Feed Placeholder" 
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
        )}

        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded animate-pulse flex items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-full"></div> AO VIVO
          </div>
          <button 
            onClick={toggleCamera}
            className="bg-black/50 hover:bg-black/70 text-white p-1 rounded-md backdrop-blur-sm transition-colors"
            title={isCameraActive ? "Desativar Câmera" : "Ativar Câmera"}
          >
            {isCameraActive ? <CameraOff size={14} /> : <Camera size={14} />}
          </button>
        </div>

        {/* Scan Face Button */}
        {isCameraActive && !showScanner && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={captureAndAnalyzeFace}
              disabled={isAnalyzingFace}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all backdrop-blur-md shadow-lg ${
                isAnalyzingFace ? 'bg-blue-600/80 cursor-wait' : 'bg-blue-600/50 hover:bg-blue-600'
              }`}
            >
              {isAnalyzingFace ? (
                <>Processando...</>
              ) : (
                <><ScanFace size={14} /> Scan Facial IA</>
              )}
            </button>
          </div>
        )}

        {!showScanner ? (
          <div className="z-10 text-center pointer-events-none">
            {!isCameraActive && (
              <>
                <Video size={48} className="text-white mx-auto mb-2 opacity-80" />
                <p className="text-slate-200 font-medium">Câmera Portão Principal</p>
                <p className="text-slate-400 text-xs mt-1">Feed Simulado (Ative a câmera para real)</p>
              </>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 bg-slate-800/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 z-20">
            {scanResult ? (
              <div className="flex flex-col items-center justify-center w-full max-w-sm animate-in zoom-in duration-300">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-2xl ${
                  scanResult.valid ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {scanResult.valid ? <CheckCircle size={64} className="animate-pulse" /> : <XCircle size={64} />}
                </div>
                
                <h3 className={`text-2xl font-bold mb-2 ${scanResult.valid ? 'text-green-400' : 'text-red-400'}`}>
                  {scanResult.msg}
                </h3>
                
                <p className="text-slate-300 text-center mb-4 text-lg px-4 bg-slate-900/50 py-2 rounded-lg border border-slate-700 w-full">
                  {scanResult.detail}
                </p>

                {/* Validity Countdown */}
                {scanResult.valid && qrTimeLeft && (
                  <div className="flex items-center gap-2 text-yellow-400 bg-yellow-400/10 px-4 py-2 rounded-lg border border-yellow-400/20 mb-6 font-mono font-bold">
                    <Timer size={18} />
                    <span>Expira em: {qrTimeLeft}</span>
                  </div>
                )}

                <div className="flex gap-3 w-full">
                  <button 
                    onClick={resetScanner}
                    className="flex-1 px-4 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 shadow-lg"
                  >
                    <RefreshCw size={20} /> Nova Leitura
                  </button>
                  
                  {scanResult.valid && (
                    <button 
                      onClick={handleShareToken}
                      className="px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
                      title="Compartilhar Token"
                    >
                      <Share2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                  <ScanLine /> Simulador de Scanner
                </h3>
                
                {/* Direction Toggle */}
                <div className="flex bg-slate-700 p-1 rounded-lg mb-4 w-full max-w-sm">
                  <button 
                    onClick={() => setScanDirection('entry')}
                    className={`flex-1 py-1.5 text-sm font-medium rounded flex items-center justify-center gap-2 transition-all ${scanDirection === 'entry' ? 'bg-green-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
                  >
                    <LogIn size={14} /> Entrada
                  </button>
                  <button 
                    onClick={() => setScanDirection('exit')}
                    className={`flex-1 py-1.5 text-sm font-medium rounded flex items-center justify-center gap-2 transition-all ${scanDirection === 'exit' ? 'bg-orange-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
                  >
                    <LogOut size={14} /> Saída
                  </button>
                </div>

                <form onSubmit={handleScanSubmit} className="w-full max-w-sm">
                  <input 
                    type="text" 
                    autoFocus
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    placeholder="Cole o token do QR Code aqui..." 
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none mb-4"
                  />
                  <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg">
                    Validar Acesso
                  </button>
                </form>
                
                {/* Quick Access Simulation Buttons */}
                <div className="mt-4 flex gap-2 w-full max-w-sm justify-center flex-wrap">
                  <button 
                    onClick={() => simulateRoleAccess('resident', 'Ana Silva (Moradora)')}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded flex items-center gap-1 transition-colors"
                    title="Simular Morador"
                  >
                    <User size={12} /> Morador
                  </button>
                  <button 
                    onClick={() => simulateRoleAccess('employee', 'Ricardo (Segurança)')}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded flex items-center gap-1 transition-colors"
                    title="Simular Funcionário"
                  >
                    <Briefcase size={12} /> Func.
                  </button>
                  <button 
                    onClick={() => simulateRoleAccess('provider', 'Fernando (Técnico)')}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded flex items-center gap-1 transition-colors"
                    title="Simular Prestador"
                  >
                    <Wrench size={12} /> Prestador
                  </button>
                </div>

                <button 
                  onClick={() => setShowScanner(false)}
                  className="mt-6 text-slate-400 hover:text-white text-sm"
                >
                  Cancelar Scanner
                </button>
              </>
            )}
          </div>
        )}
        
        {/* Quick Actions Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 flex justify-center gap-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
           <button 
            onClick={toggleGate}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              gateStatus === 'locked' 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {gateStatus === 'locked' ? <Unlock size={20} /> : <Lock size={20} />}
            {gateStatus === 'locked' ? 'Destrancar Portão' : 'Trancar Portão'}
          </button>
          
          <button 
            onClick={() => { setShowScanner(true); resetScanner(); }}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all"
          >
            <ScanLine size={20} />
            Escanear QR
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Controls */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Comunicação & Ação</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={handleCall}
              className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            >
              <div className="p-3 bg-blue-100 text-blue-600 rounded-full mb-2">
                <Phone size={24} />
              </div>
              <span className="font-medium text-slate-700">Ligar p/ Morador</span>
            </button>

            <button 
              onClick={handleWhatsApp}
              className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            >
              <div className="p-3 bg-green-100 text-green-600 rounded-full mb-2">
                <MessageCircle size={24} />
              </div>
              <span className="font-medium text-slate-700">Autorizar WhatsApp</span>
            </button>

            <button 
              onClick={() => setShowPanicModal(true)}
              className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-red-50 rounded-xl border border-slate-200 hover:border-red-200 transition-colors group"
            >
              <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full mb-2 group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                <AlertTriangle size={24} />
              </div>
              <span className="font-medium text-slate-700 group-hover:text-red-600 transition-colors">Botão Pânico</span>
            </button>

             <button className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-full mb-2">
                <Lock size={24} />
              </div>
              <span className="font-medium text-slate-700">Bloqueio Total</span>
            </button>
          </div>
        </div>

        {/* Pending Authorizations */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-purple-600" />
            Autorizações Pendentes
          </h3>
          
          <div className="space-y-3 max-h-[200px] overflow-y-auto">
            {pendingVisitors.length === 0 && <p className="text-sm text-slate-500">Nenhuma autorização pendente.</p>}
            
            {pendingVisitors.map(visitor => (
              <div key={visitor.id} className={`p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between transition-all duration-300 ${approvingVisitorId === visitor.id ? 'bg-green-50 border-green-200 scale-[1.02] shadow-sm' : ''}`}>
                <div className="flex-1">
                  {approvingVisitorId === visitor.id ? (
                    <div className="flex items-center gap-2 text-green-600 animate-in fade-in zoom-in duration-300">
                      <CheckCircle size={20} />
                      <span className="font-bold">Aprovado! Liberando acesso...</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-slate-900">{visitor.name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        Visita: {visitor.hostName} (Unid. {visitor.hostUnit})
                        {visitor.authorizationMethod === 'whatsapp_request' && <MessageCircle size={10} className="text-green-500 ml-1" />}
                        {visitor.authorizationMethod === 'sms_request' && <Smartphone size={10} className="text-blue-500 ml-1" />}
                      </p>
                    </>
                  )}
                </div>
                {approvingVisitorId !== visitor.id && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleResend(visitor)}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors" 
                      title="Reenviar Solicitação"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button 
                      onClick={() => handleForceApprove(visitor.id, visitor.name)}
                      className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors" 
                      title="Aprovar Manualmente e Liberar Acesso"
                    >
                      <CheckCircle size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Logs */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[200px] flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Logs do Controlador</h3>
          <div className="flex-1 overflow-y-auto space-y-2 bg-slate-900 rounded-lg p-4 font-mono text-sm">
            {logs.length === 0 && <span className="text-slate-500">Sistema Pronto. Nenhuma ação ainda.</span>}
            {logs.map((log, i) => (
              <div key={i} className={`border-b border-slate-800 pb-1 last:border-0 ${log.includes('CRÍTICO') ? 'text-red-400 font-bold' : 'text-green-400'}`}>
                <span className="text-slate-500 mr-2">&gt;</span>{log}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panic Modal */}
      {showPanicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-bounce-in">
            <div className="bg-red-600 p-6 text-white text-center">
              <div className="mx-auto w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4 border-4 border-red-400">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-1">Confirmar Pânico?</h3>
              <p className="text-red-100 text-sm">Isso alertará imediatamente as autoridades e a segurança central.</p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <button 
                  onClick={confirmPanic}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-lg transition-colors flex items-center justify-center gap-2"
                >
                  <AlertTriangle size={24} />
                  CONFIRMAR ALERTA
                </button>
                <button 
                  onClick={() => setShowPanicModal(false)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
