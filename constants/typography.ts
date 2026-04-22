import rawTokens from './typography.tokens.json';

export type TypographyToken = {
  size: number;
  lineHeight: number;
};

type TokenKey = keyof typeof rawTokens;

const tokens = rawTokens as Record<TokenKey, TypographyToken>;

/** App typography scale (pixels). Single source of truth with `typography.tokens.json` + Tailwind `fontSize` extension. */
export const Typography = {
  '2xs': tokens['2xs'],
  tiny: tokens.tiny,
  xs: tokens.xs,
  caption: tokens.caption,
  sm: tokens.sm,
  md: tokens.md,
  base: tokens.base,
  lead: tokens.lead,
  xl: tokens.xl,
  display: tokens.display,
  displayLg: tokens.displayLg,
} as const satisfies Record<string, TypographyToken>;

export type TypographyRole = keyof typeof Typography;
