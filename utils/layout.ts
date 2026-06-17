export const TABLET_BREAKPOINT = 768;
export const LARGE_TABLET_BREAKPOINT = 1024;

export function isTabletLayout(width: number, height: number): boolean {
  return Math.min(width, height) >= TABLET_BREAKPOINT;
}

export function getHorizontalPadding(width: number): number {
  if (width >= LARGE_TABLET_BREAKPOINT) {
    return 40;
  }

  if (width >= TABLET_BREAKPOINT) {
    return 32;
  }

  return 20;
}

export function getHeroImageSize(width: number): number {
  if (width >= LARGE_TABLET_BREAKPOINT) {
    return 220;
  }

  if (width >= TABLET_BREAKPOINT) {
    return 200;
  }

  return 160;
}

export function getOtpCellSize(width: number): number {
  if (width >= LARGE_TABLET_BREAKPOINT) {
    return 72;
  }

  if (width >= TABLET_BREAKPOINT) {
    return 64;
  }

  return width < 390 ? 44 : 50;
}
