const logMethods = ["error", "info", "log", "warn"] as const;
let lastLogAt = 0;

for (const method of logMethods) {
  const originalFn = global.console[method].bind(global.console);

  global.console[method] = (...args: any[]): void => {
    const date = new Date();
    const epoch = date.getTime();
    const timestamp = `\x1b[7m${date.toLocaleTimeString()}\x1b[0m`;
    const delta = lastLogAt
      ? `\x1b[34m${formatElapsed(epoch - lastLogAt)}\x1b[0m`
      : "\t";
    lastLogAt = epoch;

    originalFn(`${delta}\t${timestamp}`, ...args);
  };
}

function formatElapsed(elapsed: number): string {
  if (elapsed >= 100_000) {
    const minutes = (elapsed / 60_000).toFixed(1);
    return `${minutes} m`;
  } else if (elapsed >= 10_000) {
    const seconds = (elapsed / 1000).toFixed(1);
    return `${seconds} s`;
  } else {
    return `${elapsed} ms`;
  }
}
