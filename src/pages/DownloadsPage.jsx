import { useMemo, useState } from "react";
import styled from "styled-components";
import DownloadForm from "../components/downloads/DownloadForm";
import DownloadList from "../components/downloads/DownloadList";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import { useAppContext } from "../context/AppContext";
import { openPath, showItemInFolder } from "../services/desktopService";

const Page = styled.div`
  display: grid;
  gap: 1rem;
`;

const Toolbar = styled(Card)`
  padding: 0.8rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.7rem;
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

const Input = styled.input`
  min-width: 250px;
  padding: 0.5rem 0.65rem;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.panelBackground};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const Select = styled.select`
  padding: 0.5rem 0.65rem;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.panelBackground};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const Alert = styled.p`
  color: ${({ theme }) => theme.colors.danger};
  font-size: 0.8rem;
  font-weight: 700;
`;

function DownloadsPage() {
  const {
    downloads,
    settings,
    errorMessage,
    addDownload,
    pause,
    resume,
    cancel,
    retry,
    remove,
    clearCompleted,
    importBrowser
  } = useAppContext();

  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredDownloads = useMemo(() => {
    return downloads.filter((item) => {
      const matchesSearch =
        !search || item.file_name.toLowerCase().includes(search.toLowerCase()) || item.url.includes(search);
      const matchesStatus = !statusFilter || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [downloads, search, statusFilter]);

  async function runAction(handler, options = {}) {
    setBusy(true);
    try {
      await handler();
    } catch (error) {
      if (options.throwError) {
        throw error;
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleOpenFolder(filePath) {
    if (!filePath) return;
    await showItemInFolder(filePath);
  }

  async function handleOpenFile(filePath) {
    if (!filePath) return;
    await openPath(filePath);
  }

  return (
    <Page>
      <DownloadForm
        defaultTargetDir={settings.defaultDownloadDir}
        onSubmit={(payload) => runAction(() => addDownload(payload), { throwError: true })}
        busy={busy}
      />

      <Toolbar>
        <Left>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar em tempo real por nome ou URL"
          />

          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">Todos os status</option>
            <option value="queued">Na fila</option>
            <option value="downloading">Baixando</option>
            <option value="paused">Pausado</option>
            <option value="completed">Concluído</option>
            <option value="error">Erro</option>
            <option value="canceled">Cancelado</option>
          </Select>
        </Left>

        <Left>
          <Button onClick={() => runAction(() => importBrowser("chrome"))}>Importar Chrome</Button>
          <Button onClick={() => runAction(() => importBrowser("firefox"))}>Importar Firefox</Button>
          <Button onClick={() => runAction(() => importBrowser("all"))}>Sincronizar tudo</Button>
          <Button tone="ghost" onClick={() => runAction(() => clearCompleted())}>
            Limpar concluídos
          </Button>
        </Left>
      </Toolbar>

      {errorMessage ? <Alert>{errorMessage}</Alert> : null}

      <DownloadList
        downloads={filteredDownloads}
        busy={busy}
        onPause={(id) => runAction(() => pause(id))}
        onResume={(id) => runAction(() => resume(id))}
        onCancel={(id) => runAction(() => cancel(id))}
        onRetry={(id) => runAction(() => retry(id))}
        onRemove={(id) => runAction(() => remove(id))}
        onOpenFolder={handleOpenFolder}
        onOpenFile={handleOpenFile}
      />
    </Page>
  );
}

export default DownloadsPage;
