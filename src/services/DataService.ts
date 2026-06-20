import { fetchAllCrimeData } from "../crimeData/fetch";
import { loadNeighborhoodBoundaries } from "./NeighborhoodService";
import { enrichFeatures } from "../utils/dataFilters";
import AppState from "./AppState";
import { MIN_DATA_LOOKBACK_MS } from "../config/constants";
import { TimeSlider } from "../components";

/**
 * Service responsible for bootstrapping the application data.
 * It fetches crime data and neighborhood GeoJSON, enriches the features,
 * calculates distinct districts and time bounds, and populates the AppState.
 */
export default class DataService {
  private state: AppState;
  private timeSlider: TimeSlider;

  constructor(state: AppState, timeSlider: TimeSlider) {
    this.state = state;
    this.timeSlider = timeSlider;
  }

  public async load(): Promise<void> {
    try {
      const [crimeData, neighborhoodData] = await Promise.all([
        fetchAllCrimeData(),
        loadNeighborhoodBoundaries().catch((err) => {
          console.error("Failed loading neighborhood boundaries:", err);
          return null;
        }),
      ]);

      // Enrich and store raw features
      this.state.rawFeatures = enrichFeatures((crimeData as any).features);
      this.state.neighborhoodGeoJson = neighborhoodData;

      // Distinct districts – used by UI (outside of this class)
      const distinctDistricts = Array.from(
        new Set(
          this.state.rawFeatures
            .map((f) => f.attributes?.New_District ?? "")
            .filter((d) => d && d !== "OUT OF JURISDICTION")
            .map((d) => d.charAt(0) + d.slice(1).toLowerCase()),
        ),
      ).sort();
      // expose via state for UIManager to consume
      (this.state as any).distinctDistricts = distinctDistricts;

      // Compute time bounds
      const dates = this.state.rawFeatures
        .map((f) => f.attributes?.CrimeDateTime)
        .filter((t) => typeof t === "number" && Number.isFinite(t))
        .sort((a, b) => (a as number) - (b as number));

      if (dates.length === 0) {
        console.error("No valid timestamps in data");
        return;
      }

      const monthAgo = Date.now() - MIN_DATA_LOOKBACK_MS;
      this.state.minTime = Math.max(dates[0] as number, monthAgo);
      this.state.maxTime = dates.at(-1) as number;

      // Initialise the time slider UI – callback updates state and notifies UIManager
      this.timeSlider.init(this.state.rawFeatures, (min: number, max: number) => {
        this.state.setState({ minTime: min, maxTime: max });
        // UIManager will subscribe to state changes via a simple callback (passed in constructor)
      }, this.state.minTime, this.state.maxTime);
    } catch (error) {
      console.error("Critical dashboard boot failure:", error);
    }
  }
}
