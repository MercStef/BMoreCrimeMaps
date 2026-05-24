export type OnSelectCode = (code: string) => void;
export type OnDistrictChange = (district: string) => void;

export class FilterUI {
  private districtSelect: HTMLSelectElement | null;
  private crimeFiltersContainer: HTMLElement | null;
  private onSelectCode: OnSelectCode;
  private onDistrictChange: OnDistrictChange;

  // FilterUI handles the district dropdown and the crime buttons.
  // It keeps the DOM logic separate from the rest of the app.
  constructor(
    districtSelect: HTMLSelectElement | null,
    crimeFiltersContainer: HTMLElement | null,
    onSelectCode: OnSelectCode,
    onDistrictChange: OnDistrictChange
  ) {
    this.districtSelect = districtSelect;
    this.crimeFiltersContainer = crimeFiltersContainer;
    this.onSelectCode = onSelectCode;
    this.onDistrictChange = onDistrictChange;

    if (this.districtSelect) {
      this.districtSelect.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value;
        this.onDistrictChange(value);
      });
    }
  }

  // Rebuilds the district select box from the latest district list.
  public buildDistrictOptions(districts: string[], selectedDistrict = '') {
    if (!this.districtSelect) return;
    this.districtSelect.innerHTML = '<option value="">All Districts</option>';
    for (const d of districts) {
      const option = document.createElement('option');
      option.value = d;
      option.textContent = d.charAt(0) + d.slice(1).toLowerCase();
      this.districtSelect.appendChild(option);
    }
    this.districtSelect.value = selectedDistrict;
  }

  // Rebuilds the crime filter buttons for the current time window.
  // This deduplicates offenses by description, but still retains all matching codes.
  public updateDynamicCrimeFilters(activeFeatures: any[], rawFeatures: any[], selectedCode: string) {
    if (!this.crimeFiltersContainer) return;

    const descriptionMap = new Map<string, Set<string>>();
    for (const f of activeFeatures) {
      const code = f.attributes?.CrimeCode;
      const desc = f.attributes?.Description;
      if (!code || !desc) continue;
      if (!descriptionMap.has(desc)) {
        descriptionMap.set(desc, new Set());
      }
      descriptionMap.get(desc)!.add(code);
    }

    this.crimeFiltersContainer.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.className = `crime-btn ${selectedCode === '' ? 'active' : ''}`;
    allBtn.dataset.code = '';
    allBtn.textContent = 'All Offenses';
    this.attachCrimeButtonHandler(allBtn);
    this.crimeFiltersContainer.appendChild(allBtn);

    const sortedActiveFilters = Array.from(descriptionMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const activeCodeKeys = new Set<string>();

    for (const [description, codeSet] of sortedActiveFilters) {
      const codes = Array.from(codeSet).sort();
      const codeKey = codes.join(',');
      activeCodeKeys.add(codeKey);

      const btn = document.createElement('button');
      btn.className = `crime-btn ${selectedCode === codeKey ? 'active' : ''}`;
      btn.dataset.code = codeKey;
      btn.textContent = description;
      this.attachCrimeButtonHandler(btn);
      this.crimeFiltersContainer.appendChild(btn);
    }

    if (selectedCode !== '' && !activeCodeKeys.has(selectedCode)) {
      const selectedCodes = selectedCode.split(',').map((item) => item.trim()).filter(Boolean);
      const missingFeature = rawFeatures.find((f: any) => selectedCodes.includes(f.attributes?.CrimeCode));
      const label = missingFeature ? missingFeature.attributes.Description : 'Selected Offense';
      const ghostBtn = document.createElement('button');
      ghostBtn.className = 'crime-btn active';
      ghostBtn.dataset.code = selectedCode;
      ghostBtn.textContent = `${label} (0)`;
      this.attachCrimeButtonHandler(ghostBtn);
      this.crimeFiltersContainer.appendChild(ghostBtn);
    }
  }

  private attachCrimeButtonHandler(btn: HTMLButtonElement) {
    btn.addEventListener('click', () => {
      const code = btn.dataset.code || '';
      // Toggle active classes so the selected filter looks obvious.
      document.querySelectorAll('.crime-btn').forEach(b => {
        const el = b as HTMLElement;
        el.classList.toggle('active', (el as HTMLElement).dataset.code === code);
      });
      this.onSelectCode(code);
    });
  }
}

export default FilterUI;
