const DEFAULTS = {
  company: 'Smartporters',
  primary: '#111111',
  accent: '#C8F000',
  logo: '',
  currency: 'USD',
};

function normalizeHex(value, fallback) {
  if (!value) return fallback;
  const hex = value.startsWith('#') ? value : `#${value}`;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex) ? hex : fallback;
}

export function getTheme() {
  const params = new URLSearchParams(window.location.search);
  return {
    company: params.get('company')?.trim() || DEFAULTS.company,
    primary: normalizeHex(params.get('primary'), DEFAULTS.primary),
    accent: normalizeHex(params.get('accent'), DEFAULTS.accent),
    logo: params.get('logo')?.trim() || DEFAULTS.logo,
    currency: (params.get('currency') || DEFAULTS.currency).toUpperCase(),
  };
}

export function applyTheme(theme) {
  const root = document.documentElement;
  root.style.setProperty('--wl-ink', theme.primary);
  root.style.setProperty('--wl-accent', theme.accent);
  document.title = `${theme.company} · Book a transfer`;
}
