var _DEBUG = _DEBUG || {};
_DEBUG.mapsprites = false;
_DEBUG.map = false;
_DEBUG.fov = false;
_DEBUG.clean = false;
_DEBUG.tiles = false;

var _Map = function( name ) {
	var self = this;

	self.name = name;

	self.tiles = [];
	self.dirty = true;
	self.Edges = {
		top:0,
		left:0,
		bottom:0,
		right:0
	}
	self.layers = [];

	self.creatures = [];

	self.view = new PIXI.Container();

	self.AddLayer('cells');
}
_Map.prototype.AddToLayer = function( sprite, layer ) {
	if(!this.layers[layer]) {
		this.AddLayer(layer);
		_DEBUG.mapsprites && console.log('Added sprite to layer ['+layer+'] on map ['+this.name+']');
	}
	this.layers[layer].addChild(sprite);
}
_Map.prototype.AddLayer = function( layer ) {
	if(!this.layers[layer]) {
		this.layers[layer] = new PIXI.Container();
		this.view.addChild(this.layers[layer]);
		_DEBUG.map && console.log('Added layer ['+layer+'] on map ['+this.name+']');
	} else {
		throw "layer already exists";
	}
}

_Map.prototype.GetCell = function( x, y ) {
	x = 1*x;
	y = 1*y;
	if( !this.tiles[x] || !this.tiles[x][y] ){ return false; }
	return this.tiles[x][y];
}
_Map.prototype.SetCell = function( x, y, type ) {
	x = 1*x;
	y = 1*y;
	if( !this.tiles[x] ){ this.tiles[x] = []; }

	if( !this.tiles[x][y] ){ this.tiles[x][y] = new _Tile(this,type); }
	else { this.GetCell(x,y).type = type; }
	tile = this.GetCell(x,y);
	tile.x = x;
	tile.y = y;
	this.dirty = true;

	this.Edges.top = Math.min( this.Edges.top , y );
	this.Edges.left = Math.min( this.Edges.left , x );
	this.Edges.bottom = Math.max( this.Edges.bottom , y );
	this.Edges.right = Math.max( this.Edges.right , x );

	this.AddToLayer(tile.sprite,'cells');
}
_Map.prototype.IterateCells = function( callback, context ) {
	for(var x in this.tiles) {
		for(var y in this.tiles[x]) {
			callback.apply( context, [ {x:x,y:y} , this.tiles[x][y] ] );
		}
	}
}

_Map.prototype.IsCellTransparent = function( x, y ) {
	var cell = this.GetCell(x,y);
	if(cell){ return cell.type.transparency; }
	return false;
}
_Map.prototype.IsCellVisible = function( x, y ) {
	var cell = this.GetCell(x,y);
	if(cell){ return cell.visible; }
	return false;
}
_Map.prototype.IsCellWalkable = function( x, y ) {
	var cell = this.GetCell(x,y);
	if(cell){ return cell.type.walkable; }
	return false;
}

