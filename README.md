<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# 🛡️ AML Security Solutions — Portaria Inteligente & Controle de Acesso Autônomo

**Solução completa de portaria inteligente para condomínios e edifícios corporativos integrada à Inteligência Artificial (Google Gemini 2.5 Flash).**
</div>

---

## 🚀 Principais Funcionalidades

- **Controle de Acesso em Tempo Real:** Liberação de portões e catracas, leitura de QR Code via câmera e validação biométrica/facial.
- **QR Code Criptografado com Assinatura Digital:** Tokens de acesso dinâmicos com expiração temporal (TTL) e assinatura criptográfica baseada em HMAC-SHA256 para evitar fraudes ou clonagens.
- **Cadastro Inteligente de Moradores e Visitantes:**
  - **OCR de Documentos via IA:** Leitura e extração estruturada de RG, CNH e CPF através de visão computacional multimodal do Gemini 2.5 Flash.
  - **Validação Facial e Biometria:** Triagem de imagem com detecção de nitidez e estimativa etária.
  - **Geolocalização:** Identificação de coordenadas a partir de endereços.
- **Gestão de Unidades e Moradores:** Mapeamento de apartamentos/casas com veículos, placas, dependentes e animais de estimação vinculados.
- **Logística & Operação:** Controle de recebimento e entrega de encomendas e reserva de áreas comuns.
- **Auditoria e Histórico:** Logs detalhados com exportação em CSV, filtros dinâmicos e análise de conformidade.
- **Persistência de Dados Integrada:** Armazenamento contínuo em `localStorage` para manter cadastros e eventos entre sessões.
- **Servidor Proxy Seguro:** Proteção de chaves de API com proxy backend dedicado em Node.js (`server/index.js`).

---

## 🏗️ Arquitetura do Sistema

```
├── components/          # Componentes visuais da interface (Dashboard, Portaria, Cadastros)
├── server/
│   └── index.js         # Servidor backend seguro para proxy da API Google Gemini
├── services/
│   ├── geminiService.ts # Camada de integração com IA (OCR, análise facial e diagnóstico)
│   ├── qrService.ts     # Geração e validação de tokens QR com HMAC-SHA256
│   └── storageService.ts# Camada de persistência local para dados do sistema
├── types.ts             # Modelos e definições de dados em TypeScript
├── App.tsx              # Componente raiz e orquestrador de visões
├── index.html           # Ponto de entrada com carregamento Vite
└── vite.config.ts       # Configurações do Vite e proxy reverso para /api
```

---

## 🛠️ Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- Chave de API do [Google AI Studio](https://aistudio.google.com/)

### 1. Instalação das Dependências
```bash
npm install
```

### 2. Configurar a Chave de API
Crie um arquivo `.env.local` na raiz do projeto:
```env
GEMINI_API_KEY=sua_chave_gemini_aqui
```

### 3. Executar o Backend Seguro (Proxy)
Em um terminal, inicie o servidor backend que protege sua chave de API:
```bash
npm run server
```
*O servidor iniciará em `http://localhost:3001`.*

### 4. Executar o Frontend (Vite)
Em outro terminal:
```bash
npm run dev
```
Acesse a aplicação no seu navegador em: `http://localhost:3000`.

---

## 🔒 Segurança Implementada

1. **Tokens QR com Validação de Integridade:** Cada QR Code gerado contém um hash criptográfico SHA-256 combinando tipo de acesso, identificador, nome, expiração e salt de segurança. Qualquer tentativa de alteração manual invalida o acesso.
2. **Desacoplamento de Segredos:** A chave privada da API Gemini é mantida preferencialmente no servidor proxy, evitando vazamento no bundle JavaScript do navegador.
3. **Dados Sensíveis Sanitizados:** Não há credenciais, dados bancários reais ou informações confidenciais expostas no código público.
