import Picker from 'vanilla-picker';

export type ThemeChangeCallback = (hex: string) => void;

// ThemeManager is responsible for wiring up the color picker
// and keeping the current accent color in sync with the page.
export class ThemeManager {
  private currentColor: string;
  private picker: any | null = null;

  constructor(
    parentElementId: string,
    previewSquareId?: string,
    previewTextId?: string,
    initialColor = '#FFFFFF'
  ) {
    this.currentColor = initialColor;

    const parent = document.getElementById(parentElementId);
    const previewSquare = previewSquareId ? document.getElementById(previewSquareId) : null;
    const previewText = previewTextId ? document.getElementById(previewTextId) : null;

    if (!parent) return;

    // Initialize the preview UI with the initial color
    if (previewSquare) previewSquare.style.backgroundColor = this.currentColor;
    if (previewText) previewText.textContent = this.currentColor.toUpperCase();

    // Only initialize the picker if the target container exists.
    this.picker = new Picker({
      parent,
      popup: 'bottom',
      color: this.currentColor,
      alpha: false,
      editor: true,
    });

    this.picker.onChange = (color: any) => {
      const selectedColor = color.hex.substring(0, 7);
      this.currentColor = selectedColor;
      document.documentElement.style.setProperty('--accent-color', selectedColor);
      if (previewSquare) previewSquare.style.backgroundColor = selectedColor;
      if (previewText) previewText.textContent = selectedColor.toUpperCase();
      // Notify the app when the selected theme color changes.
      if (this._onChange) this._onChange(this.currentColor);
    };
  }

  private _onChange: ThemeChangeCallback | null = null;

  // Register a callback to run when the selected theme color changes.
  public onChange(cb: ThemeChangeCallback) {
    this._onChange = cb;
  }

  // Read the currently selected accent color.
  public getColor() {
    return this.currentColor;
  }
}

export default ThemeManager;
