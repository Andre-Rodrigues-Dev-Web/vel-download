import { useEffect, useState } from "react";
import styled from "styled-components";
import SettingsSection from "../components/settings/SettingsSection";
import Button from "../components/common/Button";
import { useAppContext } from "../context/AppContext";
import { getLaunchOnStartup, selectDirectory, setLaunchOnStartup } from "../services/desktopService";

const Page = styled.div`
  display: grid;
  gap: 1rem;
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
  gap: 0.32rem;
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
  gap: 0.6rem;
  align-items: center;
  flex-wrap: wrap;
`;

const Hint = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.78rem;
`;

const Alert = styled.p`
  color: ${({ theme }) => (theme.mode === "dark" ? theme.colors.success : theme.colors.accent)};
  font-size: 0.8rem;
  font-weight: 700;
`;

function SettingsPage() {
  const { settings, saveSettings } = useAppContext();

  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  useEffect(() => {
    async function syncStartupState() {
      const startup = await getLaunchOnStartup();
      setForm((prev) => ({ ...prev, launchOnStartup: Boolean(startup) }));
    }

    syncStartupState();
  }, []);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function chooseDirectory() {
    const directory = await selectDirectory();
    if (directory) {
      updateField("defaultDownloadDir", directory);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");

    try {
      await setLaunchOnStartup(Boolean(form.launchOnStartup));

      await saveSettings({
        defaultDownloadDir: form.defaultDownloadDir,
        maxConcurrentDownloads: Number(form.maxConcurrentDownloads),
        maxAutoRetries: Number(form.maxAutoRetries),
        theme: form.theme,
        launchOnStartup: Boolean(form.launchOnStartup),
        completionNotifications: Boolean(form.completionNotifications),
        autoCleanupDays: Number(form.autoCleanupDays)
      });

      setMessage("Configurações salvas com sucesso.");
    } catch (error) {
      setMessage(error.message || "Falha ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page>
      <SettingsSection title="Preferências de Download">
        <Grid>
          <Field>
            Pasta padrão de downloads
            <Input
              value={form.defaultDownloadDir}
              onChange={(event) => updateField("defaultDownloadDir", event.target.value)}
            />
          </Field>

          <Field>
            Downloads simultâneos
            <Input
              type="number"
              min="1"
              max="10"
              value={form.maxConcurrentDownloads}
              onChange={(event) => updateField("maxConcurrentDownloads", event.target.value)}
            />
          </Field>

          <Field>
            Tentativas automáticas
            <Input
              type="number"
              min="0"
              max="10"
              value={form.maxAutoRetries}
              onChange={(event) => updateField("maxAutoRetries", event.target.value)}
            />
          </Field>

          <Field>
            Limpeza automática (dias)
            <Input
              type="number"
              min="7"
              max="3650"
              value={form.autoCleanupDays}
              onChange={(event) => updateField("autoCleanupDays", event.target.value)}
            />
          </Field>

          <Field>
            Tema
            <Select value={form.theme} onChange={(event) => updateField("theme", event.target.value)}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </Select>
          </Field>

          <Field>
            Notificações de conclusão
            <Select
              value={String(form.completionNotifications)}
              onChange={(event) => updateField("completionNotifications", event.target.value === "true")}
            >
              <option value="true">Ativadas</option>
              <option value="false">Desativadas</option>
            </Select>
          </Field>

          <Field>
            Inicializar com o sistema
            <Select
              value={String(form.launchOnStartup)}
              onChange={(event) => updateField("launchOnStartup", event.target.value === "true")}
            >
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </Select>
          </Field>
        </Grid>

        <Row>
          <Button onClick={chooseDirectory}>Escolher pasta</Button>
          <Button tone="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar configurações"}
          </Button>
          {message ? <Alert>{message}</Alert> : null}
        </Row>

        <Hint>
          O app usa integração segura com Electron via preload. Recursos de inicialização automática
          dependem das permissões do Windows.
        </Hint>
      </SettingsSection>
    </Page>
  );
}

export default SettingsPage;
