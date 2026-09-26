// Icônes Lucide (https://lucide.dev, licence ISC), contenu SVG copié tel quel.
// Seules les icônes utilisées sont listées : pas de dépendance npm, disponibles hors ligne.
export const ICONS = {
  'alert-circle': '',
  'alert-triangle': '',
  'arrow-left': '',
  check: '',
  'chevron-down': '',
  'chevron-right': '',
  clock: '',
  'cloud-off': '',
  copy: '',
  info: '',
  loader: '',
  lock: '',
  'log-out': '',
  'map-pin': '',
  menu: '',
  minus: '',
  'more-horizontal': '',
  package: '',
  pencil: '',
  plus: '',
  'refresh-cw': '',
  'shopping-bag': '',
  smartphone: '',
  trash: '',
  truck: '',
  user: '',
  wifi: '',
  x: '',
} satisfies Record<string, string>;

export type IconName = keyof typeof ICONS;
