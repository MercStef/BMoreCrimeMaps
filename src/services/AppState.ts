import { DEFAULT_ACCENT_COLOR } from "../config/constants";

/**
 * Centralized application state container.
 *
 * Extracts global variables from main.ts into a single, immutable-ish state object.
 * Provides a simple interface for services/components to access and modify state.
 */
export default class AppState {
  // Raw data
  public rawFeatures: any[] = [];

  // Temporal bounds
  public minTime: number = 0;
  public maxTime: number = 0;

  // UI selection state
  public selectedCrimeCode: string = "";
  public selectedDistrict: string = "";

  // Map mode toggle
  public mapMode: "heatmap" | "choropleth" = "heatmap";

  // Neighborhood interaction
  public selectedNeighborhoodId: string | null = null;
  public neighborhoodGeoJson: any = null;

  // Visual styling
  public currentAccentColor: string = DEFAULT_ACCENT_COLOR as string;

  // Reference to the LayerOrchestrator (injected via constructor)
  public orchestrator: any = null;

  // ------------------------------------------------------------------
  // ★ Observer support – allows UIManager to react to any state change
  // ------------------------------------------------------------------
  private subscribers: Set<() => void> = new Set();

  /** Register a callback that runs after every `setState` */
  public subscribe(cb: () => void): () => void {
    this.subscribers.add(cb);
    // Return an unsubscribe function for good hygiene
    return () => this.subscribers.delete(cb);
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((cb) => cb());
  }

  // ------------------------------------------------------------------
  // Update method for atomic state changes – now notifies observers
  // ------------------------------------------------------------------
  public setState(partial: Partial<AppState>): void {
    Object.assign(this, partial);
    this.notifySubscribers();      // ← essential – triggers UI refresh
  }
}