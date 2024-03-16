export class HeaderFormBuilder {
   constructor() {
      this.form = document.getElementById('header-form');
      if (!this.form) {
         console.error('Form element does not exist');
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
      this.colorBy.addEventListener('change', () => this.handleChange());
      this.mapImage.addEventListener('change', () => this.handleChange());
   }

   handleChange() {
      const colorByValue = this.colorBy.querySelector('select').value;
      const mapImageValue = this.mapImage.querySelector('select').value;

      formData.colorBy = colorByValue;
      formData.mapImage = mapImageValue;

      // TODO: update other visualizations when form changes
      map?.updateVis();
   }

   appendColorBy() {
      this.colorBy = this.createSelect(colorBy, 'Color By');
      this.colorBy.querySelector('select').value = formData.colorBy;
      this.form.append(this.colorBy);
   }

   appendMapImage() {
      this.mapImage = this.createSelect(mapImage, 'Map Image');
      this.mapImage.querySelector('select').value = formData.mapImage;
      this.form.append(this.mapImage);
   }

   createSelect(object, label, keysToExclude = []) {
      const keys = Object.keys(object).filter(
         (a) => !keysToExclude.includes(a)
      );

      const container = document.createElement('div');
      container.classList.add('select-container');
      container.id = label.split(' ').join('');

      const selectElm = document.createElement('select');
      keys.forEach((k) => {
         const option = document.createElement('option');
         option.value = k;
         option.innerText = object[k];
         selectElm.append(option);
      });
      selectElm.name = label;

      const labelElm = document.createElement('label');
      labelElm.for = label;
      labelElm.innerText = label;

      container.append(labelElm);
      container.append(selectElm);
      return container;
   }
}
