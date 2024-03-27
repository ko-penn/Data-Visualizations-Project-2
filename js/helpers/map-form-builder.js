export class MapFormBuilder {
   constructor() {
      this.form = document.getElementById('map-form');
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

      this.addCircleControls();

      this.registerChangeCallbacks();
      requestAnimationFrame(() => {
         this.handleChange();
      });
   }

   registerChangeCallbacks() {
      this.colorBy.addEventListener('change', () => this.handleChange());
      this.mapImage.addEventListener('change', () => this.handleChange());

      this.circleButton.addEventListener('click', () => {
         if (this.selectedCircle) {
            map.removeCircle(this.selectedCircle);
         } else {
            map.addCircle(this.selectedCircle);
         }
      });
      this.circleRadiusSliderInput.addEventListener('input', (e) => {
         e.stopPropagation();
         e.preventDefault();
         if (this.selectedCircle) {
            map.updateSelectedCircleRadius(this.selectedCircle, e.target.value);
         }
      });
   }

   handleChange() {
      const colorByValue = this.colorBy.querySelector('select').value;
      const mapImageValue = this.mapImage.querySelector('select').value;

      formData.colorBy = colorByValue;
      formData.mapImage = mapImageValue;

      updateAllVis();
   }

   appendColorBy() {
      this.colorBy = createSelect(colorBy, 'Color By');
      this.colorBy.querySelector('select').value = formData.colorBy;
      this.form.append(this.colorBy);
   }

   appendMapImage() {
      this.mapImage = createSelect(mapImage, 'Map Image');
      this.mapImage.querySelector('select').value = formData.mapImage;
      this.form.append(this.mapImage);
   }

   addCircleControls() {
      this.circleButton = document.createElement('button');
      this.circleButton.classList.add('circleButton');
      this.circleButton.type = 'button';
      this.circleButton.innerText = 'Add Selection Circle';
      this.form.append(this.circleButton);

      this.circleRadiusSlider = document.createElement('div');
      this.circleRadiusSlider.classList.add('circleRadiusSlider');
      this.circleRadiusSlider.classList.add('hide');
      this.circleRadiusSliderLabel = document.createElement('label');
      this.circleRadiusSliderLabel.innerText = 'Circle Radius';
      this.circleRadiusSliderLabel.for = 'CircleRadiusSlider';
      this.circleRadiusSliderInput = document.createElement('input');
      this.circleRadiusSliderInput.type = 'range';
      this.circleRadiusSliderInput.name = 'CircleRadiusSlider';
      this.circleRadiusSliderInput.min = 10;
      this.circleRadiusSliderInput.max = 750;

      this.circleRadiusSlider.append(this.circleRadiusSliderLabel);
      this.circleRadiusSlider.append(this.circleRadiusSliderInput);
      this.form.append(this.circleRadiusSlider);
   }

   setSelectedCircle(value) {
      this.selectedCircle = value;

      if (this.selectedCircle) {
         this.circleButton.innerText = 'Remove Selection Circle';
         this.circleRadiusSlider.classList.remove('hide');
         this.circleRadiusSliderInput.value = this.selectedCircle.baseRadius;
      } else {
         this.circleButton.innerText = 'Add Selection Circle';
         this.circleRadiusSlider.classList.add('hide');
      }
   }
}
