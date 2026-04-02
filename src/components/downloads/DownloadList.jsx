import styled from "styled-components";
import DownloadItem from "./DownloadItem";
import EmptyState from "../common/EmptyState";

const List = styled.div`
  display: grid;
  gap: 0.75rem;
`;

function DownloadList({
  downloads,
  busy,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onRemove,
  onOpenFolder,
  onOpenFile
}) {
  if (!downloads.length) {
    return (
      <EmptyState
        title="Nenhum download encontrado"
        description="Adicione uma URL para começar a baixar com fila otimizada."
      />
    );
  }

  return (
    <List>
      {downloads.map((item) => (
        <DownloadItem
          key={item.id}
          item={item}
          busy={busy}
          onPause={onPause}
          onResume={onResume}
          onCancel={onCancel}
          onRetry={onRetry}
          onRemove={onRemove}
          onOpenFolder={onOpenFolder}
          onOpenFile={onOpenFile}
        />
      ))}
    </List>
  );
}

export default DownloadList;
