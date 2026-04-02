import styled from "styled-components";
import Card from "../common/Card";
import Button from "../common/Button";
import Badge from "../common/Badge";
import EmptyState from "../common/EmptyState";
import { formatBytes, formatDateTime, formatPercent, statusLabel, statusTone } from "../../utils/formatters";

const Wrapper = styled(Card)`
  overflow: hidden;
`;

const TableWrap = styled.div`
  width: 100%;
  overflow: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 980px;

  thead {
    background: ${({ theme }) => `${theme.colors.panelBackground}cc`};
  }

  th,
  td {
    text-align: left;
    padding: 0.75rem;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    font-size: 0.8rem;
  }

  th {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-weight: 800;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
`;

function HistoryTable({ items, loading, onRetry, onRemove }) {
  if (!loading && !items.length) {
    return (
      <EmptyState
        title="Histórico vazio"
        description="Não há registros para os filtros aplicados."
      />
    );
  }

  return (
    <Wrapper>
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <th>Arquivo</th>
              <th>Origem</th>
              <th>Status</th>
              <th>Progresso</th>
              <th>Tamanho</th>
              <th>Data início</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.file_name}</td>
                <td>{item.browser_source}</td>
                <td>
                  <Badge $tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
                </td>
                <td>{formatPercent(item.progress)}</td>
                <td>
                  {formatBytes(item.downloaded_bytes)} / {formatBytes(item.total_bytes)}
                </td>
                <td>{formatDateTime(item.started_at || item.created_at)}</td>
                <td>
                  <ActionGroup>
                    {[
                      "error",
                      "canceled"
                    ].includes(item.status) ? (
                      <Button onClick={() => onRetry(item.id)}>Reexecutar</Button>
                    ) : null}
                    <Button tone="ghost" onClick={() => onRemove(item.id)}>
                      Remover
                    </Button>
                  </ActionGroup>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
    </Wrapper>
  );
}

export default HistoryTable;
