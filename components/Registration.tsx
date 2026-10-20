
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Scan, CheckCircle, AlertCircle, Loader2, Save, Car, Phone, Smartphone, Mail, User, ArrowRight, ArrowLeft, Image as ImageIcon, Copy, ExternalLink, Trash2, FileText, X, Calendar, MapPin } from 'lucide-react';
import { analyzeDocument, analyzeFace } from '../services/geminiService';
import { GoogleGenAI, Type } from "@google/genai";
import { User as UserInterface, UserType } from '../types';
import { StorageService } from '../services/storageService';

export const Registration: React.FC = () => {
  // Input Method State
  const [activeTab, setActiveTab] = useState<'user' | 'document'>('user');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [showSuccessView, setShowSuccessView] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // Geocoding State
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  // Stepper State
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    email: '',
    phone: '',
    role: 'Morador',
    unit: '',
    address: '',
    latitude: null as number | null,
    longitude: null as number | null,
    serviceType: '',
    vehiclePlate: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleColor: '',
    commWhatsapp: true,
    commSms: true,
    commEmail: true,
    commCall: true,
    hasValidity: false,
    validityStart: '',
    validityEnd: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const geocodeAddress = async () => {
    if (!formData.address || formData.address.length < 5) return;
    
    setIsGeocoding(true);
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        console.warn("API_KEY not found");
        setIsGeocoding(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Identify the latitude and longitude for this address: "${formData.address}". Return only a JSON object.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER }
            }
          }
        }
      });

      // Safely parse JSON that might contain Markdown code blocks
      const text = response.text || '{}';
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanText);

      if (data.lat && data.lng) {
        setFormData(prev => ({
          ...prev,
          latitude: data.lat,
          longitude: data.lng
        }));
      }
    } catch (error) {
      console.error("Geocoding failed", error);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setAiResult(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1]; // Remove data url prefix

      let result;
      if (activeTab === 'document') {
        const rawJson = await analyzeDocument(base64Data);
        try {
          // Clean JSON markdown if present
          const cleanJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
          result = JSON.parse(cleanJson);
          // Store the image to show preview
          result.docImage = base64String;
        } catch (e) {
          result = { 
            raw: rawJson, 
            error: "Não foi possível processar o JSON", 
            docImage: base64String 
          };
        }
      } else {
        result = { 
          analysis: await analyzeFace(base64Data),
          tempImage: base64String 
        };
      }
      
      setAiResult(result);
      setLoading(false);
      
      // Reset input value to allow re-uploading same file if cancelled
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleApplyAiData = () => {
    if (!aiResult) return;

    if (activeTab === 'document') {
      setFormData(prev => ({
        ...prev,
        name: aiResult.name || prev.name,
        document: aiResult.documentNumber || prev.document
      }));
      
      setErrors(prev => {
        const newErrors = { ...prev };
        if (aiResult.name) delete newErrors.name;
        if (aiResult.documentNumber) delete newErrors.document;
        return newErrors;
      });
    } else if (activeTab === 'user') {
      if (aiResult.tempImage) {
        setPhotoPreview(aiResult.tempImage);
      }
    }

    setAiResult(null); // Clear result to go back to upload state
  };

  const handleDiscardAiData = () => {
    setAiResult(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoPreview(null);
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Nome completo é obrigatório';
      if (!formData.document.trim()) newErrors.document = 'Documento é obrigatório';
      if (!formData.role) newErrors.role = 'Selecione uma função';
      
      const housingRoles = ['Morador', 'Proprietário', 'Inquilino', 'Dependente'];
      if (housingRoles.includes(formData.role) && !formData.unit.trim()) {
        newErrors.unit = 'Unidade/Bloco é obrigatório';
      }
      
      if (formData.role === 'Prestador de Serviço' && !formData.serviceType.trim()) newErrors.serviceType = 'Tipo de serviço é obrigatório';

      if (formData.hasValidity) {
        if (!formData.validityStart) newErrors.validityStart = 'Data de início é obrigatória';
        if (!formData.validityEnd) newErrors.validityEnd = 'Data de fim é obrigatória';
      }
    }

    if (step === 2) {
      // Vehicle fields are optional
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      isValid = false;
    }

    return isValid;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSaveUser = () => {
    if (!validateStep(currentStep)) return;

    setSaveStatus('saving');
    
    const newUser: UserInterface = {
      id: crypto.randomUUID(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      type: formData.role as UserType,
      unit: formData.unit,
      status: 'active',
      registeredAt: new Date().toISOString(),
      photoUrl: photoPreview || undefined,
      location: formData.latitude && formData.longitude ? { lat: formData.latitude, lng: formData.longitude, address: formData.address } : undefined,
      serviceType: formData.role === 'Prestador de Serviço' ? formData.serviceType : undefined,
      vehicle: formData.vehiclePlate ? {
        plate: formData.vehiclePlate,
        make: formData.vehicleMake,
        model: formData.vehicleModel,
        color: formData.vehicleColor
      } : undefined,
      communicationPreferences: {
        whatsapp: formData.commWhatsapp,
        sms: formData.commSms,
        email: formData.commEmail,
        phoneCall: formData.commCall
      },
      validity: formData.hasValidity ? {
        start: formData.validityStart,
        end: formData.validityEnd,
        isActive: true
      } : undefined
    };

    StorageService.saveUser(newUser);

    setTimeout(() => {
      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
        setShowSuccessView(true);
      }, 1000);
    }, 1500);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      document: '',
      email: '',
      phone: '',
      role: 'Morador',
      unit: '',
      address: '',
      latitude: null,
      longitude: null,
      serviceType: '',
      vehiclePlate: '',
      vehicleMake: '',
      vehicleModel: '',
      vehicleColor: '',
      commWhatsapp: true,
      commSms: true,
      commEmail: true,
      commCall: true,
      hasValidity: false,
      validityStart: '',
      validityEnd: ''
    });
    setPhotoPreview(null);
    setAiResult(null);
    setCurrentStep(1);
    setShowSuccessView(false);
    setErrors({});
  };

  if (showSuccessView) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in-up">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-green-50 p-8 text-center border-b border-green-100">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border-4 border-green-100">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Cadastro Realizado com Sucesso!</h2>
            <p className="text-slate-600">O usuário foi salvo e as credenciais foram geradas.</p>
          </div>

          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-8">
              <div className="w-24 h-24 rounded-full bg-slate-100 flex-shrink-0 overflow-hidden border-4 border-white shadow-lg">
                {photoPreview ? (
                  <img src={photoPreview} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                    <User size={40} />
                  </div>
                )}
              </div>
              <div className="flex-1 text-center md:text-left space-y-1">
                <h3 className="text-xl font-bold text-slate-900">{formData.name}</h3>
                <p className="text-slate-500">{formData.role} • {formData.unit || 'Sem unidade'}</p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">Ativo</span>
                  {formData.vehiclePlate && (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                      {formData.vehiclePlate.toUpperCase()}
                    </span>
                  )}
                  {formData.hasValidity && (
                    <span className="px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-100">
                      Válido até {new Date(formData.validityEnd).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  {formData.latitude && (
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100 flex items-center gap-1">
                      <MapPin size={10} /> Localizado
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <Smartphone size={18} className="text-blue-500" /> Próximos Passos
                </h4>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    Convite para o app enviado via WhatsApp.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    Biometria facial sincronizada com portões.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    Permissões de veículo ativas.
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <Copy size={18} className="text-slate-400" /> Dados de Acesso
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold">ID do Usuário</label>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-slate-100 px-2 py-1 rounded text-slate-700">USR-{Math.floor(Math.random() * 10000)}</code>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold">Email Cadastrado</label>
                    <p className="text-sm text-slate-700">{formData.email || 'Não informado'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={resetForm}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <User size={18} /> Novo Cadastro
              </button>
              <button 
                onClick={() => alert("Redirecionando para lista de usuários...")}
                className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink size={18} /> Gerenciar Usuários
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* IA Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex border-b border-slate-100">
            <button
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'user' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => { setActiveTab('user'); setAiResult(null); }}
            >
              <div className="flex items-center justify-center gap-2">
                <Camera size={18} /> Cadastro Facial
              </div>
            </button>
            <button
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'document' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => { setActiveTab('document'); setAiResult(null); }}
            >
              <div className="flex items-center justify-center gap-2">
                <Scan size={18} /> Escaneamento Doc. IA
              </div>
            </button>
          </div>

          <div className="p-6">
            {!aiResult ? (
              <div 
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                  loading ? 'border-blue-300 bg-blue-50' : 'border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                }`}
                onClick={() => !loading && fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-4">
                    <Loader2 size={32} className="text-blue-600 animate-spin mb-2" />
                    <p className="text-blue-600 font-medium">Processando com Gemini AI...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Upload size={24} />
                    </div>
                    <h3 className="text-base font-medium text-slate-800">
                      {activeTab === 'user' ? 'Enviar Foto do Rosto' : 'Enviar Imagem do Documento'}
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">Clique para preencher o formulário automaticamente</p>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 animate-fade-in-down">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="text-purple-600" size={20} />
                    <h3 className="font-semibold text-slate-800">Resultado da Análise IA</h3>
                  </div>
                  <button onClick={handleDiscardAiData} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
                  </button>
                </div>

                {activeTab === 'document' ? (
                  <div className="space-y-3 mb-6">
                    {aiResult.error ? (
                      <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> {aiResult.error}
                      </div>
                    ) : (
                      <>
                        {aiResult.docImage && (
                          <div className="mb-4 rounded-lg overflow-hidden border border-slate-200 shadow-sm max-h-48 bg-slate-100 flex justify-center">
                            <img src={aiResult.docImage} alt="Documento" className="h-full object-contain" />
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <span className="text-xs text-slate-500 uppercase font-bold">Nome Identificado</span>
                            <p className="text-slate-800 font-medium">{aiResult.name || 'Não identificado'}</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <span className="text-xs text-slate-500 uppercase font-bold">Documento</span>
                            <p className="text-slate-800 font-medium">{aiResult.documentNumber || 'Não identificado'}</p>
                          </div>
                        </div>
                        {aiResult.birthDate && (
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <span className="text-xs text-slate-500 uppercase font-bold">Data de Nascimento</span>
                            <p className="text-slate-800 font-medium">{aiResult.birthDate}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start gap-4 mb-6">
                    {aiResult.tempImage && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                        <img src={aiResult.tempImage} alt="Analysis" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 bg-white p-3 rounded-lg border border-slate-200 text-sm text-slate-700">
                      {aiResult.analysis}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button 
                    onClick={handleApplyAiData}
                    disabled={activeTab === 'document' && aiResult.error}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle size={16} /> 
                    {activeTab === 'document' ? 'Aplicar Dados' : 'Usar Esta Foto'}
                  </button>
                  <button 
                    onClick={handleDiscardAiData}
                    className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-2 rounded-lg font-medium text-sm transition-colors"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Form - Stepper */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {['Dados Pessoais', 'Veículo', 'Preferências'].map((label, idx) => {
                const stepNum = idx + 1;
                const isActive = stepNum === currentStep;
                const isCompleted = stepNum < currentStep;
                
                return (
                  <div key={idx} className="text-center flex-1 relative">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-slate-400'}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
              {[1, 2, 3].map(step => (
                <div 
                  key={step}
                  className={`flex-1 transition-all duration-300 ${
                    step < currentStep ? 'bg-green-500' : 
                    step === currentStep ? 'bg-blue-600' : 'bg-transparent'
                  }`}
                />
              ))}
            </div>
          </div>

          <form onSubmit={(e) => e.preventDefault()}>
            
            {/* Step 1: Personal Data */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in-right">
                
                {/* Photo Upload Section */}
                <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div 
                    className="relative w-24 h-24 rounded-full bg-slate-200 flex-shrink-0 cursor-pointer overflow-hidden group border-4 border-white shadow-md hover:shadow-lg transition-all"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-full text-slate-400 bg-slate-100">
                        <User size={32} />
                        <span className="text-[10px] mt-1 font-medium">Foto</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={24} className="text-white" />
                    </div>
                    <input 
                      type="file" 
                      ref={photoInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handlePhotoUpload} 
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-800">Foto de Perfil</h4>
                    <p className="text-xs text-slate-500 mb-3">
                      Faça upload de uma foto clara para o perfil e reconhecimento facial. Formatos: JPG, PNG.
                    </p>
                    <div className="flex gap-3">
                      <button 
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                      >
                        <Upload size={14} /> Carregar Foto
                      </button>
                      {photoPreview && (
                        <button 
                          type="button"
                          onClick={removePhoto}
                          className="px-3 py-1.5 bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 size={14} /> Remover
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <User className="text-slate-400" size={20} />
                  <h3 className="text-lg font-semibold text-slate-800">Identificação</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo <span className="text-red-500">*</span></label>
                    <input 
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 bg-white border rounded-lg focus:ring-2 outline-none transition-all ${errors.name ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-500'}`}
                      placeholder="João Silva"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Documento (CPF/RG) <span className="text-red-500">*</span></label>
                    <input 
                      type="text"
                      name="document"
                      value={formData.document}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 bg-white border rounded-lg focus:ring-2 outline-none transition-all ${errors.document ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-500'}`}
                      placeholder="123.456.789-00"
                    />
                    {errors.document && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.document}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input 
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                      placeholder="joao@exemplo.com" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
                    <input 
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                      placeholder="(11) 99999-9999" 
                    />
                  </div>
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Função <span className="text-red-500">*</span></label>
                      <select 
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="Morador">Morador</option>
                        <option value="Proprietário">Proprietário</option>
                        <option value="Inquilino">Inquilino</option>
                        <option value="Dependente">Dependente</option>
                        <option value="Funcionário">Funcionário</option>
                        <option value="Prestador de Serviço">Prestador de Serviço</option>
                        <option value="Associado">Associado</option>
                        <option value="Administrador">Administrador</option>
                      </select>
                    </div>
                    
                    {['Morador', 'Proprietário', 'Inquilino', 'Dependente'].includes(formData.role) && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Unidade / Bloco <span className="text-red-500">*</span></label>
                        <input 
                          type="text"
                          name="unit"
                          value={formData.unit}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 bg-white border rounded-lg focus:ring-2 outline-none ${errors.unit ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-500'}`}
                          placeholder="Ap. 101 Bloco A" 
                        />
                        {errors.unit && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.unit}</p>}
                      </div>
                    )}
                    
                    {formData.role === 'Prestador de Serviço' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Serviço <span className="text-red-500">*</span></label>
                        <input 
                          type="text"
                          name="serviceType"
                          value={formData.serviceType}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 bg-white border rounded-lg focus:ring-2 outline-none ${errors.serviceType ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-500'}`}
                          placeholder="Ex: Eletricista" 
                        />
                        {errors.serviceType && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.serviceType}</p>}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo</label>
                    <div className="relative">
                      <input 
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        onBlur={geocodeAddress}
                        className="w-full pl-4 pr-10 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="Rua Exemplo, 123, Cidade - Estado" 
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isGeocoding ? (
                          <Loader2 size={18} className="text-blue-500 animate-spin" />
                        ) : formData.latitude && formData.longitude ? (
                          <MapPin size={18} className="text-green-500" />
                        ) : (
                          <MapPin size={18} className="text-slate-400" />
                        )}
                      </div>
                    </div>
                    {formData.latitude && formData.longitude && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle size={10} /> Localização confirmada
                      </p>
                    )}
                  </div>

                  {/* Validity Section */}
                  {['Morador', 'Proprietário', 'Inquilino', 'Dependente', 'Prestador de Serviço'].includes(formData.role) && (
                    <div className="md:col-span-2 pt-4 border-t border-slate-100 mt-2">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={20} className="text-slate-400" />
                          <h3 className="font-medium text-slate-800">Validade do Acesso</h3>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            name="hasValidity"
                            checked={formData.hasValidity} 
                            onChange={handleInputChange} 
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          <span className="ml-3 text-sm font-medium text-slate-600">
                            {formData.hasValidity ? 'Definido' : 'Indeterminado'}
                          </span>
                        </label>
                      </div>

                      {formData.hasValidity && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-down">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Início <span className="text-red-500">*</span></label>
                            <input 
                              type="date"
                              name="validityStart"
                              value={formData.validityStart}
                              onChange={handleInputChange}
                              className={`w-full px-4 py-2 bg-white border rounded-lg outline-none focus:ring-2 ${errors.validityStart ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-500'}`}
                            />
                            {errors.validityStart && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.validityStart}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fim <span className="text-red-500">*</span></label>
                            <input 
                              type="date"
                              name="validityEnd"
                              value={formData.validityEnd}
                              onChange={handleInputChange}
                              className={`w-full px-4 py-2 bg-white border rounded-lg outline-none focus:ring-2 ${errors.validityEnd ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-500'}`}
                            />
                            {errors.validityEnd && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.validityEnd}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Vehicle Data */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-fade-in-right">
                <div className="flex items-center gap-2 mb-4">
                  <Car className="text-slate-400" size={20} />
                  <h3 className="text-lg font-semibold text-slate-800">Dados do Veículo (Opcional)</h3>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4 text-sm text-slate-600">
                  Preencha os dados abaixo se o usuário possuir veículo autorizado para entrada.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Placa</label>
                    <input 
                      type="text"
                      name="vehiclePlate"
                      value={formData.vehiclePlate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase" 
                      placeholder="ABC-1234" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                    <input 
                      type="text"
                      name="vehicleMake"
                      value={formData.vehicleMake}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                      placeholder="Ex: Toyota" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                    <input 
                      type="text"
                      name="vehicleModel"
                      value={formData.vehicleModel}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                      placeholder="Ex: Corolla" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cor</label>
                    <input 
                      type="text"
                      name="vehicleColor"
                      value={formData.vehicleColor}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                      placeholder="Ex: Prata" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Preferences */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-fade-in-right">
                <div className="flex items-center gap-2 mb-4">
                  <Smartphone className="text-slate-400" size={20} />
                  <h3 className="text-lg font-semibold text-slate-800">Canais de Comunicação</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${formData.commWhatsapp ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:border-blue-200'}`}>
                    <input type="checkbox" name="commWhatsapp" checked={formData.commWhatsapp} onChange={handleInputChange} className="mt-1 rounded text-blue-600 focus:ring-blue-500" />
                    <div>
                      <span className="text-sm font-bold text-slate-800 flex items-center gap-2"><Smartphone size={16} /> WhatsApp</span>
                      <p className="text-xs text-slate-500 mt-1">Receber QR Codes e autorizações de visitantes.</p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${formData.commCall ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:border-blue-200'}`}>
                    <input type="checkbox" name="commCall" checked={formData.commCall} onChange={handleInputChange} className="mt-1 rounded text-blue-600 focus:ring-blue-500" />
                    <div>
                      <span className="text-sm font-bold text-slate-800 flex items-center gap-2"><Phone size={16} /> Ligação Telefônica</span>
                      <p className="text-xs text-slate-500 mt-1">Para emergências ou quando não houver internet.</p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${formData.commEmail ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:border-blue-200'}`}>
                    <input type="checkbox" name="commEmail" checked={formData.commEmail} onChange={handleInputChange} className="mt-1 rounded text-blue-600 focus:ring-blue-500" />
                    <div>
                      <span className="text-sm font-bold text-slate-800 flex items-center gap-2"><Mail size={16} /> Email</span>
                      <p className="text-xs text-slate-500 mt-1">Notificações gerais, avisos e boletos.</p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${formData.commSms ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:border-blue-200'}`}>
                    <input type="checkbox" name="commSms" checked={formData.commSms} onChange={handleInputChange} className="mt-1 rounded text-blue-600 focus:ring-blue-500" />
                    <div>
                      <span className="text-sm font-bold text-slate-800 flex items-center gap-2">SMS</span>
                      <p className="text-xs text-slate-500 mt-1">Fallback para notificações críticas.</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between">
              <button 
                type="button" 
                onClick={prevStep}
                disabled={currentStep === 1 || saveStatus === 'saving'}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${
                  currentStep === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ArrowLeft size={18} /> Voltar
              </button>

              {currentStep < totalSteps ? (
                <button 
                  type="button" 
                  onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                >
                  Próximo <ArrowRight size={18} />
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={handleSaveUser}
                  disabled={saveStatus === 'saving'}
                  className={`flex items-center gap-2 px-8 py-2.5 font-bold rounded-lg transition-all shadow-md ${
                    saveStatus === 'saving' ? 'bg-blue-400 text-white cursor-wait' : 
                    saveStatus === 'success' ? 'bg-green-600 text-white' :
                    'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {saveStatus === 'saving' ? (
                    <><Loader2 size={20} className="animate-spin" /> Salvando...</>
                  ) : saveStatus === 'success' ? (
                    <><CheckCircle size={20} /> Salvo!</>
                  ) : (
                    <><Save size={20} /> Concluir Cadastro</>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Side Stats */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Resumo do Sistema</h3>
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-sm text-slate-500">Total Registrado</p>
            <p className="text-xl font-bold text-slate-800">1.248</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
            <p className="text-sm text-amber-700 font-medium">Análise Pendente</p>
            <p className="text-xl font-bold text-amber-800">12</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-100">
            <p className="text-sm text-red-700 font-medium">Bloqueados/Rejeitados</p>
            <p className="text-xl font-bold text-red-800">5</p>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-slate-100">
          <h4 className="font-medium text-slate-800 mb-3 text-sm uppercase tracking-wide">Cadastros Recentes</h4>
          <ul className="space-y-3">
            {[1, 2, 3].map(i => (
              <li key={i} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-default">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">JS</div>
                <div>
                  <p className="text-sm font-medium text-slate-800">João Silva</p>
                  <p className="text-xs text-slate-500">Morador • Unidade 402</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const SparklesIcon: React.FC<{className?: string, size?: number}> = ({className, size}) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
  </svg>
);
