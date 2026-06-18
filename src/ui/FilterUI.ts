// src/ui/FilterUI.ts
export type OnSelectCode = (code: string) => void;
export type OnDistrictChange = (district: string) => void;

export class FilterUI {
  private districtSelect: HTMLSelectElement | null;
  private crimeFiltersContainer: HTMLElement | null;
  private onSelectCode: OnSelectCode;
  private onDistrictChange: OnDistrictChange;

  constructor(
    districtSelect: HTMLSelectElement | null,
    crimeFiltersContainer: HTMLElement | null,
    onSelectCode: OnSelectCode,
    onDistrictChange: OnDistrictChange,
  ) {
    this.districtSelect = districtSelect;
    this.crimeFiltersContainer = crimeFiltersContainer;
    this.onSelectCode = onSelectCode;
    this.onDistrictChange = onDistrictChange;

    this.districtSelect?.addEventListener("change", (e) => {
      this.onDistrictChange((e.target as HTMLSelectElement).value);
    });
  }

  public buildDistrictOptions(
    districts: string[],
    selectedDistrict = "",
  ): void {
    if (!this.districtSelect) return;

    this.districtSelect.innerHTML = '<option value="">All Districts</option>';

    for (const d of districts) {
      const option = document.createElement("option");
      option.value = d;
      option.textContent = d.charAt(0) + d.slice(1).toLowerCase();
      this.districtSelect.appendChild(option);
    }

    this.districtSelect.value = selectedDistrict;
  }

  public updateDynamicCrimeFilters(
    activeFeatures: any[],
    rawFeatures: any[],
    selectedCode: string,
  ): void {
    if (!this.crimeFiltersContainer) return;

    const descriptionMap = new Map<string, Set<string>>();

    for (const f of activeFeatures) {
      const code: string = f.attributes?.CrimeCode;
      const desc: string = f.attributes?.Description;
      if (!code || !desc) continue;

      const bucket = descriptionMap.get(desc);
      if (bucket) {
        bucket.add(code);
      } else {
        descriptionMap.set(desc, new Set([code]));
      }
    }

    this.crimeFiltersContainer.innerHTML = "";

    const allBtn = this.createButton("", "All Offenses", selectedCode === "");
    this.crimeFiltersContainer.appendChild(allBtn);

    const activeCodeKeys = new Set<string>();

    const sorted = [...descriptionMap.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    );

    for (const [description, codeSet] of sorted) {
      const codeKey = [...codeSet].sort().join(",");
      activeCodeKeys.add(codeKey);
      const btn = this.createButton(
        codeKey,
        description,
        selectedCode === codeKey,
      );
      this.crimeFiltersContainer.appendChild(btn);
    }

    // Ghost button — keeps the active filter visible even when it drops out of view
    if (selectedCode !== "" && !activeCodeKeys.has(selectedCode)) {
      const selectedCodes = selectedCode
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      const match = rawFeatures.find((f) =>
        selectedCodes.includes(f.attributes?.CrimeCode),
      );
      const label = match?.attributes?.Description ?? "Selected Offense";
      const ghostBtn = this.createButton(selectedCode, `${label} (0)`, true);
      this.crimeFiltersContainer.appendChild(ghostBtn);
    }
  }

  private createButton(
    code: string,
    label: string,
    active: boolean,
  ): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.className = `crime-btn${active ? " active" : ""}`;
    btn.dataset.code = code;
    btn.textContent = label;

    btn.addEventListener("click", () => {
      // Scoped to container — avoids walking the full document DOM
      this.crimeFiltersContainer
        ?.querySelectorAll<HTMLElement>(".crime-btn")
        .forEach((el) =>
          el.classList.toggle("active", el.dataset.code === code),
        );

      this.onSelectCode(code);
    });

    return btn;
  }
}

export default FilterUI;
