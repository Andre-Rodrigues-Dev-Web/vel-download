# Vel Download Bridge Extension

Extensão WebExtension para Chrome e Firefox que integra eventos de download com o Vel Download Desktop.

## Recursos
- Enviar URL para o app iniciar download via API local.
- Iniciar download no navegador e sincronizar progresso/status com o app.
- Sincronizar eventos:
  - `created`
  - `changed`
  - `erased`

## Instalação (dev)

### Chrome
1. Acesse `chrome://extensions`.
2. Ative `Modo do desenvolvedor`.
3. Clique em `Carregar sem compactação`.
4. Selecione esta pasta (`browser-extension`).

### Firefox
1. Acesse `about:debugging#/runtime/this-firefox`.
2. Clique em `Load Temporary Add-on...`.
3. Selecione `manifest.json` desta pasta.

## Configuração
Abra `Configurações da extensão` e ajuste:
- URL da API do app (padrão `http://127.0.0.1:4000`)
- Token compartilhado (opcional)
- Categoria/prioridade padrão
- Sincronização automática dos eventos de download

Se o backend usar `EXTENSION_SHARED_TOKEN`, configure o mesmo token aqui.

## Se o evento não aparecer no app
- Recarregue a extensão após atualização do código (`Reload` no Chrome/Firefox).
- Confirme nas opções que `Sincronizar eventos de download` está ativo.
- Clique em `Testar conexão` nas opções para validar `ping` com a API local.