_Map.prototype.CastFOV = function( vx, vy, vd ) {
	var t = Date.now();

	var vismap = [];
	var setter = function(x,y,v) {
		if(!vismap[x]) { vismap[x] = []; }
		vismap[x][y] = v;
	}
	var visible = function(x,y) {
		if(!vismap[x] || !vismap[x][y]) { return false; }
		return vismap[x][y];
	}
	this.IterateCells(function(pos,tile){
		setter(pos.x,pos.y,false);
	});
	setter(vx,vy,true);
	this.ComputeFOV(vx,vy,vd, 1, 1, visible, setter );
	this.ComputeFOV(vx,vy,vd, 1,-1, visible, setter );
	this.ComputeFOV(vx,vy,vd,-1, 1, visible, setter );
	this.ComputeFOV(vx,vy,vd,-1,-1, visible, setter );

	var dt = Date.now() - t;
	_DEBUG.fov && console.log('fov in '+dt+'ms');

	return vismap;
}
_Map.prototype.ComputeFOV = function( vx, vy, vd, dx, dy, Visible, Setter ) {
	var startAngle = new Array();
    startAngle[99]=undefined;
    var endAngle = startAngle.slice(0);
    //octant: vertical edge:
    var iteration = 1;
    var done = false;
    var totalObstacles = 0;
    var obstaclesInLastLine = 0;
    var minAngle = 0.0;
    var x = 0;
    var y = vy + dy;
    var c;

	var slopesPerCell, halfSlopes, processedCell, minx, maxx, pos, visible,
        startSlope, centerSlope, endSlope, idx;
    //do while there are unblocked slopes left and the algo is within the map's boundaries
    //scan progressive lines/columns from the PC outwards
    if( ( y < this.Edges.top ) || ( y > this.Edges.bottom ) ) { done = true; }
	while(!done) {
		//process cells in the line
        slopesPerCell = 1.0 / (iteration + 1);
        halfSlopes = slopesPerCell * 0.5;
        processedCell = parseInt(minAngle / slopesPerCell);
        minx = Math.max(this.Edges.left, vx - iteration);
        maxx = Math.min(this.Edges.right, vx + iteration);
        done = true;
        x = vx + (processedCell * dx);
        while((x >= minx) && (x <= maxx)){
            visible = true;
            startSlope = processedCell * slopesPerCell;
            centreSlope = startSlope + halfSlopes;
            endSlope = startSlope + slopesPerCell;
            if( (obstaclesInLastLine > 0) &&
				(!Visible(x,y))) {
                idx = 0;
                while(visible && (idx < obstaclesInLastLine)){
                    if(this.IsCellTransparent(x,y)){
                        if((centreSlope > startAngle[idx]) && (centreSlope < endAngle[idx]))
                            visible = false;
                    }
                    else if ((startSlope >= startAngle[idx]) && (endSlope <= endAngle[idx])) {
                        visible = false;
					}
                    if(	visible && (
							(!Visible(x,y-dy)) ||
							(!this.IsCellTransparent(x,y-dy))
						) && (
							(x - dx >= this.Edges.left) &&
							(x - dx <= this.Edges.right) &&
							(
								(!Visible(x-dx,y-dy)) ||
                            	(!this.IsCellTransparent(x-dx,y-dy))
							)
						)
					) {
                        visible = false;
					}
                    idx += 1;
               }
            }
            if(visible){
				Setter(x,y,true);
                done = false;
                //if the cell is opaque, block the adjacent slopes
                if(!this.IsCellTransparent(x,y)){
                    if(minAngle >= startSlope) minAngle = endSlope;
                    else{
                        startAngle[totalObstacles] = startSlope;
                        endAngle[totalObstacles] = endSlope;
                        totalObstacles += 1;
                    }
                }
            }
            processedCell += 1;
            x += dx;
        }
        if(iteration == vd) done = true;
        iteration += 1
        obstaclesInLastLine = totalObstacles;
        y += dy;
        if( ( y < this.Edges.top ) || ( y > this.Edges.bottom ) ) { done = true; }
        if(minAngle == 1.0) { done = true; }
	}

	//octant: horizontal edge
    iteration = 1; //iteration of the algo for this octant
    done = false;
    totalObstacles = 0;
    obstaclesInLastLine = 0;
    minAngle = 0.0;
    x = (vx + dx); //the outer slope's coordinates (first processed line)
    y = 0;
    //do while there are unblocked slopes left and the algo is within the map's boundaries
    //scan progressive lines/columns from the PC outwards
    if( ( x < this.Edges.left ) || ( x > this.Edges.right ) ) { done = true; }
    while(!done){
        //process cells in the line
        slopesPerCell = 1.0 / (iteration + 1);
        halfSlopes = slopesPerCell * 0.5;
        processedCell = parseInt(minAngle / slopesPerCell);
        miny = Math.max( this.Edges.top , vy - iteration);
        maxy = Math.min( this.Edges.bottom , vy + iteration);
        done = true;
        y = vy + (processedCell * dy);
        while( (y >= miny) && (y <= maxy) ){
            //calculate slopes per cell
            visible = true;
            startSlope = (processedCell * slopesPerCell);
            centreSlope = startSlope + halfSlopes;
            endSlope = startSlope + slopesPerCell;
            if((obstaclesInLastLine > 0) && (!Visible(x,y))){
                idx = 0;
                while(visible && (idx < obstaclesInLastLine)) {
                    if(this.IsCellTransparent(x,y)){
                        if((centreSlope > startAngle[idx]) && (centreSlope < endAngle[idx])) visible = false;
                    }
                    else if((startSlope >= startAngle[idx]) && (endSlope <= endAngle[idx])) visible = false;

                    if( visible && (
							(!Visible(x-dx,y)) ||
                            (!this.IsCellTransparent(x-dx,y))
						) && (
							(y - dy >= this.Edges.top) &&
							(y - dy <= this.Edges.bottom) &&
                            (
								(!Visible(x-dx,y-dy)) ||
                    			(!this.IsCellTransparent(x-dx,y-dy))
							)
						)
					) {
						visible = false;
					}
                    idx += 1;
               }
            }
            if(visible){
				Setter(x,y,true);
                done = false;
                //if the cell is opaque, block the adjacent slopes
                if(!this.IsCellTransparent(x,y)) {
                    if(minAngle >= startSlope) minAngle = endSlope;
                    else{
                        startAngle[totalObstacles] = startSlope;
                        endAngle[totalObstacles] = endSlope;
                        totalObstacles += 1;
                    }
                }
            }
            processedCell += 1;
            y += dy;
        }
        if(iteration == vd) done = true;
        iteration += 1;
        obstaclesInLastLine = totalObstacles;
        x += dx;
        if( ( x < this.Edges.left ) || ( x > this.Edges.right ) ) { done = true; }
        if(minAngle == 1.0) done = true;
    }
}

