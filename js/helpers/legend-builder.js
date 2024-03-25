export class LegendBuilder {
  legend = null;

  constructor(parentElement, _toggleCallback) {
    this.legend = parentElement.querySelector("legend");
    this.toggleCallback = _toggleCallback;
    if (!this.legend) {
      this.legend = document.createElement("div");
      this.legend.classList.add("legend");
      parentElement.append(this.legend);
    }

    this.selectedLegendGroups = new Set();
    if (!this.legend) {
      console.error("Legend element does not exist");
    }
    if (this.legend.children.length === 0) {
      this.buildLegend();
    }
  }

  buildLegend() {
    const legendElm = document.createElement("legend");
    legendElm.innerText = "Legend";

    this.fieldSetElm = document.createElement("fieldset");
    this.fieldSetElm.append(legendElm);
    this.fieldSetElm.classList.add("legend-content");

    this.legend.append(this.fieldSetElm);
  }

  setLegendColorScale(colorScale) {
    if (
      JSON.stringify(colorScale.domain()) === JSON.stringify(this.storedDomain)
    ) {
      return;
    }

    this.storedDomain = colorScale.domain();

    this.removeFieldSet();

    const legendColors = document.createElement("div");
    legendColors.classList.add("legend-colors");

    colorScale.domain().forEach((d) => {
      const p = document.createElement("p");
      const span = document.createElement("span");

      span.style.background = colorScale(d);
      span.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (this.selectedLegendGroups.has(d)) {
          this.selectedLegendGroups.delete(d);
          p.classList.remove("selected");
        } else {
          this.selectedLegendGroups.add(d);
          p.classList.add("selected");
        }

        this.toggleCallback();
      });
      p.append(span);
      p.append(d);
      p.classList.add("selected");
      p.setAttribute("domain", d);
      this.selectedLegendGroups.add(d);
      legendColors.append(p);

      if (!this.legendSwatches) this.legendSwatches = [];
      this.legendSwatches.push(p);
    });

    this.fieldSetElm.append(legendColors);
  }

  updateSelectedLegendGroups(items) {
    this.selectedLegendGroups?.clear();
    items.forEach((i) => {
      this.selectedLegendGroups?.add(i);
    });

    this.legendSwatches?.forEach((s) => {
      const domain = s.getAttribute("domain");
      s.classList.remove("selected");
      if (this.selectedLegendGroups?.has(domain)) {
        s.classList.add("selected");
      }
    });
  }

  removeFieldSet() {
    Array.from(this.fieldSetElm.children).forEach((element, i) => {
      if (i !== 0) element.remove();
    });
    this.selectedLegendGroups.clear();
    this.spans = [];
  }
}
