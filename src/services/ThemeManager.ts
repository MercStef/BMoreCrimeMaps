import Picker from "vanilla-picker";

export type ThemeChangeCallback = (hex: string) => void;

export class ThemeManager {
  private currentColor: string;
  private picker: any | null = null;
  private _onChange: ThemeChangeCallback | null = null; // declared with the other fields

  constructor(
    parentElementId: string,
    previewSquareId?: string,
    previewTextId?: string,
    initialColor = "#FFFFFF",
    cssVariable = "--accent-color", // caller decides which CSS var to drive
  ) {
    this.currentColor = initialColor;

    const parent = document.getElementById(parentElementId);
    const previewSquare = previewSquareId
      ? document.getElementById(previewSquareId)
      : null;
    const previewText = previewTextId
      ? document.getElementById(previewTextId)
      : null;

    if (!parent) {
      console.warn(`ThemeManager: Parent element not found: #${parentElementId}. Theme picker will not initialize, but CSS variable will be set.`);
      // Still apply the default color to CSS
      document.documentElement.style.setProperty(cssVariable, initialColor);
      return;
    }

    this.syncPreview(
      previewSquare,
      previewText,
      this.currentColor,
      cssVariable,
    );

    this.picker = new Picker({
      parent,
      popup: "bottom",
      color: this.currentColor,
      alpha: false,
      editor: true,
    });

    this.picker.onChange = (color: any) => {
      const hex = color.hex.substring(0, 7);
      this.currentColor = hex;
      this.syncPreview(previewSquare, previewText, hex, cssVariable);
      this._onChange?.(hex);
    };
  }

  private syncPreview(
    square: HTMLElement | null,
    text: HTMLElement | null,
    hex: string,
    cssVariable: string,
  ): void {
    document.documentElement.style.setProperty(cssVariable, hex);
    if (square) square.style.backgroundColor = hex;
    if (text) text.textContent = hex.toUpperCase();
  }

  public onChange(cb: ThemeChangeCallback): void {
    this._onChange = cb;
  }

  public getColor(): string {
    return this.currentColor;
  }
}

export default ThemeManager;