_Map.prototype.CellFOV = function( x, y, d ) {
	var m = this.CastFOV(x,y,d);
	this.IterateCells(function(pos,cell){
		cell.visible = m[pos.x][pos.y];
		cell.known = cell.known || cell.visible;
	});
	this.dirty = true;
}

_Map.prototype.Clean = function() {
	_DEBUG.clean && console.log('Cleaning map ['+this.name+']');
	this.IterateCells(function(pos,cell){
		cell.Update();
	});
	this.creatures.forEach(function(cre){
		cre.Update();
	});
	this.dirty=false;
}

_Map.prototype.CarveShape = function( shape ) {
	for(var x in shape.mapping) {
		for( var y in shape.mapping[x] ) {
			var s = shape.styles[shape.mapping[x][y]];
			s && this.SetCell(x,y,s);
		}
	}
}




var _Shape = function() {
	var self = this;

	self.styles = [];
	self.mapping = [];
}
_Shape.prototype.AddStyle = function( style ) {
	var i = this.styles.indexOf(style);
	if(i == -1) {
		this.styles.push(style);
		return this.styles.indexOf(style);
	}
	return this.styles[i];
}
_Shape.prototype.SetPlace = function( x, y, type, override ) {
	if( !this.mapping[x] ){ this.mapping[x] = []; }
	if( !this.mapping[x][y] ){ this.mapping[x][y] = type; }
	else if(override) { this.mapping[x][y] = type; }
}
_Shape.prototype.Rectangle = function( x, y, w, h, fillStyle, fillOverride, borderWidth, borderStyle, borderOverride ) {
	xx = x - borderWidth;
	yy = y - borderWidth;

	for(var i=0;i<w+borderWidth*2;i++) { // Vertical border
		for(var j=0; j<borderWidth; j++) {
			this.SetPlace(xx+i,yy+j,borderStyle,borderOverride);
			this.SetPlace(xx+i,y+h+j,borderStyle,borderOverride);
		}
	}
	for(var j=0;j<h+borderWidth*2;j++) { // Horizontal border
		for(var i=0; i<borderWidth; i++) {
			this.SetPlace(xx+i,yy+j,borderStyle,borderOverride);
			this.SetPlace(x+w+i,yy+j,borderStyle,borderOverride);
		}
	}
	for(var i=0;i<w;i++) { // Fill
		for(var j=0;j<h;j++) {
			this.SetPlace(x+i,y+j,fillStyle,fillOverride);
		}
	}
}


var _Tile = function( parent, type ) {
	var self = this;

	self.type = type;
	self.parent = parent;
	self.x = 0;
	self.y = 0;
	self.sprite = new PIXI.Sprite(_nullSpr);
	//self.color = 0xffffff;

	self.visible = false;
	self.known = false;

	self.Update = function() {
		if(PDis(self,_Player)>_configuration.noViewDis){ self.sprite.renderable = false; return 'oom'; }
		var tex = self.type.Select( self.parent, self );
		if(tex) {
			self.sprite.texture = tex;
			self.sprite.renderable = true;
		}
		else {
			self.sprite.renderable = false;
			_DEBUG.tiles && console.log('Couldn\'t Load Texture');
			return 'fail';
		}
		self.sprite.x = self.x * self.sprite.width;
		self.sprite.y = self.y * self.sprite.height;
		return type.Selector( self.parent, self );
		//self.sprite.tint = self.color;
	}
}

