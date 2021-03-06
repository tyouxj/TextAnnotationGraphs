import * as SVG from 'svg.js';
import Parser from './parse/parse.js';
import TreeLayout from './treelayout.js';
import * as ymljson from './ymljson.js';
import LabelManager from './managers/labelmanager.js';
import RowManager from './managers/rowmanager.js';
import Taxonomy from './managers/taxonomy.js';
import Tooltip from './managers/tooltip.js';
import Word from './components/word.js';
import WordCluster from './components/wordcluster.js';
import Link from './components/link.js';
import load from './xhr.js';

const Main = (function() {
  // classes
  let parser, lm, rm, tm;

  // main svg element
  let svg;
  let css = '';

  // node-link objects
  let words = [];
  let links = [];
  let clusters = [];

  // other html elements
  let tooltip = {};
  let tree = {};
  let options = {
    showSyntax: false,
    showLinksOnMove: false,
    showTreeInModal: false
  };

  //--------------------------------
  // public functions
  //--------------------------------
  /**
   * init:  set up singleton classes and create initial drawing
   */
  function init() {
    // setup
    let body = document.body.getBoundingClientRect();
    svg = new SVG.Doc('main')
      .size(body.width, window.innerHeight - body.top - 10);
    tooltip = new Tooltip('tooltip', svg);
    parser  = new Parser();
    rm      = new RowManager(svg);
    lm      = new LabelManager(svg);
    tm      = new Taxonomy('taxonomy');
    tree    = new TreeLayout('#tree', svg);

    if (document.getElementById('svgStyles')) {
      css = document.getElementById('svgStyles').innerHTML;
    }

    // load and render initial dataset by default
    changeDataset();

    setupSVGListeners();
    setupUIListeners();
  } // end init


  function setupSVGListeners() {
    // svg event listeners
    svg.on('row-resize', function(e) {
      lm.stopEditing();
      rm.resizeRow(e.detail.object.idx, e.detail.y);
    });

    // svg.on('label-updated', function(e) {
    //   // TODO: so so incomplete
    //   let color = tm.getColor(e.detail.label, e.detail.object);
    //   e.detail.object.node.style.fill = color;
    // });

    svg.on('word-move-start', function() {
      if (!options.showLinksOnMove && options.showSyntax) {
        setSyntaxVisibility(false);
      }
    });

    svg.on('word-move', function(e) {
      tooltip.clear()
      lm.stopEditing();
      rm.moveWordOnRow(e.detail.object, e.detail.x);
    });

    svg.on('word-move-end', function(e) {
      if (!options.showLinksOnMove && options.showSyntax) {
        setSyntaxVisibility(true);
      }
    });

    // svg.on('tag-remove', function(e) {
    //   e.detail.object.remove();
    //   tm.remove(e.detail.object);
    // });

    svg.on('row-recalculate-slots', function(e) {
      links.forEach(link => {
        link.resetSlotRecalculation();
      });
      links.forEach(link => {
        link.recalculateSlots(words);
        link.draw();
      });
    });

    svg.on('build-tree', function(e) {
      document.body.classList.remove('tree-closed');
      if (tree.isInModal) {
        setActiveTab('tree');
      }
      else {
        setActiveTab(null);
      }
      if (e.detail) {
        tree.graph(e.detail.object);
      }
      else {
        tree.resize();
      }
    });
  }

  function setActiveTab(pageId, modalId="modal") {
    let m = document.getElementById(modalId);
    if (pageId == null) {
      m.classList.remove('open');
    }
    else {
      m.classList.add('open');

      m.querySelector('.tab.active').classList.remove('active');
      m.querySelector('.page.active').classList.remove('active');
      m.querySelector('header span[data-id="' + pageId + '"]').classList.add('active');
      document.getElementById(pageId).classList.add('active');
    }
  }

  function setupUIListeners() {
    // window event listeners
    // resize function
    function resizeWindow() {
      let body = document.body.getBoundingClientRect();
      links.forEach(l => l.hide());
      svg.width(body.width);
      rm.width(body.width);
      setSyntaxVisibility();
    }
    window.onresize = debounce(resizeWindow, 200);

    document.getElementById('dataset').onchange = function(e) {
      if (this.selectedIndex > 0) {
        // FIXME: this can be improved by instead receiving the file name, rather than an index.
        changeDataset(this.selectedIndex);
      }
    }

    document.querySelectorAll('#options input').forEach(input => {
      input.onclick = function() {
        let option = this.getAttribute('data-option');
        switch(option) {
          case 'syntax':
            options.showSyntax = this.checked;
            setSyntaxVisibility();
            break;
          case 'links':
            options.showLinksOnMove = this.checked;
            break;
          case 'tree':
            options.showTreeInModal = this.checked;
            // document.querySelector('.tab[data-id="tree"]').style.display = this.checked ? 'inline-block' : 'none';
            break;
          default: ;
        }
      };
    });

    let modalHeader = document.querySelector('#modal header');
    let modalDrag = null;
    let modalWindow = document.querySelector('#modal > div');
    modalHeader.onmousedown = function(e) {
      modalDrag = e;
    }
    document.addEventListener('mousemove', function(e) {
      if (modalDrag) {
        let dx = e.x - modalDrag.x;
        let dy = e.y - modalDrag.y;
        modalDrag = e;
        let transform = modalWindow.style.transform.match(/-?\d+/g) || [0,0];
        transform[0] = +transform[0] + dx || dx;
        transform[1] = +transform[1] + dy || dy;
        modalWindow.style.transform = `translate(${transform[0]}px, ${transform[1]}px)`;
      }
    });
    document.addEventListener('mouseup', function() {
      modalDrag = null;
      let transform = modalWindow.style.transform.match(/-?\d+/g);
      if (!transform) { return; }

      let rect = modalWindow.getBoundingClientRect();
      if (rect.left > window.innerWidth - 50) {
        transform[0] -= (50 + rect.left - window.innerWidth);
      }
      else if (rect.right < 50) {
        transform[0] -= (rect.right - 50);
      }
      if (rect.top < 0) {
        transform[1] -= rect.top;
      }
      else if (rect.top > window.innerHeight - 50) {
        transform[1] -= (50 + rect.top - window.innerHeight);
      }
      modalWindow.style.transform = `translate(${transform[0]}px, ${transform[1]}px)`;
    });

    document.querySelectorAll('.modal header .tab').forEach(tab => {
      tab.onclick = function() {
        setActiveTab(this.getAttribute('data-id'));
      }
    });

    document.getElementById('custom-annotation').onclick = function() {
      document.getElementById('input-modal').classList.add('open');
    }

    document.getElementById('options-toggle').onclick = function() {
        setActiveTab('options');
    }
    document.getElementById('taxonomy-toggle').onclick = function() {
        setActiveTab('taxonomy');
    }
    document.querySelectorAll('.modal').forEach(modal => {
      modal.onclick = function(e) {
        e.target.classList.remove('open');
      }
    });

    // upload file
    document.getElementById('file-input').onchange = uploadFile;

    // upload file via drag and drop
    document.body.addEventListener('dragenter', (e) => e.preventDefault());
    document.body.addEventListener('dragover', (e) => e.preventDefault());
    document.body.addEventListener('drop', uploadFile);


    function exportFile() {

      let exportedSVG = svg.svg();
      let i = exportedSVG.indexOf('</defs>');
      exportedSVG = exportedSVG.slice(0, i)
        + '<style>' + css + '</style>'
        + exportedSVG.slice(i);
      let a = document.getElementById('download');
      a.setAttribute('href', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(exportedSVG));
      a.setAttribute('download', 'tag.svg');
      a.click();
    }
    document.getElementById('download-button').onclick = exportFile;
    document.addEventListener('keydown', (e) => {
      let key = e.keyCode || e.which;
      let ctrl = e.ctrlKey || (e.metaKey && !e.ctrlKey);
      if (key === 83 && ctrl) {
        e.preventDefault();
        exportFile();
      }
    })
  }

  /* read an externally loaded file */
  function uploadFile(e) {
    e.preventDefault();
    let files = (this === document.body) ? e.dataTransfer.files : e.target.files;

    // read blobs with FileReader
    const promises = [...files].map(file => {
      const fr = new FileReader();
      fr.readAsText(file);
      return new Promise((resolve, reject) => {
        fr.onload = function() {
          resolve({
            name: file.name,
            type: file.type,
            content: fr.result
          });
        };
      });
    });

    Promise.all(promises).then(files => {
      try {
        let message = parser.parseFiles(files);
        if (message) {
          redrawVisualization();
          printMessage(message);
        }
      }
      catch(err) {
        console.log('ERROR: ', err);
        printMessage(err);
      }
      document.getElementById('form').reset();
    });
  }

  function printMessage(text) {
    document.getElementById('message').textContent = text;
  }
  function clearMessage() {
    document.getElementById('message').textContent = '';
  }


  /**
   * changeDataset:  read and parse data from a json file in the /data folder
   *   and generate visualization from it
   */
  function changeDataset(index = 6) {
    let path;
    if (index >= 6) {
      path = `./data/example${index - 5}.ann`;
    }
    else {
      path = `./data/data${index}.json`;
    }

    parser.loadFile(path)
      .then(data => {
        redrawVisualization();
        clearMessage();
      })
      .catch(err => {
        console.log('ERROR: ', err);
        printMessage(err);
      });
  };

  /**
   * clear:  delete all elements from the visualization
   */
  function clear() {
    while (rm.rows.length > 0) {
      rm.removeRow();
    }
    links.forEach(link => link.svg && link.svg.remove());
  }

  function redrawVisualization() {
    let data = parser.parsedData;
    ymljson.convert('taxonomy.yml', function(taxonomy) {
      clear();
      words = data.words;
      links = data.links;
      clusters = data.clusters;
      setSyntaxVisibility();
      draw();

      tm.draw(taxonomy, words);
    });
  }

  /**
   * draw:  draw words, links, rows, etc. onto the visualization
   */
  function draw() {
    if (words.length > 0 && !rm.lastRow) {
      rm.appendRow();
    }
    words.forEach(word => {
      word.init(svg);
      rm.addWordToRow(word, rm.lastRow);
    });
    links.forEach(link => {
      link.init(svg);
    });
    links.forEach(link => {
      link.recalculateSlots(words);
      link.draw();
    })
    rm.resizeAll();
  }

  //--------------------------------
  // private functions
  //--------------------------------

  // from https://davidwalsh.name/javascript-debounce-function,
  // as taken from underscore

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  function debounce(func, wait, immediate) {
  	var timeout;
  	return function() {
  		var context = this, args = args;
  		var later = function() {
  			timeout = null;
  			if (!immediate) func.apply(context, args);
  		};
  		var callNow = immediate && !timeout;
  		clearTimeout(timeout);
  		timeout = setTimeout(later, wait);
  		if (callNow) func.apply(context, args);
  	};
  };


  /** options to set visibility of syntax tree
   */
  function setSyntaxVisibility(bool) {
    bool = (bool === undefined) ? options.showSyntax : bool;
    links.forEach(l => {
      if (!l.top) {
        bool ? l.show() : l.hide();
      }
      else {
        l.show();
      }
    });
    if (rm.rows.length > 0) {
      rm.resizeAll();
    }
  }

  // export public functions
  return {
    init,
    draw,
    changeDataset
  };

})();

Main.init();
