export class MapFormBuilder {
  constructor() {
    this.form = document.getElementById("map-form");
    if (!this.form) {
      console.error("Form element does not exist");
    }
    if (this.form.children.length === 0) {
      this.buildForm();
    }
  }

  buildForm() {
    this.appendColorBy();
    this.appendMapImage();

    this.registerChangeCallbacks();
    requestAnimationFrame(() => {
      this.handleChange();
    });
  }

  registerChangeCallbacks() {
    this.colorBy.addEventListener("change", () => this.handleChange());
    this.mapImage.addEventListener("change", () => this.handleChange());
  }

  handleChange() {
    const colorByValue = this.colorBy.querySelector("select").value;
    const mapImageValue = this.mapImage.querySelector("select").value;

    formData.colorBy = colorByValue;
    formData.mapImage = mapImageValue;

    updateAllVis();
  }

  appendColorBy() {
    this.colorBy = createSelect(colorBy, "Color By");
    this.colorBy.querySelector("select").value = formData.colorBy;
    this.form.append(this.colorBy);
  }

  appendMapImage() {
    this.mapImage = createSelect(mapImage, "Map Image");
    this.mapImage.querySelector("select").value = formData.mapImage;
    this.form.append(this.mapImage);
  }
}
