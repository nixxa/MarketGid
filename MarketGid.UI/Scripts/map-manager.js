// map-manager.js

function MapManager(options) {
	"use strict";
	
	this.maps = [];
	this.currentMapName = '';
	this.kioskPosition = {};
	this.route = [];
	this.routeMaps = [];
	this.targetName = '';
	this.zoomFactor = 0.75;
	this.scale = 1.0;
	this.origin = { x: 0, y: 0 };
	this.objectSelected = null;
	this.lastDist = 0;

	/**
	 * Инициализирует объект
	 * @private
	 */
	this.init = function (options) {
		if (options !== undefined) {
			if (options.kioskPosition !== undefined) {
				this.kioskPosition = options.kioskPosition;
				this.currentMapName = this.kioskPosition.mapName;
			}
		}
	
		this.setupMaps();
		
		var mapName = this.currentMapName;
		var currentMap = this.firstOrDefault(function (m) { return m.Settings.mapName === mapName; });
		currentMap.setStartPosition(this.kioskPosition);
		
		this.scale = 0.3;
		
		Graph.init(currentMap.Settings);
		
		return this;
	};
	
	/**
	 * Инициализирует список карт
	 * @private
	 */
	this.setupMaps = function () {
		var self = this;
		for (var i = 0; i < MapsData.length; i++) {
			var mapData = MapsData[i];
			var map = new Map({ 
				mapName: mapData.name, 
				backgroundImage: mapData.backgroundImage,
				centered: false,
				scale: 1.0
			});
			map.objectSelected = function (obj) {
				// вызываем обработчик события 'objectSelected'
				if (self.objectSelected != null) {
					self.objectSelected.apply(self, [obj]);
				}
			}
			this.maps.push(map);
		}
	};
	
	/**
	 * Ищет первую подходящую по условию карту
	 * @private
	 */
	this.firstOrDefault = function (lambda) {
		for (var i = 0; i < this.maps.length; i++) {
			if (lambda.apply(this, [ this.maps[i] ])) {
				return this.maps[i];
			}
		}
		return null;
	};
	
	/**
	 * Отображает маршрут до искомого объекта
	 * @public
	 */
	this.navigateTo = function (targetName) {
		this.targetName = targetName;
		var currentMap = this.firstOrDefault( function (m) { return m.Settings.mapName == this.currentMapName; } );
		var targetMap = this.firstOrDefault( function (m) { return m.contains(targetName); } );
		
		var targetObject = targetMap.findObject(targetName);
		Graph.StartVertex = Graph.findVertex({ x: currentMap.Settings.x, y: currentMap.Settings.y }, currentMap.Settings.mapName);
		this.route = Graph.navigateTo(targetObject.path, targetMap.Settings.mapName);
		
		for (var i = 0; i < this.route.length; i++) {
			if (this.routeMaps.indexOf(this.route[i].mapName) >= 0) continue;
			this.routeMaps.push(this.route[i].mapName);
		}

		this.showRoute(this.currentMapName, targetName);
		
		// enable multitouch scaling
		var self = this;
		currentMap.stage.getContent().addEventListener('touchmove', function (evt) {
			if (evt.touches.length < 2) return;
			var touch1 = evt.touches[0];
			var touch2 = evt.touches[1];
			
			if (touch1 && touch2) {
				var dist = Graph.getDistance({ x: touch1.clientX, y: touch1.clientY }, { x: touch2.clientX, y: touch2.clientY });
				if (!self.lastDist) {
					self.lastDist = dist;
				}
				var scale = self.scale * dist / self.lastDist;
				self.scaleUp(scale);
				self.lastDist = dist;
			}
		}, false);
		
		currentMap.stage.getContent().addEventListener('touchend', function (evt) {
			self.lastDist = 0;
		}, false);
	};
	
	this.selectMap = function (mapName) {
		var currentMap = this.firstOrDefault( function (m) { return m.Settings.mapName == this.currentMapName; } );
		var targetMap = this.firstOrDefault( function (m) { return m.Settings.mapName == mapName; } );
		
		if (currentMap != null && targetMap != null) {
			currentMap.hide();
			currentMap.position = null;
			currentMap.scale = 1.0;
			currentMap.origin = { x: 0, y: 0 };
			targetMap.show();
			this.currentMapName = mapName;
		}
	};
	
	this.showRoute = function (mapName, targetName) {
		var currentMap = this.firstOrDefault( function (m) { return m.Settings.mapName == mapName; } );
		var targetObject = currentMap.findObject(targetName);
		var targetShape = targetObject != null ? targetObject.path : null;
		
		var startPosition = null;
		for (var i = 0; i < this.route.length; i++) {
			if (startPosition == null && this.route[i].mapName == mapName) {
				startPosition = {
					x: this.route[i].position.x,
					y: this.route[i].position.y
				};
				break;
			}
		}
		
		var self = this;
		var tooltips = {};
		var mapIndex = this.routeMaps.indexOf(mapName);
		if (mapIndex > 0) {
			tooltips.start = 'Эскалатор на этаж №1\nНажмите для возврата';
			tooltips.startAction = function () {
				self.selectMap(self.routeMaps[self.routeMaps.indexOf(mapName) - 1]);
				self.showRoute(self.routeMaps[self.routeMaps.indexOf(mapName) - 1], targetName);
			};
		}
		if (mapIndex < this.routeMaps.length - 1) {
			tooltips.stop = 'Эскалатор на этаж №2\nНажмите для продолжения', 
			tooltips.stopAction = function () {
				var selectedMapName = self.routeMaps[self.routeMaps.indexOf(mapName) + 1];
				self.selectMap(selectedMapName);
				self.showRoute(selectedMapName, targetName);
			};
		}
		
		currentMap.setStartPosition(startPosition);
		currentMap.show();
		currentMap.showRoute(this.route, mapName, targetShape, tooltips);
		currentMap.showSelectedShape(targetShape);
		
		var size = currentMap.stage.getSize();
		var bounds = this.calcRouteBounds(this.route, mapName);
		var maxWidth = Math.max(bounds.right - bounds.left, size.width);
		var minWidth = Math.min(bounds.right - bounds.left, size.width);
		var maxHeight = Math.max(bounds.bottom - bounds.top, size.height);
		var minHeight = Math.min(bounds.bottom - bounds.top, size.height);
		
		var boundsWidth = bounds.right - bounds.left + 400;
		var boundsHeight = bounds.bottom - bounds.top + 400;
		
		if (boundsWidth < size.width && boundsHeight < size.height) {
			// квадрат маршрута меньше видимой области - нужно увеличить карту
			this.scale = Math.min(size.width / boundsWidth, size.height / boundsHeight);
		}
		if (boundsWidth < size.width && boundsHeight > size.height) {
			// квадрат маршрута больше видимой области по высоте - уменьшаем карту
			this.scale = size.height / boundsHeight;
		}
		if (boundsWidth > size.width && boundsHeight < size.height) {
			// квадрат маршрута больше видимой области по ширине - уменьшаем карту
			this.scale = size.width / boundsWidth;
		}
		if (boundsWidth > size.width && boundsHeight > size.height) {
			// квадрат маршрута больше видимой области - уменьшаем карту
			this.scale = Math.min(size.width / boundsWidth, size.height / boundsHeight);
		}
		//this.scale = this.scale * 0.75;
		
		// центрируем карту
		var position = { 
			x: size.width/2 - (bounds.left + bounds.right)/2, 
			y: size.height/2 - (bounds.top + bounds.bottom)/2
		};
		if ( currentMap.position != position ) {
			if (currentMap.position != undefined && currentMap.position != null) {
				currentMap.stage.move(-currentMap.position.x, -currentMap.position.y);
			}
			currentMap.stage.move(position.x, position.y);
			currentMap.stage.batchDraw();
			currentMap.position = position;
		}
		// увеличиваем или уменьшаем карту
		if ( currentMap.scale != this.scale ) {
			this.scaleUp(this.scale);
		}
	};
	
	/**
	* Возвращает квадрат вокруг маршрута
	* @private
	*/
	this.calcRouteBounds = function (route, mapName) {
		var minLeft = 100000, maxRight = 1, minTop = 100000, maxBottom = 1;
		for (var i = 0; i < route.length; i++) {
			if (route[i] == undefined || route[i].position == null || route[i].mapName != mapName) {
				continue;
			}
			minLeft = Math.min(minLeft, route[i].position.x);
			maxRight = Math.max(maxRight, route[i].position.x);
			minTop = Math.min(minTop, route[i].position.y);
			maxBottom = Math.max(maxBottom, route[i].position.y);
		}
		
		return { left: minLeft, top: minTop, right: maxRight, bottom: maxBottom };
	}
	
    /**
    * Увеличить масштаб
	* @public
    */
    this.scaleUp = function (newscale) {
        var currentMap = this.firstOrDefault( function (m) { return m.Settings.mapName == this.currentMapName; } );
		
		if (currentMap == null) return;
		if (currentMap.stage == null) return;
		
		var scale = currentMap.stage.getScale();
		if (newscale == undefined) {
			newscale = scale.x * (1 + (1 - this.zoomFactor));
		}
		
		if (currentMap.origin == undefined) currentMap.origin = { x: 0, y: 0 };
		currentMap.origin.x = this.kioskPosition.x / scale.x + currentMap.origin.x - this.kioskPosition.x / newscale;
		currentMap.origin.y = this.kioskPosition.y / scale.y + currentMap.origin.y - this.kioskPosition.y / newscale;
		
		currentMap.stage.setOffset(currentMap.origin.x, currentMap.origin.y);
		currentMap.stage.setScale({x: newscale, y: newscale });
		currentMap.stage.batchDraw();
		
		currentMap.scale = newscale;
		this.scale = newscale;
    };

    /**
    * Уменьшить масштаб
	* @public
    */
    this.scaleDown = function (newscale) {
        var currentMap = this.firstOrDefault( function (m) { return m.Settings.mapName == this.currentMapName; } );

		if (currentMap == null) return;
		if (currentMap.stage == null) return;
		
		var scale = currentMap.stage.getScale();
		if (newscale == undefined) {
			newscale = scale.x * this.zoomFactor;
		}
		
		if (currentMap.origin == undefined) currentMap.origin = { x: 0, y: 0 };
		currentMap.origin.x = this.kioskPosition.x / scale.x + currentMap.origin.x - this.kioskPosition.x / newscale;
		currentMap.origin.y = this.kioskPosition.y / scale.y + currentMap.origin.y - this.kioskPosition.y / newscale;
		
		currentMap.stage.setOffset(currentMap.origin.x, currentMap.origin.y);
		currentMap.stage.setScale({x: newscale, y: newscale });
		currentMap.stage.batchDraw();
		
		currentMap.scale = newscale;
		this.scale = newscale;
    };

    /**
    * Сдвинуть карту вверх
	* @public
    */
    this.moveUp = function () {
        var currentMap = this.firstOrDefault( function (m) { return m.Settings.mapName == this.currentMapName; } );
		currentMap.moveUp();
    };

    /**
    * Сдвинуть карту вниз
	* @public
    */
    this.moveDown = function () {
        var currentMap = this.firstOrDefault( function (m) { return m.Settings.mapName == this.currentMapName; } );
		currentMap.moveDown();
    };

    /**
    * Сдвинуть карту влево
	* @public
    */
    this.moveLeft = function () {
        var currentMap = this.firstOrDefault( function (m) { return m.Settings.mapName == this.currentMapName; } );
		currentMap.moveLeft();
    };

    /**
    * Сдвинуть карту вправо
	* @public
    */
    this.moveRight = function () {
        var currentMap = this.firstOrDefault( function (m) { return m.Settings.mapName == this.currentMapName; } );
		currentMap.moveRight();
    };
	
	return this.init(options);
}