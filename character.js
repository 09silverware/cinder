var _DEBUG = _DEBUG || {};
_DEBUG.creature = true;

_CreatureTypes = {};

var _Creature = function( type, map, x, y ) {
	var self = this;

	self.type = type || false;
	if(!self.type){
		_DEBUG.creature && console.log('Creature type ['+type.name+'] does not exist');
		return false;
	}
	self.map = map || false;
	if(!self.map){
		_DEBUG.creature && console.log('Map ['+map+'] does not exist for Creature to be spawned into');
		return false;
	}
	self.map.creatures.push(self);
	self.x = x;
	self.y = y;

	Object.defineProperty(self,'visible',{
		get: function(){ return this.map.IsCellVisible(this.x,this.y); }
		// TODO: Fix undefined error
	});

	self.sprite = new PIXI.Sprite(self.type.texture);
	self.sprite.renderable = self.visible;

	self.map.AddToLayer(self.sprite,'creatures');
	self.sprite.x = self.x * self.sprite.width;
	self.sprite.y = self.y * self.sprite.height;

	self.Move = function(dx,dy,teleport) {
		var go = self.map.IsCellWalkable(self.x+dx,self.y+dy);
		if(!go&&teleport) {
			console.log("SQUELCH!");
			self.Damage(PDis({x:0,y:0},{x:dx,y:dy}));
		}
		else if(!go) {
			var gox = self.map.IsCellWalkable(self.x+dx,self.y);
			var goy = self.map.IsCellWalkable(self.x,self.y+dy);
			if(gox&&goy){ var r = Math.random(); if(r>=0.5){goy=false;} if(r<0.5){gox=false;} }
			if(gox){ this.Move(dx,0,teleport); }
			else if(goy){ this.Move(0,dy,teleport); }
		}
		else if(go) {
			self.x += dx;
			self.y += dy;
		}
	}
	self.MoveMap = function( map, x, y ) {
		// TODO
	}

	self.Update = function() {
		self.sprite.renderable = self.visible;

		self.sprite.x = self.x * self.sprite.width;
		self.sprite.y = self.y * self.sprite.height;
	}
}

var _CreatureType = function( name, texture, health ) {
	var self = this;
	self.name = name;
	self.texture = texture;
	self.health = health;
}

function PDis(a,b) { return Math.sqrt( Math.pow(a.x-b.x,2) + Math.pow(a.y-b.y,2) ); }
