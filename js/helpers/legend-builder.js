export class LegendBuilder {
  legend = null;

  constructor(parentElement) {
    this.legend = parentElement.querySelector("legend");
    if (!this.legend) {
      this.legend = document.createElement("legend");
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
      });
      p.append(span);
      p.append(d);
      p.classList.add("selected");
      this.selectedLegendGroups.add(d);
      legendColors.append(p);
    });

    this.fieldSetElm.append(legendColors);
  }

  removeFieldSet() {
    Array.from(this.fieldSetElm.children).forEach((element, i) => {
      if (i !== 0) element.remove();
    });
    this.selectedLegendGroups.clear();
  }
}
