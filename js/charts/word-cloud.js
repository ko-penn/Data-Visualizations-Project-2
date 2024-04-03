export class WordCloud {
   constructor(_config, _data) {
      this.config = {
         parentElementSelector: _config.parentElementSelector,
         parentElement: document.querySelector(_config.parentElementSelector),
         margin: _config.margin || { top: 25, right: 25, bottom: 25, left: 45 },
         id: _config.id,
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
            .style('height', '100%')
            .style('width', '100%')
            .attr('id', this.config.id);
      } else {
         this.mainDiv = d3.select(
            `${this.config.parentElementSelector} #${this.config.id}`
         );
      }

      this.svg = this.mainDiv
         .append('svg')
         .attr('height', '100%')
         .attr('width', '100%');

      this.chart = this.svg
         .append('g')
         .attr(
            'transform',
            `translate(${this.config.margin.left},${
               this.config.margin.top / 2
            })`
         );

      this.layout = d3.layout.cloud();

      this.layout
         .on('end', (e, b) => {
            // console.log('end', e, b);
            this.draw(e);
         })
         .on('word', (e) => {
            // console.log('word', e);
         });

      this.updateVis();
   }

   updateData(data) {
      this.data = data;
      this.updateVis();
   }

   updateVis() {
      this.setWidthAndHeight();

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
         '',
      ];
      const wordCounts = {};

      this.data.forEach((d) => {
         d.description.split(' ').forEach((word) => {
            const word_clean = word.split('.').join('').toLowerCase();
            if (!stopwords.includes(word_clean)) {
               if (!wordCounts[word_clean]) {
                  wordCounts[word_clean] = 0;
               }
               wordCounts[word_clean]++;
            }
         });
      });

      const keys = Object.keys(wordCounts);
      const maxNumOfWords = 10;
      const sortedKeys = keys
         .sort((a, b) => wordCounts[b] - wordCounts[a])
         .slice(0, maxNumOfWords);

      const maxWordCount = wordCounts[sortedKeys[0]];
      const maxWordSize = 100;
      const wordCountSizeRatio = maxWordSize / maxWordCount;

      this.layout.stop();
      this.layout
         .size([this.width ?? 1, this.height ?? 1])
         .words(
            sortedKeys.map(function (k) {
               return { text: k, size: wordCounts[k] * wordCountSizeRatio };
            })
         )
         .rotate(function () {
            return ~~(Math.random() * 2) * 90;
         })
         .fontSize(function (d) {
            return d.size;
         })
         .padding(5);
      this.layout.start();
   }

   draw(words) {
      if (words.length === 0) return;

      this.chart
         .selectAll('g')
         .nodes()
         .forEach((n) => n.remove());

      this.chart
         .append('g')
         .attr(
            'transform',
            'translate(' +
               this.layout.size()[0] / 2 +
               ',' +
               this.layout.size()[1] / 2 +
               ')'
         )
         .selectAll('text')
         .data(words)
         .enter()
         .append('text')
         .style('font-size', function (d) {
            return d.size;
         })
         .style('fill', '#69b3a2')
         .attr('text-anchor', 'middle')
         .style('font-family', 'Impact')
         .attr('transform', function (d) {
            return 'translate(' + [d.x, d.y] + ')rotate(' + d.rotate + ')';
         })
         .text(function (d) {
            return d.text;
         });
   }

   setWidthAndHeight() {
      const svg = document.getElementById(this.config.id)?.querySelector('svg');
      if (svg) {
         this.width =
            svg.getBoundingClientRect().width -
            this.config.margin.left -
            this.config.margin.right;
         this.height =
            svg.getBoundingClientRect().height -
            this.config.margin.top -
            this.config.margin.bottom;
      }
   }
}
