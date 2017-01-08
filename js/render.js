

//gets max slot number to be assigned to this word
function getHeightForWord(word) {
    
  var maxH = 0;

  console.log("in getHeightForWord " + word.toString());
  for (var ii = 0; ii < word.slotsL.length; ii++) {
    maxH = Math.max(maxH, word.slotsL[ii]);
  }

  for (var ii = 0; ii < word.slotsR.length; ii++) {
    maxH = Math.max(maxH, word.slotsR[ii]);
  }

  console.log("returning largest slot for this word = " + maxH );
  return maxH;
}


function drawRow(row) {
 
 console.log("in drawRow("+row.idx+")");

 row.rect = draw.rect(svgWidth,row.rh).x(0).y(row.ry).fill( {color:row.color} ).opacity(rowOpacity);
 row.lineTop = draw.line(0, row.ry, svgWidth, row.ry).stroke( { color: '#555555', opacity: 1.0, width: 0.5 })
 row.lineBottom = draw.line(0, row.ry+row.rh, svgWidth, row.ry+row.rh).stroke({ color: '#555555', opacity: 1.0, width: 0.5  })

  row.dragRect = draw.rect(dragRectSide,dragRectSide).x(svgWidth - (dragRectSide+dragRectMargin)).y(row.ry + row.rh - (dragRectSide+dragRectMargin)).fill( {color:'#000'} );

 setUpRowDraggable(row);

}

function calcuateMaxSlotForRow(row) {

  row.maxSlots = 0;

 /* 
  for (var i = 0; i < row.words.length; i++) {
    row.maxSlots = Math.max(row.maxSlots, getHeightForWord(row.words[i]));
  }
  */
 
  //hmm... we also have to calculate the slot # of the links that don't actually touch any words in this row, but pass through it, or when there are no words on this row...
  //so any link that starts earlier and ends later will have to be counted, which may mean we need to loop through all links (or sort them somehow...)

  //for each link
    //check minword's and maxword's row. If minw.row >= row && row <= maxw.row, check slot#  


  for (var i = 0; i < linkObjs.length; i++) { 
    var link = linkObjs[i];
    if (link.rootMinWord.row.idx <= row.idx && row.idx <= link.rootMaxWord.row.idx) {
      row.maxSlots = Math.max(row.maxSlots, link.h);
    }

  }

}


function setUpRowsAndWords(words) {

  var rowNum = 0;
  var row;

  for (var i = 0; i < words.length; i++) {

    var wh = getTextWidthAndHeight(wordObjs[i].val, texts.wordText.style);

    console.log("wh = " + wh.w + ", " + wh.h);

    if (i == 0) {

      rowNum = 0;
      row = new Row(rowNum);
      rows.push(row);
      row.maxSlots = 0;

      x = edgepadding;

    } else if (x + wh.w + (textpaddingX*2) + edgepadding > svgWidth) {

      rowNum++;
      row = new Row(rowNum);
      rows.push(row);
      row.maxSlots = 0;

      x = edgepadding;
    }

    var word = words[i];
    row.words.push(word);
    row.maxSlots = Math.max(row.maxSlots, getHeightForWord(word));
    word.row = row;
    word.tw = wh.w;
    word.th = texts.wordText.maxHeight; //wh.h;

    x += wh.w + (textpaddingX*2) + wordpadding;
  }

  for (var i = 0; i < rows.length; i++) {

    var row = rows[i];

    if (i == 0) {
      row.ry = 5;
    } else {
      row.ry = 5 + rows[row.idx - 1].ry + rows[row.idx - 1].rh;
    }

    row.rh = 10 + ((textpaddingY * 2) + texts.wordText.maxHeight) + (levelpadding * row.maxSlots);

    if (row.idx % 2 == 0) {
      row.color = evenRowsColor;
    } else {
      row.color = oddRowsColor;
    }

    var x = edgepadding;
    for (var ii = 0; ii < row.words.length; ii++) {

      var word = row.words[ii];

      word.h = 0; //the number of link levels is 0 for the word

      var textwh = getTextWidthAndHeight(word.val, texts.wordText.style);
      word.ww = textwh.w + (textpaddingX * 2);
      word.wx = x;

      word.wh = texts.wordText.maxHeight + textpaddingY*2; 
      word.wy = row.ry + row.rh - word.wh;

      x += textwh.w + (textpaddingX*2) + wordpadding;

      row.baseHeight = word.wy; //that is, where the top of the word is in the row.


    }
  }
}


