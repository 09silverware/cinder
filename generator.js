var _DEBUG = _DEBUG || {};
_DEBUG.ca_start = false;
_DEBUG.ca_end = true;
_DEBUG.ca_itt = false;
_DEBUG.ca_itt_d = false;
_DEBUG.ff_room = false;
_DEBUG.ff_room_d = false;
_DEBUG.ff_end = true;

function CellulaAutomata( itterations, w, h, spawnChance, tooFew, tooMany, birthAt  ) {
	var t = Date.now();
	var fin = [];
	var SetF = function(x,y,v) { if(!fin[x]){fin[x]=[];} fin[x][y]=v; }
	var GetF = function(x,y) { if(!fin[x]){ return false; } if(!fin[x][y]){ return false; } return fin[x][y]; }
	var NearF = function(x,y) {
		var c = 0;
		c += GetF(x-1,y-1)?1:0; c += GetF(x  ,y-1)?1:0; c += GetF(x+1,y-1)?1:0;
		c += GetF(x-1,y  )?1:0; /*   Ignore Center   */ c += GetF(x+1,y  )?1:0;
		c += GetF(x-1,y+1)?1:0; c += GetF(x  ,y+1)?1:0; c += GetF(x+1,y+1)?1:0;
		return c;
	}

	var cur = [];
	var SetC = function(x,y,v) { if(!cur[x]){cur[x]=[];} cur[x][y]=v; }
	var GetC = function(x,y) { if(!cur[x]){ return false; } if(!cur[x][y]){ return false; } return cur[x][y]; }

	var itts = 0;
	var nn = 0;
	var Itt = function() {
		var k = 0; var b = 0;
		for(var i=0;i<w;i++) { for(var j=0;j<h;j++) {
			var c = NearF(i,j);
			var v = GetF(i,j);
			if(v && c <= tooFew) { SetC(i,j,false); k++; }
			else if(v && c >= tooMany) { SetC(i,j,false); k++; }
			else if(v)  { SetC(i,j,true); }
			if(!v && c >= birthAt) { SetC(i,j,true); b++; }
		} }
		fin = cur;
		cur = [];
		nn -= k; nn += b;
		_DEBUG.ca_itt && console.log('Automata Finished Itt ['+itts+']');
		_DEBUG.ca_itt_d && console.log('Automata Killed ['+k+'] and Birthed ['+b+'] Cells, ['+nn+'] Cells left');
		itts++;
		if( (k||b) /* End early, all done */  && itts<itterations) { Itt(); }
	}

	var Start = function() {
		var n = 0;
		for(var i=0;i<w;i++) { for(var j=0;j<h;j++) {
			if(Math.random() < spawnChance){ SetF(i,j,true); n++; }
		} }
		_DEBUG.ca_start && console.log('Automata Created ['+n+'] starting cells');
		nn += n;

		Itt();
	}

	Start();
	t = Date.now() - t;
	_DEBUG.ca_end && console.log('Automata Finished in ['+t+'] ms');
	return fin;
}


function FloodFill( mapGraph, w, h ) {
	var t = Date.now();
	var GetG = function(x,y) { if(!mapGraph[x]){ return false; } if(!mapGraph[x][y]){ return false; } return mapGraph[x][y]; }
	var SetG = function(x,y,v) { if(!mapGraph[x]){mapGraph[x]=[];} mapGraph[x][y]=v; }
	var rooms = [];
	var rn = 1;

	var Go = function() {
		for(var i=0;i<w;i++) { for(var j=0;j<h;j++) {
			var v = GetG(i,j);
			if( v === true ){
				_DEBUG.ff_room && console.log('Creating New Room');
				var R = new Room(rn++);
				rooms.push(R);
				Fill(i,j,R);
				R.SetCent();
				var count = 0;
				R.Itt(function(p,c){ count++; });
				_DEBUG.ff_room && console.log('Room ['+R.number+'] holds ['+count+'] Cells');
			}
		} }
	}

	var Fill = function(x,y,r) {
		if(GetG(x,y)===true) {
			_DEBUG.ff_room_d && console.log('Room ['+r.number+'] Cell ['+x+','+y+']');
			r.Set(x,y,true); SetG(x,y,r.number);
			for(var i=-1;i<=1;i++) { for(var j=-1;j<=1;j++) {
				Fill(x+i,y+j,r);
			} }
		}
	}

	Go();
	t = Date.now() - t;
	_DEBUG.ff_end && console.log('Flood Fill Finished in ['+t+'] ms');
	return rooms;
}

_Shape.prototype.Rooms = function( ox, oy, rooms, fillStyle, fillOverride, borderWidth, borderStyle, borderOverride ) {
	for(var i in rooms) {
		var room = rooms[i];
		this.Room( ox, oy, room, fillStyle, fillOverride, borderWidth, borderStyle, borderOverride );
	}
}

_Shape.prototype.Room = function( ox, oy, room, fillStyle, fillOverride, borderWidth, borderStyle, borderOverride ) {
	var self = this;
	room.Itt(function(p,c){
		var xx = 1*ox + 1*p.x; var yy = 1*oy + 1*p.y;
		self.SetPlace(xx,yy,fillStyle,fillOverride);
		for(var i=-borderWidth;i<=borderWidth;i++) { for(var j=-borderWidth;j<=borderWidth;j++) {
			var xxx = xx + 1*i; var yyy = yy + 1*j;
			var v = room.Get( xxx , yyy );
			//console.log(xxx,yyy,v)
			if(!v) { self.SetPlace( xxx, yyy ,borderStyle,borderOverride); }
		} }
	});
}

var Room = function(num) {
	var self = this;

	self.number = num;
	self.cells = [];
	self.cent = { x:0, y:0 };

	self.Get = function(x,y){  if(!self.cells[x]){ return false; } if(!self.cells[x][y]){ return false; } return self.cells[x][y];  }
	self.Set = function(x,y,v){ if(!self.cells[x]){ self.cells[x]=[]; } self.cells[x][y]=v; }
	self.Itt = function( callback, context ) {
		for(var x in this.cells) {
			for(var y in this.cells[x]) {
				callback.apply( context, [ {x:x,y:y} , this.cells[x][y] ] );
			}
		}
	}

	self.SetCent = function() {
		var l=0, x=0, y=0;
		self.Itt(function(p,c){
			l++;
			x+=p.x;
			y+=p.y;
		});
		self.cent.x = x/l;
		self.cent.y = y/l;
	}

}
