import styled from "styled-components";
import Card from "../common/Card";
import Button from "../common/Button";
import Badge from "../common/Badge";
import ProgressBar from "../common/ProgressBar";
import {
  formatBytes,
  formatDateTime,
  formatEta,
  formatPercent,
  formatSpeed,
  statusLabel,
  statusTone
} from "../../utils/formatters";

const ItemCard = styled(Card)`
  padding: 0.9rem;
  display: grid;
  gap: 0.65rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
`;

const Name = styled.h4`
  font-size: 0.94rem;
  font-weight: 800;
`;

const Meta = styled.p`
  margin-top: 0.24rem;
  font-size: 0.76rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;

  @media (max-width: 1150px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const Stat = styled.div`
  display: grid;
  gap: 0.16rem;
`;

const StatLabel = styled.span`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const StatValue = styled.strong`
  font-size: 0.84rem;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
`;

function DownloadItem({ item, busy, onPause, onResume, onCancel, onRetry, onRemove, onOpenFolder, onOpenFile }) {
  const progress = Number(item.progress || 0);

  const canPause = item.status === "downloading";
  const canResume = item.status === "paused";
  const canCancel = ["queued", "downloading", "paused"].includes(item.status);
  const canRetry = ["error", "canceled"].includes(item.status);
  const canRemove = ["completed", "error", "canceled", "paused"].includes(item.status);

  return (
    <ItemCard>
      <Header>
        <div>
          <Name>{item.file_name}</Name>
          <Meta>
            Origem: {item.browser_source} • Iniciado em {formatDateTime(item.started_at || item.created_at)}
          </Meta>
        </div>

        <Badge $tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
      </Header>

      <ProgressBar value={progress} />

      <Stats>
        <Stat>
          <StatLabel>Progresso</StatLabel>
          <StatValue>{formatPercent(progress)}</StatValue>
        </Stat>
        <Stat>
          <StatLabel>Velocidade</StatLabel>
          <StatValue>{formatSpeed(item.speed_bytes_per_sec)}</StatValue>
        </Stat>
        <Stat>
          <StatLabel>Tamanho</StatLabel>
          <StatValue>
            {formatBytes(item.downloaded_bytes)} / {formatBytes(item.total_bytes)}
          </StatValue>
        </Stat>
        <Stat>
          <StatLabel>Tempo restante</StatLabel>
          <StatValue>{formatEta(item.eta_seconds)}</StatValue>
        </Stat>
      </Stats>

      <Actions>
        {canPause ? (
          <Button disabled={busy} onClick={() => onPause(item.id)}>
            Pausar
          </Button>
        ) : null}

        {canResume ? (
          <Button disabled={busy} onClick={() => onResume(item.id)}>
            Retomar
          </Button>
        ) : null}

        {canCancel ? (
          <Button tone="danger" disabled={busy} onClick={() => onCancel(item.id)}>
            Cancelar
          </Button>
        ) : null}

        {canRetry ? (
          <Button disabled={busy} onClick={() => onRetry(item.id)}>
            Tentar novamente
          </Button>
        ) : null}

        <Button onClick={() => onOpenFolder(item.file_path)}>Abrir pasta</Button>
        <Button onClick={() => onOpenFile(item.file_path)}>Abrir arquivo</Button>

        {canRemove ? (
          <Button tone="ghost" disabled={busy} onClick={() => onRemove(item.id)}>
            Remover histórico
          </Button>
        ) : null}
      </Actions>
    </ItemCard>
  );
}

export default DownloadItem;