function drawWord(word) {

  //if already exists, need to delete it first

  //var underneathRect = draw.rect( word.ww, word.wh ).x( word.wx ).y( word.wy ).fill( {color:'#ffffff',opacity: 1.0} ); //base layer, put text then tansparent draggable rect on top of this
  var underneathRect = draw.rect( word.ww, word.wh ).x( word.wx ).y( word.wy ).style(styles.wordFill.style);
   
    console.log(" in drawWord : word.row.ry = " + word.row.ry);
  //    var test = word.row.ry;// + word.row.rh; //word.wy;

  var textwh = getTextWidthAndHeight(word.val, texts.wordText.style);

  var text = draw.text(function(add) {
      
    add.text(word.val)
    .y(word.wy + textpaddingY - texts.wordText.descent)
    .x(word.wx + (word.ww/2) - (textwh.w / 2))
    .font(texts.wordText.style);
    });



    var rect = draw.rect(word.ww, word.wh).x( word.wx ).y( word.wy ).fill( {color:'#ffffff',opacity: 0.0} );

    var leftHandle = draw.rect(handleW, handleH).x(word.wx).y( word.wy + (word.wh / 2 ) - (handleH / 2) ).style(styles.handleFill.style);
      
      //fill( {color:handleColor}).opacity(0.0) ;
    

    var rightHandle = draw.rect(handleW,handleH).x(word.wx + word.ww - (handleW)).y( word.wy + (word.wh / 2 ) - (handleH / 2) ).style(styles.handleFill.style);

      

    word.text = text;
    word.rectSVG = rect;
    word.underneathRect = underneathRect;
    word.rect = rect.bbox();
    word.leftX = rect.bbox().x;
    word.rightX = rect.bbox().x + rect.bbox().w;
    word.leftHandle = leftHandle;
    word.rightHandle = rightHandle;

    setUpLeftHandleDraggable(leftHandle, rect, text, word, word.idx );
    setUpRightHandleDraggable(rightHandle, rect, text, word, word.idx );

    setUpWordDraggable(word); 
    setupMouseOverInteractions(word);

     rect.dblclick(function() {
      this.fill({ color: '#f06', opacity:0.5 })
      this.stroke( { color: '#000', opacity: 1, width: 1 } ) 
      //console.log("YOU CLICKED TWICE");
    });


       
}

function drawLinks(ls) {
  arrangeOffsetValsForAttachmentPoints(linkObjs); 
  arrangeOffsetValsForAttachmentPoints(wordObjs); 

  groupAllElements = draw.group();

  Object.keys(ls).forEach(function(key) {
    drawLink(ls[key]);
  });
}

function drawWords(words) {

  var row = 0;
  var x = 0;

  //debugSlots();

  setUpRowsAndWords(words);

  //makes things easier if all row rects are drawn first, before *any* words
  for (var i = 0; i < rows.length; i++) {
    rows[i].draw();
  }

  for (var i = 0; i < rows.length; i++) {
    for (var ii = 0; ii < rows[i].words.length; ii++) {
      rows[i].words[ii].draw();
    }
  }

}

/* fine for now, but really should be more granular, i.e., by row, or by thinks a dragged link affects, etc */
function redrawLinks() {

  groupAllElements.clear();

  Object.keys(linkObjs).forEach(function(key) {
    drawLink(linkObjs[key]);
  });
}

