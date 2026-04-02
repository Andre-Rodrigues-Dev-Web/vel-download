import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import HistoryFilters from "../components/history/HistoryFilters";
import HistoryTable from "../components/history/HistoryTable";
import { useDebounce } from "../hooks/useDebounce";
import { fetchHistory, getHistoryExportUrl } from "../services/historyService";
import { useAppContext } from "../context/AppContext";

const Page = styled.div`
  display: grid;
  gap: 1rem;
`;

const Alert = styled.p`
  color: ${({ theme }) => theme.colors.danger};
  font-size: 0.8rem;
  font-weight: 700;
`;

const initialFilters = {
  search: "",
  status: "",
  browser: "",
  startDate: "",
  endDate: "",
  sort: "newest"
};

function HistoryPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const debouncedFilters = useDebounce(filters, 300);
  const { retry, remove } = useAppContext();

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetchHistory(debouncedFilters);
        if (active) {
          setItems(response);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message || "Falha ao carregar histórico.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [debouncedFilters]);

  function handleFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  async function handleRetry(id) {
    try {
      await retry(id);
      const response = await fetchHistory(debouncedFilters);
      setItems(response);
    } catch (requestError) {
      setError(requestError.message || "Falha ao reexecutar download.");
    }
  }

  async function handleRemove(id) {
    try {
      await remove(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (requestError) {
      setError(requestError.message || "Falha ao remover histórico.");
    }
  }

  function handleExport() {
    const exportUrl = getHistoryExportUrl(filters);
    window.open(exportUrl, "_blank", "noopener,noreferrer");
  }

  const tableItems = useMemo(() => items, [items]);

  return (
    <Page>
      <HistoryFilters
        filters={filters}
        onChange={handleFilterChange}
        onClear={() => setFilters(initialFilters)}
        onExport={handleExport}
      />

      {error ? <Alert>{error}</Alert> : null}

      <HistoryTable items={tableItems} loading={loading} onRetry={handleRetry} onRemove={handleRemove} />
    </Page>
  );
}

export default HistoryPage;
