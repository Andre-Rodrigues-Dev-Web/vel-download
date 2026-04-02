import { useEffect, useState } from "react";
import styled from "styled-components";
import Card from "../common/Card";
import Button from "../common/Button";
import { selectDirectory } from "../../services/desktopService";

const FormCard = styled(Card)`
  padding: 1rem;
  display: grid;
  gap: 0.8rem;
`;

const Title = styled.h3`
  font-size: 0.98rem;
  font-family: "Sora", sans-serif;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.label`
  display: grid;
  gap: 0.36rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Input = styled.input`
  background: ${({ theme }) => theme.colors.panelBackground};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 0.9rem;
  padding: 0.55rem 0.66rem;
`;

const Select = styled.select`
  background: ${({ theme }) => theme.colors.panelBackground};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 0.9rem;
  padding: 0.55rem 0.66rem;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
`;

const ErrorText = styled.span`
  color: ${({ theme }) => theme.colors.danger};
  font-size: 0.78rem;
  font-weight: 700;
`;

function DownloadForm({ defaultTargetDir, onSubmit, busy }) {
  const [form, setForm] = useState({
    url: "",
    fileName: "",
    targetDir: defaultTargetDir || "",
    category: "Geral",
    priority: "5"
  });
  const [error, setError] = useState("");

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      targetDir: prev.targetDir || defaultTargetDir || ""
    }));
  }, [defaultTargetDir]);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleDirectoryPick() {
    const selected = await selectDirectory();
    if (selected) {
      updateField("targetDir", selected);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const url = new URL(form.url);
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("A URL deve iniciar com http:// ou https://");
      }
    } catch {
      setError("Informe uma URL válida para iniciar o download.");
      return;
    }

    if (!form.targetDir.trim()) {
      setError("Escolha um diretório de destino.");
      return;
    }

    try {
      await onSubmit({
        url: form.url.trim(),
        fileName: form.fileName.trim(),
        targetDir: form.targetDir.trim(),
        category: form.category.trim() || "Geral",
        priority: Number(form.priority)
      });

      setForm((prev) => ({
        ...prev,
        url: "",
        fileName: ""
      }));
    } catch (requestError) {
      setError(requestError.message || "Falha ao iniciar download.");
    }
  }

  return (
    <FormCard>
      <Title>Novo Download por URL</Title>

      <form onSubmit={handleSubmit}>
        <Grid>
          <Field>
            URL do arquivo
            <Input
              value={form.url}
              placeholder="https://servidor.com/arquivo.zip"
              onChange={(event) => updateField("url", event.target.value)}
              required
            />
          </Field>

          <Field>
            Nome personalizado
            <Input
              value={form.fileName}
              placeholder="arquivo-premium.zip"
              onChange={(event) => updateField("fileName", event.target.value)}
            />
          </Field>

          <Field>
            Diretório de destino
            <Input
              value={form.targetDir}
              onChange={(event) => updateField("targetDir", event.target.value)}
              required
            />
          </Field>

          <Field>
            Categoria / etiqueta
            <Input
              value={form.category}
              onChange={(event) => updateField("category", event.target.value)}
            />
          </Field>

          <Field>
            Prioridade
            <Select
              value={form.priority}
              onChange={(event) => updateField("priority", event.target.value)}
            >
              <option value="3">Baixa</option>
              <option value="5">Normal</option>
              <option value="8">Alta</option>
              <option value="10">Crítica</option>
            </Select>
          </Field>
        </Grid>

        <Row style={{ marginTop: "0.95rem" }}>
          <Button type="button" onClick={handleDirectoryPick}>
            Escolher pasta
          </Button>
          <Button type="submit" tone="primary" disabled={busy}>
            {busy ? "Iniciando..." : "Iniciar download"}
          </Button>
          {error ? <ErrorText>{error}</ErrorText> : null}
        </Row>
      </form>
    </FormCard>
  );
}

export default DownloadForm;