function getXPosForAttachmentByPercentageOffset(link) {

  var leftX_1 = getLeftXForLeftWord(link);
  var rightX_1 = getRightXForLeftWord(link);
  var leftX_2 = getLeftXForRightWord(link); 
  var rightX_2 = getRightXForRightWord(link);

  var lengthOfHalfOfLeftWord = ((rightX_1 - leftX_1) / 2);
  var lengthOfHalfOfRightWord = ((rightX_2 - leftX_2) / 2)

    if (link.leftAttach == 0) { //attaches to the left side of the left word
      xL = leftX_1 + (lengthOfHalfOfLeftWord * link.x1percent) ;
    } else { //right
      xL = (rightX_1) - ( lengthOfHalfOfLeftWord * link.x1percent); 
    }

  if (link.rightAttach == 0) { //attaches to the left side of the right word
    xR =  leftX_2 + (lengthOfHalfOfRightWord * link.x2percent); 
  } else { //right
    xR = (rightX_2 ) - (lengthOfHalfOfRightWord * link.x2percent);
  }

  return {left:xL, right:xR};
}




function getLinkStyles(link) {

  var linkStyles = [];

  var c1, c2;
  var styleStr;

  for (var i = 0; i < link.numLineSegments; i++) {

    if (link.style.stroke instanceof LinearGradient) {
      c1 = link.style.stroke.c1;
      c2 = link.style.stroke.c2;

      var sp = ((i) / link.numLineSegments) - 0.1;
      var ep = ((i + 1) / link.numLineSegments) + 0.1; 
      //seems to help user to recognize same line on different rows when we overlap the gardient transitions? .. testing w +0.1 and -0.1 on percents..., but may want to play around with it or remove it...

      var uc1 = chroma.mix(c1, c2, sp).hex();
      var uc2 = chroma.mix(c1, c2, ep).hex();

      var g = groupAllElements.gradient('linear', 
          function(stop) { 
            stop.at(0.0, uc1); 
            stop.at(1.0, uc2);
          });

      styleStr =  "fill:none;stroke:url(#" + g.node.id + ");stroke-width:"+link.style.width+";stroke-opacity:"+link.style.opacity+";stroke-dasharray:"+ link.style.dasharray + ";";

    } else {
      styleStr = link.style.style;
    }

    linkStyles.push(styleStr);
  }

  return linkStyles;

}

