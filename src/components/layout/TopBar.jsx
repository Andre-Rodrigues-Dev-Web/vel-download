import styled from "styled-components";
import Badge from "../common/Badge";
import { useAppContext } from "../../context/AppContext";
import { formatSpeed } from "../../utils/formatters";

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 1.2rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  backdrop-filter: blur(10px);
`;

const StatusGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
`;

const Title = styled.h2`
  font-family: "Sora", sans-serif;
  font-size: 1rem;
  font-weight: 700;
`;

const Meta = styled.div`
  font-size: 0.82rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

function TopBar() {
  const { dashboard, realtimeConnected } = useAppContext();

  return (
    <Header>
      <div>
        <Title>Operação de Downloads</Title>
        <Meta>
          {dashboard.activeCount} ativos • Velocidade global {formatSpeed(dashboard.currentSpeed)}
        </Meta>
      </div>

      <StatusGroup>
        <Badge $tone={realtimeConnected ? "success" : "danger"}>
          {realtimeConnected ? "Tempo real online" : "Tempo real offline"}
        </Badge>
      </StatusGroup>
    </Header>
  );
}

export default TopBar;
