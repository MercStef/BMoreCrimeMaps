// src/ui/SidebarDrawer.ts

const MOBILE_BREAKPOINT = 768;

/**
 * Controls the mobile drawer behavior for #sidebar: opens/closes via the
 * hamburger toggle and backdrop, and auto-closes if the viewport widens
 * past the mobile breakpoint (e.g. rotating a tablet, resizing a window).
 *
 * No-ops gracefully if the expected DOM elements aren't present, so it's
 * safe to instantiate unconditionally.
 */
export default class SidebarDrawer {
  private sidebar: HTMLElement | null;
  private toggle: HTMLElement | null;
  private backdrop: HTMLElement | null;

  constructor(
    sidebarId = "sidebar",
    toggleId = "sidebar-toggle",
    backdropId = "sidebar-backdrop",
  ) {
    this.sidebar = document.getElementById(sidebarId);
    this.toggle = document.getElementById(toggleId);
    this.backdrop = document.getElementById(backdropId);

    if (!this.sidebar || !this.toggle || !this.backdrop) {
      return;
    }

    this.toggle.addEventListener("click", () => this.toggleDrawer());
    this.backdrop.addEventListener("click", () => this.close());

    window.addEventListener("resize", () => this.handleResize());
  }

  private setOpen(open: boolean): void {
    this.sidebar?.classList.toggle("open", open);
    this.backdrop?.classList.toggle("visible", open);
  }

  private toggleDrawer(): void {
    this.setOpen(
      !this.sidebar?.classList.contains("open")
    );
  }

  open(): void {
    this.setOpen(true);
  }

  close(): void {
    this.setOpen(false);
  }

  private handleResize(): void {
    if (window.innerWidth > MOBILE_BREAKPOINT) {
      this.close();
    }
  }
}