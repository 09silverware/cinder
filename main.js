var _DEBUG = _DEBUG || {};
_DEBUG.init = true;
$(document).ready(function(){ Init(); });

var _Player;

function Init(init) {
	init = init || 0;
	_DEBUG.init && console.log("Init Level "+init);

	if(init==0) {
		LoadConfig('config.json',function(dat){
			_configuration = dat;
			Init(1);
		});
	}

	else if(init==1) {
		LoadRenderer( null, _configuration.width, _configuration.height );
		LoadImages(function(){
			Init(2);
		});
	}

	else if(init==2) {
		DefineTiles();

		_CreatureTypes.testWizard = new _CreatureType( '!!Wizard!!', _sprites['wizard'], 20 );

		_Maps.test = new _Map("Test Map");
		var sh = new _Shape();
		var swall = sh.AddStyle(_TileTypes.stoneWall);
		var rwall = sh.AddStyle(_TileTypes.rockWall);
		var sfloor = sh.AddStyle(_TileTypes.stoneFloor);
		var dfloor = sh.AddStyle(_TileTypes.dirtFloor);
		var rfloor = sh.AddStyle(_TileTypes.rockFloor);
		var nx=12,ny=12;
		// var RN = r = Math.random;
		// var max = 10; var min = 2;
		// for(var xx=0; xx<12; xx++) {
		// 	for(var yy=0; yy<12; yy++) {
		// 		var w = Math.ceil(RN()*(max-min-2)) + min;
		// 		var h = Math.ceil(RN()*(max-min-2)) + min;
		// 		var x = xx*(max+4)-Math.floor(w/2);
		// 		var y = yy*(max+4)-Math.floor(h/2);
		// 		if(!nx&&!ny){ nx = x+Math.floor(w/2); ny = y+Math.floor(h/2); }
		// 		sh.Rectangle(x,y,w,h,sfloor,true,1,swall,false);
		// 		sh.Rectangle(x+Math.floor(w/2),y+Math.floor(h/2),1,(max+4),dfloor,true,1,rwall,false);
		// 		sh.Rectangle(x+Math.floor(w/2),y+Math.floor(h/2),(max+4),1,rfloor,true,1,rwall,false);
		// 	}
		// }

		var ca = CellulaAutomata( 6, 100, 100, 0.5, 2, 8, 4 );
		var ff = FloodFill( ca, 100, 100 );
		sh.Rooms( 0, 0, ff, dfloor, true, 1, rwall, false );

		_Maps.test.CarveShape(sh);
		_currMap = _Maps.test;

		_Player = new _Creature(_CreatureTypes.testWizard, _currMap, nx, ny );
		_currMap.CellFOV(_Player.x,_Player.y,_configuration.viewDis);

		Init(3);
	}

	else if(init==3) {
		keyCapture();
		Loop();
	}
}

_Maps = {};
_currMap = null;
move = 0;

function Loop() {
	dx=0;dy=0;
	if(move==0) {
		var n=0,e=0,w=0,s=0;
		if(_binds['move_n']) { n=1; }
		if(_binds['move_s']) { s=1; }
		if(_binds['move_w']) { w=1; }
		if(_binds['move_e']) { e=1; }
		if(_binds['move_ne']) { n=1; e=1; }
		if(_binds['move_nw']) { n=1; w=1; }
		if(_binds['move_se']) { s=1; e=1; }
		if(_binds['move_sw']) { s=1; w=1; }
		dx = e + -w;
		dy = s + -n;
	}
	else {
		move -= 1;
	}
	if(!move&&(dx!=0||dy!=0)) {
		_Player.Move(dx,dy,false);
		move = 5;
		_currMap.CellFOV(_Player.x,_Player.y,_configuration.viewDis);
		_Player.Update();
	}

	_currMap.view.x = _configuration.width/2-_Player.x*16 -8;
	_currMap.view.y = _configuration.height/2-_Player.y*16 -8;

	if(_currMap.dirty){ _currMap.Clean(); }
	_renderer.render(_currMap.view);
	requestAnimationFrame(Loop);
}

_keys = [];
_binds = {
	'move_n':false,
	'move_e':false,
	'move_s':false,
	'move_w':false,
	'move_nw':false,
	'move_ne':false,
	'move_se':false,
	'move_sw':false,
};
_bound = {
	37:'move_w', 65:'move_w', 100:'move_w',
	38:'move_n', 87:'move_n', 104:'move_n',
	39:'move_e', 68:'move_e', 102:'move_e',
	40:'move_s', 83:'move_s', 98:'move_s',
	103:'move_nw',
	105:'move_ne',
	99:'move_se',
	97:'move_sw',
};
function keyCapture() {
	$(document).keydown(function(e){
		_keys[e.which] = Date.now();
		_binds[_bound[e.which]] = Date.now();
	});
	$(document).keyup(function(e){
		_keys[e.which] = false;
		_binds[_bound[e.which]] = false;
	});
}

if(!Date.now) {
	Date.now = function now() {
		return new Date().getTime();
	}
}