function drawLink(link) {

  console.log ("\n\n in drawLink(" + link.id + ")");

  var hidePercentage = 2;
  var hidePercentage2 = 7;

  var attachmentXPositions = getXPosForAttachmentByPercentageOffset(link);

  var xL = attachmentXPositions.left;
  var xR = attachmentXPositions.right;

  var x1 = xL;
  var x2 = xL;
  var x3 = xR;
  var x4 = xR;

  //calc y pos
  var y1,y2,y3,y4;

  link.lines = [];
  link.linesLeftX = [];
  link.linesRightX = [];
  link.numLineSegments = 0;

  var minRow = link.rootMinWord.row.idx;
  var maxRow = link.rootMaxWord.row.idx;

  if (maxRow > minRow) { //on different rows!

    link.numLineSegments = (maxRow - minRow)+1;
    var linkStyles = getLinkStyles(link);

    for (var i = minRow; i <= maxRow; i++) {

      var availableHeight = rows[i].baseHeight - rows[i].rect.bbox().y;
      var percentagePadding = availableHeight /  (rows[i].maxSlots + 1);

      if (i == minRow) { //FIRST ROW

          y1 = rows[i].baseHeight - link.leftWord.h * percentagePadding;
          y2 = rows[i].baseHeight - link.h * percentagePadding;
          y3 = rows[i].baseHeight - link.h * percentagePadding;

          var p1x = x1; 
          var p1y = y1;

          var p2x = x2; 
          var p2y = y2;

        var p3x = svgWidth; 
        var p3y = y3;

        var line = groupAllElements.polyline([ [p1x,p1y],[p2x,p2y],[p3x,p3y] ]);
        
                link.lines.push(line);
        link.linesLeftX.push(p1x);
        link.linesRightX.push(p3x);
        
        if (percentagePadding >= hidePercentage) { //only bother drawing links if there's room in the row

          line.style(linkStyles[i - minRow]);


          if (link.direction == directions.BACKWARD) {
            drawDownArrow(p1x, p1y, link, link.leftWord, link.leftAttach, getLeftXForLeftWord(link), getRightXForLeftWord(link)  ) ;
          } else if (link.direction == directions.FORWARD){
            drawUpArrow(p1x, p1y, link, link.leftWord, link.leftAttach, getLeftXForLeftWord(link), getRightXForLeftWord(link));
          } else if (link.direction == directions.BOTH) {
            drawDownArrow(p1x, p1y, link, link.leftWord, link.leftAttach, getLeftXForLeftWord(link), getRightXForLeftWord(link)  ) ;
          } else { //NONE
            drawUpArrow(p1x, p1y, link, link.leftWord, link.leftAttach, getLeftXForLeftWord(link), getRightXForLeftWord(link));
          }

        } else { //row is too small
          line.style(styles.hiddenLine.style);
        }

        if (percentagePadding >= hidePercentage2) { 
          var style;
          if (i % 2 == 0) {
            style = styles.labelEvenFill.style;
          } else {
            style = styles.labelOddFill.style;
          }

          drawLinkLabel("top", (p2x+p3x) / 2, p2y, style);
        }


      } else if (i == maxRow) { //LAST ROW


        y2 = rows[i].baseHeight - link.h * percentagePadding;
        y3 = rows[i].baseHeight - link.h * percentagePadding;
        y4 = rows[i].baseHeight - link.rightWord.h * percentagePadding;

        var p2x = 0; 
        var p2y = y2;
        //var p2y = uy;

        var p3x = xR; 
        var p3y = y3;
        //var p3y = uy;

        var p4x = xR; 
        var p4y = y4;

       
        var line = groupAllElements.polyline([ [p2x,p2y],[p3x,p3y],[p4x,p4y] ]);
        
        link.lines.push(line);
        link.linesLeftX.push(p2x);
        link.linesRightX.push(p4x);
        
        if (percentagePadding >= hidePercentage) { //only bother drawing links if there's room in the row
          line.style(linkStyles[i - minRow]);

          if (link.direction == directions.FORWARD) {        
            drawDownArrow(p4x, p4y, link, link.rightWord, link.rightAttach, getLeftXForRightWord(link), getRightXForRightWord(link)   );
          } else if (link.direction == directions.BACKWARD) {
            drawUpArrow(p4x, p4y, link, link.rightWord, link.rightAttach, getLeftXForRightWord(link), getRightXForRightWord(link)  );
          } else if (link.direction == directions.BOTH) {

            drawDownArrow(p4x, p4y, link, link.rightWord, link.rightAttach, getLeftXForRightWord(link), getRightXForRightWord(link)   );
          } else { //NONE
            drawUpArrow(p4x, p4y, link, link.rightWord, link.rightAttach, getLeftXForRightWord(link), getRightXForRightWord(link)  );
          }
        } else { //row is too small
          line.style(styles.hiddenLine.style);
        }

       
        if (percentagePadding >= hidePercentage2) { 
          var style;
          if (i % 2 == 0) {
            style = styles.labelEvenFill.style;
          } else {
            style = styles.labelOddFill.style;
          }

          drawLinkLabel("fin",  (p2x+p3x) / 2, p2y, style);
        }

      } else { //middle row...


        y2 = rows[i].baseHeight - link.h * percentagePadding;
        y3 = rows[i].baseHeight - link.h * percentagePadding;

        var p2x = 0; 
        var p2y = y2;
        var p3x = svgWidth; 
        var p3y = y3;


        //adding the first coordinate since the linearGradients don't seem to calculate on polylines with only 2 points!!! Seems to be an SVG bug!!! (the first coordinate is offscreen and so doesn't cause any problems... but I can imagine this could come back to haunt us...
        var line = groupAllElements.polyline([ [p2x-10,p2y-10],[p2x,p2y],[p3x,p3y] ]); 

        link.lines.push(line);
        link.linesLeftX.push(p2x);
        link.linesRightX.push(p3x);


        if (percentagePadding >= hidePercentage) { //only bother drawing links if there's room in the row
          line.style(linkStyles[i - minRow]);

        } else { //row is too small
          line.style(styles.hiddenLine.style);
        }

        if (percentagePadding >= hidePercentage2) { 

          var labelStyle;
          if (i % 2 == 0) {
            labelStyle = styles.labelEvenFill.style;
          } else {
            labelStyle = styles.labelOddFill.style;
          }

          drawLinkLabel("mid",  (p2x+p3x) / 2, p2y, labelStyle);
        }
      }
}
} else { //both ends of this link are on the same row - minRow and maxRow are the same

  link.numLineSegments = 1;

  var availableHeight = rows[minRow].baseHeight - rows[minRow].rect.bbox().y;
  var percentagePadding = availableHeight / (rows[minRow].maxSlots + 1);

  y1 = rows[minRow].baseHeight - link.leftWord.h * percentagePadding;
  y2 = rows[minRow].baseHeight - link.h * percentagePadding;
  y3 = rows[minRow].baseHeight - link.h * percentagePadding;
    y4 = rows[minRow].baseHeight - link.rightWord.h * percentagePadding;

    var p1x = x1; 
    var p1y = y1;

    var p2x = x2; 
    var p2y = y2;

    var p3x = x3; 
    var p3y = y3;

    var p4x = x4; 
    var p4y = y4;

    var line = groupAllElements.polyline([ [p1x,p1y],[p2x,p2y],[p3x,p3y],[p4x,p4y] ]);

    link.lines.push(line); 
    link.linesLeftX.push(p1x);
    link.linesRightX.push(p4x);

    
    if (percentagePadding >= hidePercentage) { //only bother drawing links if there's room in the row

      line.style(link.style.style);


      if (link.direction == directions.FORWARD) {
        drawUpArrow(p1x, p1y, link, link.leftWord, link.leftAttach, getLeftXForLeftWord(link), getRightXForLeftWord(link));

        drawDownArrow(p4x, p4y, link, link.rightWord, link.rightAttach, getLeftXForRightWord(link), getRightXForRightWord(link) );

          } else if (link.direction == directions.BACKWARD) {
        drawDownArrow(p1x, p1y, link, link.leftWord, link.leftAttach, getLeftXForLeftWord(link), getRightXForLeftWord(link) ) ;

        drawUpArrow(p4x, p4y, link, link.rightWord, link.rightAttach, getLeftXForRightWord(link), getRightXForRightWord(link) );

      } else if (link.direction == directions.BOTH) {

        drawDownArrow(p1x, p1y, link, link.leftWord, link.leftAttach, getLeftXForLeftWord(link), getRightXForLeftWord(link) ) ;

        drawDownArrow(p4x, p4y, link, link.rightWord, link.rightAttach, getLeftXForRightWord(link), getRightXForRightWord(link)   );


      } else {
        drawUpArrow(p1x, p1y, link, link.leftWord, link.leftAttach, getLeftXForLeftWord(link), getRightXForLeftWord(link));

        drawUpArrow(p4x, p4y, link, link.rightWord, link.rightAttach, getLeftXForRightWord(link), getRightXForRightWord(link) );


      }

    } else {
      line.style(styles.hiddenLine.style);
    }
 
    

 
    if (percentagePadding >= hidePercentage2) { 


      var style;
      if (minRow % 2 == 0) {
        style = styles.labelEvenFill.style;
      } else {
        style = styles.labelOddFill.style;
      }

      drawLinkLabel("one",  (p2x+p3x) / 2, p2y, style);
    }

  }

  setupLineInteractions(link);
}


