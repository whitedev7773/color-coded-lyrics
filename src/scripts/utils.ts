import type { LyricEntry } from "./parser.ts";

/**
 * 빈 가사 항목을 생성합니다
 */
export function createBlankEntry(): LyricEntry {
  return {
    part: null,
    artist: [] as string[],
    lines: ["\u00A0", "\u00A0", "\u00A0"] as [string, string, string],
  };
}

/**
 * 배열이 범위 내에 있는지 확인합니다
 */
export function isValidIndex(index: number, length: number): boolean {
  return index >= 0 && index < length;
}

/**
 * 클래스를 토글합니다
 */
export function toggleClass(
  element: HTMLElement,
  className: string,
  force?: boolean,
): void {
  element.classList.toggle(className, force);
}

/**
 * 여러 클래스를 한 번에 토글합니다
 */
export function toggleClasses(
  element: HTMLElement,
  classes: Record<string, boolean>,
): void {
  for (const [className, shouldAdd] of Object.entries(classes)) {
    element.classList.toggle(className, shouldAdd);
  }
}
