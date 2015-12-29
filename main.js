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
		_TileTypes.stoneWall = new _SmartTileType( 'Stone Wall', false, false, true, _Selectors.OnlyWalls, {
			n:_sprites['stoneWall_n'],
			e:_sprites['stoneWall_e'],
			s:_sprites['stoneWall_s'],
			w:_sprites['stoneWall_w'],
			ne:_sprites['stoneWall_ne'],
			nw:_sprites['stoneWall_nw'],
			ns:_sprites['stoneWall_ns'],
			ew:_sprites['stoneWall_ew'],
			es:_sprites['stoneWall_es'],
			ws:_sprites['stoneWall_ws'],
			new:_sprites['stoneWall_new'],
			nes:_sprites['stoneWall_nes'],
			nws:_sprites['stoneWall_nws'],
			ews:_sprites['stoneWall_ews'],
			news:_sprites['stoneWall_news'],
			z:_sprites['stoneWall_z'],

			m_n:_sprites['wall_n_know'],
			m_e:_sprites['wall_e_know'],
			m_s:_sprites['wall_s_know'],
			m_w:_sprites['wall_w_know'],
			m_ne:_sprites['wall_ne_know'],
			m_nw:_sprites['wall_nw_know'],
			m_ns:_sprites['wall_ns_know'],
			m_ew:_sprites['wall_ew_know'],
			m_es:_sprites['wall_es_know'],
			m_ws:_sprites['wall_ws_know'],
			m_new:_sprites['wall_new_know'],
			m_nes:_sprites['wall_nes_know'],
			m_nws:_sprites['wall_nws_know'],
			m_ews:_sprites['wall_ews_know'],
			m_news:_sprites['wall_news_know'],
			m_z:_sprites['wall_z_know']
		} );

		_TileTypes.stoneFloor = new _SmartTileType( 'Stone Floor', true, true, false, _Selectors.Exclusive, {
			n:_sprites['stoneFloor_n'],
			e:_sprites['stoneFloor_e'],
			s:_sprites['stoneFloor_s'],
			w:_sprites['stoneFloor_w'],
			ne:_sprites['stoneFloor_ne'],
			nw:_sprites['stoneFloor_nw'],
			ns:_sprites['stoneFloor_ns'],
			ew:_sprites['stoneFloor_ew'],
			es:_sprites['stoneFloor_es'],
			ws:_sprites['stoneFloor_ws'],
			new:_sprites['stoneFloor_new'],
			nes:_sprites['stoneFloor_nes'],
			nws:_sprites['stoneFloor_nws'],
			ews:_sprites['stoneFloor_ews'],
			news:_sprites['stoneFloor_news'],
			z:_sprites['stoneFloor_z'],

			m_n:_sprites['m_stoneFloor_n'],
			m_e:_sprites['m_stoneFloor_e'],
			m_s:_sprites['m_stoneFloor_s'],
			m_w:_sprites['m_stoneFloor_w'],
			m_ne:_sprites['m_stoneFloor_ne'],
			m_nw:_sprites['m_stoneFloor_nw'],
			m_ns:_sprites['m_stoneFloor_ns'],
			m_ew:_sprites['m_stoneFloor_ew'],
			m_es:_sprites['m_stoneFloor_es'],
			m_ws:_sprites['m_stoneFloor_ws'],
			m_new:_sprites['m_stoneFloor_new'],
			m_nes:_sprites['m_stoneFloor_nes'],
			m_nws:_sprites['m_stoneFloor_nws'],
			m_ews:_sprites['m_stoneFloor_ews'],
			m_news:_sprites['m_stoneFloor_news'],
			m_z:_sprites['m_stoneFloor_z'],
		} );
		_TileTypes.stoneFloorSingle = new _TileType('Stone Floor', true, true, false,{
			tex:_sprites['stoneFloor_news'],
			m_tex:_sprites['m_stoneFloor_news']
		});

		_nullSpr = _sprites['null'];

		_CreatureTypes.testWizard = new _CreatureType( '!!Wizard!!', _sprites['wizard'], 20 );

		_Maps.test = new _Map("Test Map");
		var sh = new _Shape();
		var wall = sh.AddStyle(_TileTypes.stoneWall);
		var floor = sh.AddStyle(_TileTypes.stoneFloor);
		var nx,ny;
		var RN = r = Math.random;
		var max = 10; var min = 2;
		for(var xx=0; xx<12; xx++) {
			for(var yy=0; yy<12; yy++) {
				var w = Math.ceil(RN()*(max-min-2)) + min;
				var h = Math.ceil(RN()*(max-min-2)) + min;
				var x = xx*(max+4)-Math.floor(w/2);
				var y = yy*(max+4)-Math.floor(h/2);
				if(!nx&&!ny){ nx = x+Math.floor(w/2); ny = y+Math.floor(h/2); }
				sh.Rectangle(x,y,w,h,floor,true,1,wall,false);
				sh.Rectangle(x+Math.floor(w/2),y+Math.floor(h/2),1,(max+4),floor,true,1,wall,false);
				sh.Rectangle(x+Math.floor(w/2),y+Math.floor(h/2),(max+4),1,floor,true,1,wall,false);
			}
		}

		_Maps.test.CarveShape(sh);
		_currMap = _Maps.test;

		_Player = new _Creature(_CreatureTypes.testWizard, _currMap, nx, ny );
		_currMap.CellFOV(_Player.x,_Player.y,_configuration.viewDis)

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
