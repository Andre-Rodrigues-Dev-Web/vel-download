# Vel Download

Gerenciador de downloads desktop para Windows com foco em performance, organização e UX profissional.

## Stack
- Electron (camada desktop segura com `preload`)
- React + Styled Components (interface moderna)
- Express (API local)
- SQLite (persistência)
- Nodemon (desenvolvimento backend)

## Arquitetura
- `electron/`: processo principal e bridge segura (`contextIsolation`, `nodeIntegration: false`)
- `src/`: frontend React componentizado
- `server/src/`: API Express, serviços, rotas, repositórios e monitoramento
- `database/`: schema SQL e script de inicialização

### Estrutura de pastas

```text
vel-download/
  electron/
    main.js
    preload.js
    package.json
  server/
    package.json
    nodemon.json
    src/
      app.js
      index.js
      config/
      controllers/
      routes/
      middlewares/
      repositories/
      services/
      events/
      utils/
  src/
    components/
    context/
    hooks/
    pages/
    services/
    styles/
    utils/
  database/
    schema.sql
    init.js
  browser-extension/
    manifest.json
    background.js
    popup.html
    popup.js
    options.html
    options.js
  package.json
  vite.config.mjs
  README.md
```

## Funcionalidades implementadas
- Dashboard com métricas globais (ativos, concluídos, pausados, erros, velocidade, espaço utilizado)
- Cadastro de download por URL com validação
- Fila de downloads com prioridade e concorrência configurável
- Pausar, retomar, cancelar, remover e tentar novamente
- Atualização em tempo real via SSE
- Histórico com busca, filtros, ordenação e exportação CSV
- Integração por importação de histórico local de Chrome/Firefox (quando possível)
- Extensão WebExtension para Chrome/Firefox com comunicação local com o app
- Sincronização automática dos eventos `onCreated`, `onChanged` e `onErased` de downloads
- Monitor de pasta de downloads do sistema para registrar arquivos novos
- Configurações persistidas em SQLite (tema, concorrência, retries, notificações, etc.)
- Logs de erro e histórico de ações no banco

## Segurança
- `nodeIntegration: false`
- `contextIsolation: true`
- API Electron exposta apenas via `preload`
- Backend com validação de entrada (`zod`)
- Tratamento global de erros no Express

## Banco SQLite
O schema é aplicado automaticamente ao subir o servidor (`server/src/index.js`).

Para inicializar manualmente:

```bash
npm run db:init
```

## Como rodar (desenvolvimento)

### 1) Instalar dependências de todas as camadas

```bash
npm run install:all
```

### 2) Subir frontend + backend + Electron em conjunto

```bash
npm run dev
```

Esse comando executa:
- React (Vite) em `http://localhost:5173`
- API local (Express + Nodemon) em `http://localhost:4000`
- Electron conectado à UI local

## Comandos úteis

```bash
# Front-end
npm run dev:ui
npm run build

# Backend
npm run dev:server
npm run start:server

# Electron
npm run dev:electron
npm run start:electron

# Banco
npm run db:init
```

## Variáveis de ambiente
Use `.env` na raiz (ou copie de `.env.example`):

```env
VITE_API_BASE_URL=http://localhost:4000
SERVER_PORT=4000
MAX_CONCURRENT_DOWNLOADS=3
MAX_DOWNLOAD_RETRIES=3
DOWNLOAD_RETRY_DELAY_MS=2000
REQUEST_TIMEOUT_MS=30000
DOWNLOAD_TRANSFER_TIMEOUT_MS=0
ALLOW_INSECURE_TLS_FALLBACK=false
EXTENSION_SHARED_TOKEN=
```

## Integração com Chrome e Firefox (limitações reais)
- O app importa histórico local e metadados quando os bancos dos navegadores estão acessíveis.
- O app **não controla nativamente** a fila interna do Chrome/Firefox.
- Alguns perfis/arquivos podem estar bloqueados enquanto o navegador está em uso.
- Registros incompletos dos navegadores são importados com os metadados disponíveis.

## Extensão de Navegador (Chrome e Firefox)

### O que a extensão faz
- Inicia download no **Vel Download** ao clicar no botão da extensão.
- Opcionalmente inicia download no próprio navegador e sincroniza os eventos com o app.
- Envia eventos do navegador para a API local:
  - `created`
  - `changed`
  - `erased`

### Como instalar em desenvolvimento

1. Inicie o backend local:
```bash
npm run dev:server
```

2. Chrome:
- Acesse `chrome://extensions`
- Ative `Modo do desenvolvedor`
- Clique em `Carregar sem compactação`
- Selecione a pasta [browser-extension](D:\projetos-opensource-que-fiz\vel-download\browser-extension)

3. Firefox:
- Acesse `about:debugging#/runtime/this-firefox`
- Clique em `Load Temporary Add-on...`
- Selecione [browser-extension/manifest.json](D:\projetos-opensource-que-fiz\vel-download\browser-extension\manifest.json)

### Configurar conexão
- Abra as opções da extensão e ajuste:
  - `URL da API`: padrão `http://127.0.0.1:4000`
  - `Token compartilhado`: opcional
- Se você definir `EXTENSION_SHARED_TOKEN` no backend, o mesmo token deve ser configurado na extensão.

### Endpoints usados pela extensão
- `GET /api/browser/extension/ping`
- `POST /api/browser/extension/download`
- `POST /api/browser/extension/event`

## Troubleshooting de Download por URL
- Se o arquivo for grande, mantenha `DOWNLOAD_TRANSFER_TIMEOUT_MS=0` para não cortar a transferência por tempo total.
- Se o host tiver cadeia TLS inválida/incompleta, use `ALLOW_INSECURE_TLS_FALLBACK=true` apenas no ambiente local e sob sua responsabilidade.
- Para links protegidos por sessão/cookie do navegador, prefira iniciar pelo navegador e sincronizar via extensão, pois o app local não reutiliza automaticamente cookies autenticados do browser.

## Observações técnicas
- Retomada de download depende de suporte do servidor a `Range Requests`.
- Falhas temporárias de rede passam por retry automático (configurável).
- O projeto está pronto como base real para evolução (autenticação, empacotamento instalador, telemetry avançada e testes automatizados).
