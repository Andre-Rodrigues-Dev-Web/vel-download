import { useMemo } from "react";
import styled from "styled-components";
import StatCard from "../components/dashboard/StatCard";
import Card from "../components/common/Card";
import Badge from "../components/common/Badge";
import { useAppContext } from "../context/AppContext";
import { formatBytes, formatDateTime, formatSpeed, statusLabel, statusTone } from "../utils/formatters";

const Page = styled.div`
  display: grid;
  gap: 1rem;
`;

const Grid = styled.section`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.8rem;

  @media (max-width: 1450px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 860px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const RecentCard = styled(Card)`
  padding: 1rem;
  display: grid;
  gap: 0.8rem;
`;

const Title = styled.h3`
  font-family: "Sora", sans-serif;
  font-size: 0.98rem;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;
  padding: 0.66rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const Name = styled.strong`
  font-size: 0.86rem;
`;

const Meta = styled.p`
  font-size: 0.74rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Alert = styled.p`
  color: ${({ theme }) => theme.colors.danger};
  font-size: 0.8rem;
  font-weight: 700;
`;

function DashboardPage() {
  const { downloads, dashboard, loading, errorMessage } = useAppContext();

  const recent = useMemo(() => downloads.slice(0, 8), [downloads]);

  return (
    <Page>
      {errorMessage ? <Alert>{errorMessage}</Alert> : null}

      <Grid>
        <StatCard label="Downloads ativos" value={dashboard.activeCount} caption="Transferências em andamento" />
        <StatCard label="Concluídos" value={dashboard.completedCount} caption="Downloads finalizados" />
        <StatCard label="Pausados" value={dashboard.pausedCount} caption="Aguardando retomada" />
        <StatCard label="Com erro" value={dashboard.errorCount} caption="Falhas para reprocessar" />
        <StatCard label="Velocidade global" value={formatSpeed(dashboard.currentSpeed)} caption="Taxa total atual" />
        <StatCard label="Espaço utilizado" value={formatBytes(dashboard.usedSpace)} caption="Volume ocupado" />
      </Grid>

      <RecentCard>
        <Title>Atividade Recente</Title>

        {loading ? <Meta>Carregando dados...</Meta> : null}

        {!loading &&
          recent.map((item) => (
            <Row key={item.id}>
              <div>
                <Name>{item.file_name}</Name>
                <Meta>
                  {item.browser_source} • {formatDateTime(item.started_at || item.created_at)}
                </Meta>
              </div>

              <div style={{ display: "grid", justifyItems: "end", gap: "0.3rem" }}>
                <Badge $tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
                <Meta>{formatBytes(item.downloaded_bytes)} / {formatBytes(item.total_bytes)}</Meta>
              </div>
            </Row>
          ))}
      </RecentCard>
    </Page>
  );
}

export default DashboardPage;