/* testing adding labels to links... 
 *
 * TODO - draw all of these labels / rects last, after all links are drawn, to prevent inconsistant overlaps
 */
function drawLinkLabel(str, tx, ty, style) { // backgroundcolor ) {

  var testLinkLabel = true; //false;

  if (testLinkLabel) {
    var twh = getTextWidthAndHeight(str, texts.linkText.style);

    //groupAllElements.rect(twh.w + 4, maxTextH2).x( tx - 2 - twh.w/2).y( ty - maxTextH2/2 ).fill(backgroundcolor).stroke( {color:linkStrokeColor, opacity:1.0} ).radius(3,3);
    var linkLabelRect = groupAllElements.rect(twh.w + 4, texts.linkText.maxHeight).x( tx - 2 - twh.w/2).y( ty - texts.linkText.maxHeight/2 ); 

    linkLabelRect.style(style);

    //.fill(backgroundcolor).opacity(opac).stroke( {color:linkStrokeColor, opacity:0.0} );

    groupAllElements.text(str).x( tx - twh.w/2 ).y(ty - texts.linkText.maxHeight/2 - texts.linkText.descent).font(texts.linkText.style);
  }

}

function getLeftXForLeftWord(link) {
  if (link.ts == types.WORD) {
    return link.leftWord.leftX;
  } else { //link
    if (link.leftAttach == sides.LEFT) {
      return link.leftWord.linesLeftX[0];
    } else {
      return link.leftWord.linesLeftX[link.leftWord.numLineSegments-1];
    }
  }
}

