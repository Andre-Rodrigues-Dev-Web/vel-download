import styled from "styled-components";
import Card from "../common/Card";
import Button from "../common/Button";

const FilterCard = styled(Card)`
  padding: 0.9rem;
  display: grid;
  gap: 0.6rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.6rem;

  @media (max-width: 1300px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 780px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const Field = styled.label`
  display: grid;
  gap: 0.28rem;
  font-size: 0.74rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Input = styled.input`
  background: ${({ theme }) => theme.colors.panelBackground};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  padding: 0.5rem 0.6rem;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const Select = styled.select`
  background: ${({ theme }) => theme.colors.panelBackground};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  padding: 0.5rem 0.6rem;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

function HistoryFilters({ filters, onChange, onClear, onExport }) {
  return (
    <FilterCard>
      <Grid>
        <Field>
          Buscar por nome
          <Input
            value={filters.search}
            onChange={(event) => onChange("search", event.target.value)}
            placeholder="Nome do arquivo"
          />
        </Field>

        <Field>
          Status
          <Select value={filters.status} onChange={(event) => onChange("status", event.target.value)}>
            <option value="">Todos</option>
            <option value="queued">Na fila</option>
            <option value="downloading">Baixando</option>
            <option value="paused">Pausado</option>
            <option value="completed">Concluído</option>
            <option value="error">Erro</option>
            <option value="canceled">Cancelado</option>
          </Select>
        </Field>

        <Field>
          Navegador
          <Select value={filters.browser} onChange={(event) => onChange("browser", event.target.value)}>
            <option value="">Todos</option>
            <option value="app">App</option>
            <option value="chrome">Chrome</option>
            <option value="firefox">Firefox</option>
            <option value="system">Sistema</option>
          </Select>
        </Field>

        <Field>
          Data inicial
          <Input
            type="date"
            value={filters.startDate}
            onChange={(event) => onChange("startDate", event.target.value)}
          />
        </Field>

        <Field>
          Data final
          <Input
            type="date"
            value={filters.endDate}
            onChange={(event) => onChange("endDate", event.target.value)}
          />
        </Field>

        <Field>
          Ordenação
          <Select value={filters.sort} onChange={(event) => onChange("sort", event.target.value)}>
            <option value="newest">Mais recente</option>
            <option value="oldest">Mais antigo</option>
            <option value="largest">Maior arquivo</option>
            <option value="smallest">Menor arquivo</option>
          </Select>
        </Field>
      </Grid>

      <Actions>
        <Button onClick={onExport}>Exportar CSV</Button>
        <Button tone="ghost" onClick={onClear}>
          Limpar filtros
        </Button>
      </Actions>
    </FilterCard>
  );
}

export default HistoryFilters;
