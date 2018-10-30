/**
 * The main script of the feigenbaum bifurcation plotter.
 *
 * @author   Ikaros Kappler
 * @date     2018-10-23
 * @version  1.0.0
 **/


(function() {
    "use strict";

    // Fetch the GET params
    let GUP = gup();
    
    const DEFAULT_CANVAS_WIDTH = 1024;
    const DEFAULT_CANVAS_HEIGHT = 768;


    // +---------------------------------------------------------------------------------
    // | A helper function to trigger fake click events.
    // +----------------------------
    var triggerClickEvent = function(element) {
	element.dispatchEvent( new MouseEvent('click', {
	    view: window,
	    bubbles: true,
	    cancelable: true
	} ) );
    };

    

    // +---------------------------------------------------------------------------------
    // | Initialize everything.
    // +----------------------------
    window.addEventListener('load',function() {
	
	// +---------------------------------------------------------------------------------
	// | A global config that's attached to the dat.gui control interface.
	// +-------------------------------
	var config = {
	    plotX0                : 0.2,
	    plotIterations        : 1000,
	    plotStart             : 4.2,
	    plotEnd               : 6.0,
	    plotStep              : 0.01,
	    plotChunkSize         : 1.0,
	    plotScale             : 1.0,
	    
	    fullSize              : true,
	    fitToParent           : true,
	    drawEditorOutlines    : true,
	    backgroundColor       : '#ffffff',
	    rebuild               : function() { rebuild(); },
	    loadImage             : function() { var elem = document.getElementById('file');
						 elem.setAttribute('data-type','image-upload');
						 triggerClickEvent(elem);
					       },
	    saveFile              : function() { saveFile(); }
	};
	// Merge GET params into config
	for( var k in config ) {
	    if( !GUP.hasOwnProperty(k) )
		continue;
	    var type = typeof config[k];
	    if( type == 'boolean' ) config[k] = !!JSON.parse(GUP[k]);
	    else if( type == 'number' ) config[k] = JSON.parse(GUP[k])*1;
	    else if( type == 'function' ) ;
	    else config[k] = GUP[k];
	}

	
	var canvas              = document.getElementById('my-canvas'); 
	var ctx                 = canvas.getContext('2d');
	var draw                = new drawutils(ctx,false);
	var fill                = new drawutils(ctx,true);
	var image               = null; // An image.
	var imageBuffer         = null; // A canvas to read the pixel data from.
	var canvasSize          = { width : DEFAULT_CANVAS_WIDTH, height : DEFAULT_CANVAS_HEIGHT };
	//var dialog = new overlayDialog('dialog-wrapper');

	
	
	// +---------------------------------------------------------------------------------
	// | The re-drawing function.
	// +-------------------------------
	var redraw = function() {	    
	    // Note that the image might have an alpha channel. Clear the scene first.
	    ctx.fillStyle = config.backgroundColor; 
	    ctx.fillRect(0,0,canvasSize.width,canvasSize.height);

	    // Draw the background image?
	    if( image ) {
		if( config.fitImage ) {
		    ctx.drawImage(image,0,0,image.width,image.height,0,0,canvasSize.width,canvasSize.height);
		} else {
		    ctx.drawImage(image,0,0);
		}
	    }

	    draw.circle( {x:0,y:0}, Math.min(canvasSize.width,canvasSize.height)/3, '#ff8800' );

	    plotFeigenbaum();

	};


	// +---------------------------------------------------------------------------------
	// | ================================================================================
	// | | BEGIN: the math.
	// | ==============================
	// +-------------------------------
	var plotFeigenbaum = function() {
	    dialog.show( 'Starting ...', 'Calculating', [ { label : 'Cancel', action : function() { console.log('cancel'); timeoutKey = null; dialog.hide(); } }], {} );
	    //iterativeFeigenbaum( [4.1, 6.0], 0, 0, canvasSize.width, 0.01, 1.0, 1000, 0.2, 1.0 );
	    iterativeFeigenbaum( [ Math.min(config.plotStart,config.plotEnd), Math.max(config.plotStart,config.plotEnd) ],
				 0, // currentX
				 0, // Start at left canvas border
				 canvasSize.width, // Stop at right canvas border
				 config.plotStep,
				 config.plotChunkSize,
				 config.plotIterations,
				 config.plotX0,
				 config.plotScale,
				 function() {
				     fill.ctx.font = '8pt Monospace';
				     fill.string('range=['+Math.min(config.plotStart,config.plotEnd)+','+Math.max(config.plotStart,config.plotEnd)+'], xStep='+config.plotStep+', iterations='+config.plotIterations+', x0='+config.plotX0+', scale='+config.plotScale,5,10);  
				 }
			       );	    
	}

	// +---------------------------------------------------------------------------------
	// | A random key for the cancel button (iteration stops when timeoutKey==null).
	// +-------------------------------
	var timeoutKey = null;
	
	// +---------------------------------------------------------------------------------
	// | An iterative, sequential implementation of the feigenbaum bifurcation calculation.
	// +-------------------------------
	var iterativeFeigenbaum = function( range, curX, minX, maxX, xStep, xChunkSize, plotIterations, x0, scaleFactor, onFinish ) {
	    dialog.setMessage( 'curX=' + curX + ', maxX='+maxX + ', '+(((curX-minX)/(maxX-minX))*100).toPrecision(2)+'% complete<br>&lambda;='+ (range[0] + (range[1] - range[0])*(curX/(maxX-minX))).toPrecision(6)+'&hellip;' );
	    var lambda;
	    for( var x = curX; x < curX+xChunkSize; x += xStep ) {
		lambda = range[0] + (range[1] - range[0])*(x/(maxX-minX));
		var result = logisticMap( x0, lambda, plotIterations, new WeightedCollection(), 0 ); // console.log(result.maxWeight);
		for( var i in result.elements ) {
		    var alpha = result.elements[i].w/result.elements.length;
		    draw.dot( { x : x, y : result.elements[i].v * scaleFactor * canvasSize.height }, 'rgba(0,127,255,'+alpha+')', 1 );
		}
	    }
	    if( curX+xChunkSize < maxX ) {
		console.log( "Starting next iteration." );
		timeoutKey = Math.random();
		window.setTimeout( function() {
		    if( timeoutKey == null )
			return;
		    timeoutKey = null;
		    iterativeFeigenbaum( range, curX+xChunkSize, minX, maxX, xStep, xChunkSize, plotIterations, x0, scaleFactor, onFinish );
		}, 10 );
	    } else {	    
		console.log('Done.');
		if( typeof onFinish == 'function' ) onFinish();
		dialog.hide();
	    }
	};

	// +---------------------------------------------------------------------------------
	// | A simple numeric collection implementation working with epsilon.
	// +-------------------------------
	(function(_context) {
	    _context.Collection = (function() {
		var Collection = function( tolerance ) {
		    this.elements = [];
		    this.tolerance = tolerance | Collection.EPS;
		};
		Collection.EPS = 0.0000000001;
		Collection.prototype.contains = function( num ) {
		    for( var i in this.elements ) {
			if( Math.abs(this.elements[i]-num) <= this.tolerance )
			    return true;
		    }
		    return false;
		};
		Collection.prototype.add = function( num ) {
		    if( this.contains(num) )
			return false;
		    this.elements.push(num);
		    return true;
		};	
		return Collection;
	    })();
	})(window);

	// +---------------------------------------------------------------------------------
	// | A weighted numeric collection implementation working with epsilon.
	// +-------------------------------
	(function(_context) {
	    _context.WeightedCollection = (function() {
		var WeightedCollection = function( tolerance ) {
		    this.elements = [];
		    this.maxWeight = 0;
		    this.tolerance = tolerance | Collection.EPS;
		};
		WeightedCollection.EPS = 0.0000000001;
		WeightedCollection.prototype.locate = function( num ) {
		    for( var i in this.elements ) {
			if( Math.abs(this.elements[i].v-num) <= this.tolerance )
			    return i;
		    }
		    return -1;
		};
		WeightedCollection.prototype.add = function( num ) {
		    var index = this.locate(num);
		    if( index == -1 ) {
			this.elements.push( { v : num, w : 1 } );
			this.maxWeight = Math.max(this.maxWeight,1);
		    } else {
			this.elements[index].w++;
			this.maxWeight = Math.max(this.maxWeight,this.elements[index].w);
		    }
		    return true;
		};	
		return WeightedCollection;
	    })();
	})(window);

	// +---------------------------------------------------------------------------------
	// | The actual logistic function (recursive implementation).
	// +-------------------------------
	var logisticMap = function( value, lambda, iterations, collection ) {
	    var next_value = lambda * value * ( 1 - value );
	    // console.log( next_value );
	    if( next_value == null || next_value == undefined || isNaN(next_value) || !isFinite(next_value) || typeof next_value == 'undefined' || iterations-- <= 0 )
		return collection;
	    collection.add( next_value );
	    return logisticMap( next_value, lambda, iterations, collection );
	}
	// +---------------------------------------------------------------------------------
	// | ==============================
	// | | END: the math.
	// | ==============================
	// +-------------------------------
	
	
	// +---------------------------------------------------------------------------------
	// | Handle a dropped image: initially draw the image (to fill the background).
	// +-------------------------------
	var handleImage = function(e) {
	    var validImageTypes = "image/gif,image/jpeg,image/jpg,image/gif,image/png";
	    if( validImageTypes.indexOf(e.target.files[0].type) == -1 ) {
		if( !window.confirm('This seems not to be an image ('+e.target.files[0].type+'). Continue?') )
		    return;
	    }	    
	    var reader = new FileReader();
	    reader.onload = function(event){
		image = new Image();
		image.onload = function() {
		    // Create image buffer
		    imageBuffer        = document.createElement('canvas');
		    imageBuffer.width  = image.width;
		    imageBuffer.height = image.height;
		    imageBuffer.getContext('2d').drawImage(image, 0, 0, image.width, image.height);
		    redraw();
		}
		image.src = event.target.result;
	    }
	    reader.readAsDataURL(e.target.files[0]);     
	}

	
	// +---------------------------------------------------------------------------------
	// | Decide which file type should be handled:
	// |  - image for the background or
	// |  - JSON (for the point set)
	// +-------------------------------
	var handleFile = function(e) {
	    var type = document.getElementById('file').getAttribute('data-type');
	    if( type == 'image-upload' ) {
		handleImage(e);
	    } else {
		console.warn('Unrecognized upload type: ' + type );
	    }   
	}
	document.getElementById( 'file' ).addEventListener('change', handleFile );
	

	// +---------------------------------------------------------------------------------
	// | Just a generic save-file dialog.
	// +-------------------------------
	var saveFile = function() {
	    // See documentation for FileSaver.js for usage.
	    //    https://github.com/eligrey/FileSaver.js
	    var blob = new Blob(["Hello, world!"], {type: "text/plain;charset=utf-8"});
	    saveAs(blob, "helloworld.txt");
	};
	
	
	// +---------------------------------------------------------------------------------
	// | The rebuild function just evaluates the input and
	// |  - triangulate the point set?
	// |  - build the voronoi diagram?
	// +-------------------------------
	var rebuild = function() {
	    redraw();
	};


	// +---------------------------------------------------------------------------------
	// | This function resizes the canvas to the required settings (toggles fullscreen).
	// +-------------------------------
	var resizeCanvas = function( noRedraw ) {
	    var _setSize = function(w,h) {
		ctx.canvas.width  = w;
		ctx.canvas.height = h;		
		canvas.width      = w;
		canvas.height     = h;		
		canvasSize.width  = w;
		canvasSize.height = h;

		draw.offset.x = fill.offset.x = 0; // w/2;
		draw.offset.y = fill.offset.y = h-1; // h/2;
	    };
	    if( config.fullSize && !config.fitToParent ) {
		// Set editor size
		var width  = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
		var height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
		_setSize( width, height );
	    } else if( config.fitToParent ) {
		// Set editor size
		var width  = canvas.parentNode.clientWidth - 2; // 1px border
		var height = canvas.parentNode.clientHeight - 2; // 1px border
		_setSize( width, height );
	    } else {
                _setSize( DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT );
	    }
	    if( !noRedraw ) 
		redraw();
	};
	window.addEventListener( 'resize', resizeCanvas );
	resizeCanvas( true );


	// +---------------------------------------------------------------------------------
	// | Initialize dat.gui
	// +-------------------------------
	{ 
	    var gui = new dat.gui.GUI();
	    gui.remember(config);

	    gui.add(config, 'rebuild').name('Rebuild').title('Rebuild and redraw all.');

	    var fold1 = gui.addFolder('Plot settings');
	    fold1.add(config, 'plotX0').title('Set the x0 value to start the logistic function at.').min(0.01).max(2.0).step(0.01);
	    fold1.add(config, 'plotIterations').title('Set the number of max iterations for the logistic function.').min(1).max(10000).step(1);
	    fold1.add(config, 'plotStart').title('Set the lambda value to start at.').min(3.2).max(10.0).step(0.01);
	    fold1.add(config, 'plotEnd').title('Set to lambda value to stop at.').min(3.2).max(20.0).step(0.01);
	    fold1.add(config, 'plotStep').title('Set the plot step. 1 means one lambda step per pixel.').min(0.0001).max(1.0).step(0.0001);
	    fold1.add(config, 'plotChunkSize').title('What chunk size should be used for updating. 1 means each pixel.').min(0.001).max(1.0).step(0.0001);
	    fold1.add(config, 'plotScale').title('Scale the calculated values by this factor.').min(0.01).max(1000.0).step(0.01);
	    
	    var fold0 = gui.addFolder('Editor settings');
	    fold0.add(config, 'fullSize').onChange( resizeCanvas ).title("Toggles the fullpage mode.");
	    fold0.add(config, 'fitToParent').onChange( resizeCanvas ).title("Toggles the fit-to-parent mode (overrides fullsize).");
	    fold0.add(config, 'drawEditorOutlines').title("Toggle if editor outlines should be drawn.");
	    fold0.addColor(config, 'backgroundColor').title("Choose a background color.");
	    fold0.add(config, 'loadImage').name('Load Image').title("Load a background image to pick triangle colors from.");   
	}	

	
	// Initialize the dialog
	window.dialog = new overlayDialog('dialog-wrapper');
	// window.dialog.show( 'Inhalt', 'Test' );

	// Init	
	// redraw();
	dialog.show( 'Click <button id="_btn_rebuild">Rebuild</button> to plot the curves.', 'Hint', null, {} );
	document.getElementById('_btn_rebuild').addEventListener('click', rebuild);
	
    } ); // END document.ready / window.onload
    
})(); 




