_DEBUG = _DEBUG || {};
_DEBUG.load = false;
_DEBUG.spritesheet = true;
_DEBUG.sprites = false;

var _images = {};
var _sprites = {};
var _nullSpr = null;

function LoadImages(callback) {
	var loader = new PIXI.loaders.Loader();
	var sheets = 0;
	for(var i in _configuration.Images) {
		loader.add(i,_configuration.Images[i].image);
		sheets++;
	}
	loader.on('complete',function(loader,resources){
		for(var i in resources) {
			_DEBUG.load && console.log("Loaded Image: "+i);
			_images[i] = resources[i].texture;
			LoadConfig(_configuration.Images[i].config,function(config,image){
				LoadSprites(config, image, function(){
					sheets--;
					if(sheets==0){ callback(); }
				});
			},_images[i]);
		}
	});
	loader.load();
}
function LoadSprites( config, texture, callback ) {
	var w = config._width;
	var h = config._height;
	for(var s in config) {
		if(s[0]!="_") {
			var x = config[s].x * w;
			var y = config[s].y * h;
			_sprites[s] = new PIXI.Texture(texture, new PIXI.Rectangle(x,y,w,h));
			_DEBUG.sprites && console.log("Loaded Sprite: "+s+" from "+texture.baseTexture.imageUrl);
		}
	}
	_DEBUG.spritesheet && console.log("Finished loading sprites from "+texture.baseTexture.imageUrl)
	callback();
}

var _renderer = null;
function LoadRenderer( canvas, width, height, opts ) {
	if(canvas) {
		throw "not yet implemented";
	}
	else {
		_renderer = new PIXI.autoDetectRenderer(width||800,height||600,opts);
		document.body.appendChild( _renderer.view );
	}
}

var _configuration = null;
function LoadConfig( file, callback, extraData ) {
	$.getJSON(file).done(function(data){
		_DEBUG.load && console.log("Loaded Config: "+file);
		callback( data, extraData );
	}).fail(function(jqxhr,status,error){
		throw file+" could not be loaded: "+error;
	});
}