var _SmartTileType = function( name, walkable, transparency, isWall, selector, _img ) {
	var self = this;

	self.name = name;
	self.walkable = walkable?true:false;
	self.transparency = transparency?true:false;
	{
		self.n = _img.n || null;
		self.e = _img.e || null;
		self.w = _img.w || null;
		self.s = _img.s || null;
		self.ne = _img.ne || null;
		self.nw = _img.nw || null;
		self.ns = _img.ns || null;
		self.ew = _img.ew || null;
		self.es = _img.es || null;
		self.ws = _img.ws || null;
		self.new = _img.new || null;
		self.nes = _img.nes || null;
		self.nws = _img.nws || null;
		self.ews = _img.ews || null;
		self.news = _img.news || null;
		self.z = _img.z || null;

		self.m_n = _img.m_n || null;
		self.m_e = _img.m_e || null;
		self.m_w = _img.m_w || null;
		self.m_s = _img.m_s || null;
		self.m_ne = _img.m_ne || null;
		self.m_nw = _img.m_nw || null;
		self.m_ns = _img.m_ns || null;
		self.m_ew = _img.m_ew || null;
		self.m_es = _img.m_es || null;
		self.m_ws = _img.m_ws || null;
		self.m_new = _img.m_new || null;
		self.m_nes = _img.m_nes || null;
		self.m_nws = _img.m_nws || null;
		self.m_ews = _img.m_ews || null;
		self.m_news = _img.m_news || null;
		self.m_z = _img.m_z || null;
	}
	self.Selector = selector;
	self.isWall = isWall;
	self.Select = function( map, tile ) {
		var sel = self.Selector( map, tile );
		if(tile.visible){ return (self[sel] || _nullSpr); }
		if(tile.known){ return (self['m_'+sel] || _nullSpr); }
		return _nullSpr;
	};
}

var _TileType = function( name, walkable, transparency, isWall, _img ) {
	var self = this;

	self.name = name;
	self.walkable = walkable?true:false;
	self.transparency = transparency?true:false;
	self.isWall = isWall;
	self.tex = _img.tex || null;
	self.m_tex = _img.m_tex || null;
	self.Select = function( map, tile ) {
		if(tile.visible){ return (self.tex || _nullSpr); }
		if(tile.known){ return (self.m_tex || _nullSpr); }
		return _nullSpr;
	}
}

_TileTypes = {};

var _Selectors = {};
_Selectors.Exclusive = function( map, tile ) {
	// returns "news" values or "z"
	out = '';

	var n = map.GetCell(tile.x,tile.y-1);
	var e = map.GetCell(tile.x+1,tile.y);
	var w = map.GetCell(tile.x-1,tile.y);
	var s = map.GetCell(tile.x,tile.y+1);

	out += n && n.type==tile.type? 'n':'' ;
	out += e && e.type==tile.type? 'e':'' ;
	out += w && w.type==tile.type? 'w':'' ;
	out += s && s.type==tile.type? 's':'' ;


	if(out==''){ out='z'; }

	return out;
}
_Selectors.OnlyWalls = function( map, tile ) {
	// returns "news" values or "z"
	out = '';

	var n = map.GetCell(tile.x,tile.y-1); n = n?n.type.isWall:false;
	var e = map.GetCell(tile.x+1,tile.y); e = e?e.type.isWall:false;
	var w = map.GetCell(tile.x-1,tile.y); w = w?w.type.isWall:false;
	var s = map.GetCell(tile.x,tile.y+1); s = s?s.type.isWall:false;
	var ne = map.GetCell(tile.x+1,tile.y-1); ne = ne?ne.type.isWall:false;
	var nw = map.GetCell(tile.x-1,tile.y-1); nw = nw?nw.type.isWall:false;
	var se = map.GetCell(tile.x+1,tile.y+1); se = se?se.type.isWall:false;
	var sw = map.GetCell(tile.x-1,tile.y+1); sw = sw?sw.type.isWall:false;

	out += n && !(ne && nw && e && w) ? 'n':'' ;
	out += e && !(ne && se && n && s) ? 'e':'' ;
	out += w && !(nw && sw && n && s) ? 'w':'' ;
	out += s && !(se && sw && e && w) ? 's':'' ;

	if(out==''){ out='z'; }

	return out;
}
