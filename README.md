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
```

## Integração com Chrome e Firefox (limitações reais)
- O app importa histórico local e metadados quando os bancos dos navegadores estão acessíveis.
- O app **não controla nativamente** a fila interna do Chrome/Firefox.
- Alguns perfis/arquivos podem estar bloqueados enquanto o navegador está em uso.
- Registros incompletos dos navegadores são importados com os metadados disponíveis.

## Observações técnicas
- Retomada de download depende de suporte do servidor a `Range Requests`.
- Falhas temporárias de rede passam por retry automático (configurável).
- O projeto está pronto como base real para evolução (autenticação, empacotamento instalador, telemetry avançada e testes automatizados).
