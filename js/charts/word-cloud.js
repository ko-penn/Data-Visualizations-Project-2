export class WordCloud {
   constructor(_config, _data) {
      this.config = {
         parentElementSelector: _config.parentElementSelector,
         parentElement: document.querySelector(_config.parentElementSelector),
         margin: _config.margin || { top: 25, right: 25, bottom: 25, left: 45 },
      };
      this.data = _data;
      this.initVis();

      window.addEventListener('resize', () => {
         this.updateVis();
      });
   }

   initVis() {
      const idInParent = document.querySelector(this.config.id);
      if (!idInParent) {
         this.mainDiv = d3
            .select(this.config.parentElementSelector)
            .append('div')
            .attr('height', '100%')
            .attr('width', '100%')
            .attr('id', this.config.id)
            .style('display', 'grid')
            .style(
               'grid-template-areas',
               `
                    "y chart chart chart chart"
                    "y chart chart chart chart"
                    "y chart chart chart chart"
                    "y chart chart chart chart"
                    ". x x x x"
                    ". legend legend legend legend"
                `
            )
            .style('grid-template-columns', 'max-content repeat(4, 1fr)')
            .style(
               'grid-template-rows',
               'repeat(4, 1fr) repeat(2, max-content)'
            );
      } else {
         this.mainDiv = d3.select(
            `${this.config.parentElementSelector} #${this.config.id}`
         );
      }

      this.svg = this.mainDiv
         .append('svg')
         .attr('height', '100%')
         .attr('width', '100%')
         .style('grid-area', 'chart');

      this.chart = this.svg
         .append('g')
         .attr(
            'transform',
            `translate(${this.config.margin.left},${
               this.config.margin.top / 2
            })`
         );

      this.updateVis();
   }

   updateData(data) {
      this.data = data;
      this.updateVis();
   }

   updateVis() {
      const stopwords = [
         'i',
         'me',
         'my',
         'myself',
         'we',
         'our',
         'ours',
         'ourselves',
         'you',
         'your',
         'yours',
         'yourself',
         'yourselves',
         'he',
         'him',
         'his',
         'himself',
         'she',
         'her',
         'hers',
         'herself',
         'it',
         'its',
         'itself',
         'they',
         'them',
         'their',
         'theirs',
         'themselves',
         'what',
         'which',
         'who',
         'whom',
         'this',
         'that',
         'these',
         'those',
         'am',
         'is',
         'are',
         'was',
         'were',
         'be',
         'been',
         'being',
         'have',
         'has',
         'had',
         'having',
         'do',
         'does',
         'did',
         'doing',
         'a',
         'an',
         'the',
         'and',
         'but',
         'if',
         'or',
         'because',
         'as',
         'until',
         'while',
         'of',
         'at',
         'by',
         'for',
         'with',
         'about',
         'against',
         'between',
         'into',
         'through',
         'during',
         'before',
         'after',
         'above',
         'below',
         'to',
         'from',
         'up',
         'down',
         'in',
         'out',
         'on',
         'off',
         'over',
         'under',
         'again',
         'further',
         'then',
         'once',
         'here',
         'there',
         'when',
         'where',
         'why',
         'how',
         'all',
         'any',
         'both',
         'each',
         'few',
         'more',
         'most',
         'other',
         'some',
         'such',
         'no',
         'nor',
         'not',
         'only',
         'own',
         'same',
         'so',
         'than',
         'too',
         'very',
         's',
         't',
         'can',
         'will',
         'just',
         'don',
         'should',
         'now',
      ];
      const wordCounts = {};

      this.data.forEach((d) => {
         d.description.split(' ').forEach((word) => {
            const word_clean = words.split('.').join('').toLowerCase();
            if (!stopwords.includes(word_clean)) {
               if (!wordCounts[word_clean]) {
                  wordCounts[word_clean] = 0;
               }
               wordCounts[word_clean]++;
            }
         });
      });

      console.log(wordCounts);
      // var layout = d3.layout.cloud()
      //    .size([this.width, this.height])
      //    .words(myWords.map(function(d){return {text:d.word, size:d.size}}))
      //    .padding(5)
      //    .rotate(function(){return ~~(Math.random()*2)*90;})
      //    .fontSize(function(d){return d.size})
      //    .on("end", this.draw);
      // layout.start();
   }

   draw(words) {}
}
