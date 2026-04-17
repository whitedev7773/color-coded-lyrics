// 색상 팔레트
export const COLORS = [
  "#5B8DEF",
  "#F06292",
  "#FF8A65",
  "#66BB6A",
  "#AB47BC",
  "#FFA726",
];

// 키보드 단축키
export const KEYBOARD_SHORTCUTS = {
  PREVIOUS: "ArrowLeft",
  NEXT: "ArrowRight",
  EDIT: ["e", "E"],
  BACKGROUND: ["b", "B"],
} as const;

// CSS 클래스명
export const CSS_CLASSES = {
  ARTIST_PANEL: "artist-panel",
  ARTIST_IMG_WRAP: "artist-img-wrap",
  ARTIST_IMG: "artist-img",
  ARTIST_NAME_ROW: "artist-name-row",
  ARTIST_NAME: "artist-name",
  ARTIST_COLOR_INPUT: "artist-color-input",
  NO_IMAGE: "no-image",
  VISIBLE: "visible",
  FOCUSED: "focused",
  DIMMED: "dimmed",
} as const;

// 데이터 속성명
export const DATA_ATTRIBUTES = {
  ARTIST_NAME: "name",
} as const;
