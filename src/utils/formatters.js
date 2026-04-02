export function formatBytes(bytes = 0) {
  const value = Number(bytes || 0);
  if (!value || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const normalized = value / 1024 ** index;
  return `${normalized.toFixed(normalized >= 10 ? 1 : 2)} ${units[index]}`;
}

export function formatSpeed(bytesPerSecond = 0) {
  if (!bytesPerSecond || bytesPerSecond <= 0) {
    return "0 B/s";
  }

  return `${formatBytes(bytesPerSecond)}/s`;
}

export function formatPercent(value = 0) {
  return `${Number(value || 0).toFixed(1)}%`;
}

export function formatEta(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value <= 0) {
    return "--";
  }

  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secs = value % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }

  return `${secs}s`;
}

export function formatDateTime(dateValue) {
  if (!dateValue) {
    return "--";
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function statusLabel(status) {
  const labels = {
    queued: "Na fila",
    downloading: "Baixando",
    paused: "Pausado",
    completed: "Concluído",
    error: "Erro",
    canceled: "Cancelado"
  };

  return labels[status] || status;
}

export function statusTone(status) {
  const tones = {
    queued: "warning",
    downloading: "accent",
    paused: "warning",
    completed: "success",
    error: "danger",
    canceled: "textSecondary"
  };

  return tones[status] || "textSecondary";
}
