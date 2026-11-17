type Level = "info" | "warn" | "error";

function serializeError(value: unknown) {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack
    };
  }
  return { value: String(value) };
}

function emit(level: Level, message: string, meta?: unknown) {
  const entry: Record<string, unknown> = {
    time: new Date().toISOString(),
    level,
    message
  };

  if (meta instanceof Error) {
    entry.error = serializeError(meta);
  } else if (meta !== undefined) {
    entry.meta = meta;
  }

  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (message: string, meta?: unknown) => emit("info", message, meta),
  warn: (message: string, meta?: unknown) => emit("warn", message, meta),
  error: (message: string, meta?: unknown) => emit("error", message, meta)
};