function getRightXForLeftWord(link) {
  if (link.ts == types.WORD) {
    return link.leftWord.rightX;
  } else { //link
    if (link.leftAttach == sides.LEFT) {
      return link.leftWord.linesRightX[0];
    } else {
      return link.leftWord.linesRightX[link.leftWord.numLineSegments-1];
    }
  }
}

function getLeftXForRightWord(link) {
  if (link.te == types.WORD) {
    return link.rightWord.leftX;
  } else { //link
    if (link.rightAttach == sides.LEFT) {
      return link.rightWord.linesLeftX[0];
    } else {
      return link.rightWord.linesLeftX[link.rightWord.numLineSegments-1];
    }
  }
}

function getRightXForRightWord(link) {
  if (link.te == types.WORD) {
    return link.rightWord.rightX;
  } else { //link
    if (link.rightAttach == sides.LEFT) {
      return link.rightWord.linesRightX[0];
    } else {
      return link.rightWord.linesRightX[link.rightWord.numLineSegments-1];
    }
  }
}

function drawDownArrow(x, y, link, word, side, leftX, rightX, opacity) {

  var tipy = y + 0;

  var a1 = 'M' + x + ',' + (tipy) + ' ';
  var a2 = 'L' + (x-arrowW) + ',' + (tipy-arrowH) + ' ';
  var a3 = 'L' + (x) + ',' + (tipy-arrowMH) + ' ';
  var a4 = 'L' + (x+arrowW) + ',' + (tipy-arrowH);
  var a5 = 'z';

  var arrow = a1 + a2 + a3 + a4;

  var path = groupAllElements.path(arrow).style(styles.arrowFill.style);

  dragArrow(path, link, word, side, leftX, rightX);

  return path;
}


function drawUpArrow(x, y, link, word, side, leftX, rightX, opacity) {
  /*
     var tipy = y - 1;

     var a1 = 'M' + x + ',' + (tipy) + ' ';
     var a2 = 'L' + (x-arrowW) + ',' + (tipy-arrowH) + ' ';
     var a3 = 'L' + (x) + ',' + (tipy-arrowMH) + ' ';

     var a4 = 'L' + (x+arrowW) + ',' + (tipy-arrowH);
     var a5 = 'z';

     var arrow = a1 + a2 + a3 + a4;
     */
  var path = groupAllElements.circle(5).cx(x).cy(y-3).style(styles.arrowFill.style);


  dragArrow(path, link, word, side, leftX, rightX);

  return path;
}






