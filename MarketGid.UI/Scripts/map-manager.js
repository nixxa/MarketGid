// map-manager.js

function MapManager(options) {
	"use strict";
	
	this.maps = [];
	this.currentMapName = '';
	this.kioskPosition = {};
	this.route = [];
	this.routeMaps = [];
	this.routeParts = [];
	this.currentPartIndex = 0;
	this.targetName = '';
	this.zoomFactor = 0.75;
	this.scale = 1.0;
	this.origin = { x: 0, y: 0 };
	this.objectSelected = null;
	this.lastDist = 0;
	this.boundsSpacer = 400;
	this.maxScale = 1.5;

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
			if (options.boundsSpacer !== undefined) {
				this.boundsSpacer = options.boundsSpacer;
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
		
		this.currentPartIndex = 0;
		this.routeParts = [];
		
		if (targetMap === null) {
			currentMap.show();
			return;
		}
		
		var targetObject = targetMap.findObject(targetName);
		Graph.StartVertex = Graph.findVertex({ x: currentMap.Settings.x, y: currentMap.Settings.y }, currentMap.Settings.mapName);
		try {
			this.route = Graph.navigateTo(targetObject.path, targetMap.Settings.mapName);
		} catch (e) {
			currentMap.show();
			return;
		}
		
		var part = [];
		var prevMap = null;
		var currMap = null;
		// делим весь маршрут на части
		for (var i = 0; i < this.route.length; i++) {
			currMap = this.route[i].mapName;
			if (prevMap === null) {
				prevMap = currMap;
			}
			part.push(this.route[i]);
			if (prevMap !== currMap) {
				this.routeParts.push({ mapName: prevMap, route: part });
				part = [ this.route[i-1], this.route[i] ];
				prevMap = currMap;
			}
			if (this.routeMaps.indexOf(this.route[i].mapName) >= 0) {
				continue;
			}
			this.routeMaps.push(this.route[i].mapName);
		}
		this.routeParts.push({ mapName: currMap, route: part });
		
		// показываем первую часть маршрута
		this.showRoute(this.currentMapName, targetName, this.currentPartIndex);
		
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
	
	this.showRoute = function (mapName, targetName, routePartIndex) {
		var currentMap = this.firstOrDefault( function (m) { return m.Settings.mapName == mapName; } );
		var targetObject = currentMap.findObject(targetName);
		var targetShape = targetObject != null ? targetObject.path : null;
		
		// если часть маршрута не указана, то используем весь маршрут
		var route = null;
		if (routePartIndex === undefined || routePartIndex === null) {
			route = this.route;
			this.routeParts = { mapName: mapName, route: this.route };
			this.currentPartIndex = 0;
		} else {
			route = this.routeParts[routePartIndex].route;
		}
		
		// определяем начальную позицию
		var startPosition = null;
		for (var i = 0; i < route.length; i++) {
			if (startPosition == null && route[i].mapName == mapName) {
				startPosition = {
					x: route[i].position.x,
					y: route[i].position.y
				};
				break;
			}
		}
		
		var self = this;
		var tooltips = {};
		var junction = null;
		// если это не первая часть маршрута, то формируем в точке возврата тултип
		if (routePartIndex > 0) {
			junction = route[0].junction;
			if (junction !== null) {
				tooltips.start = junction.name + ' на ' + junction.title.toLowerCase() + '\nНажмите для возврата';
			} else {
				tooltips.start = 'Нажмите для возврата';
			}
			tooltips.startAction = function () {
				self.currentPartIndex -= 1;
				self.selectMap(self.routeParts[self.currentPartIndex].mapName);
				self.showRoute(self.routeParts[self.currentPartIndex].mapName, targetName, self.currentPartIndex);
			};
		}
		// если это не последняя часть маршрута, то формируем в точке перехода тултип
		if (routePartIndex < this.routeParts.length - 1) {
			junction = route[route.length - 1].junction;
			if (junction !== null) {
				tooltips.stop = junction.name + ' на ' + junction.title.toLowerCase() + '\nНажмите для продолжения';
			} else {
				tooltips.stop = 'Нажмите для продолжения';
			}
			tooltips.stopAction = function () {
				self.currentPartIndex += 1;
				self.selectMap(self.routeParts[self.currentPartIndex].mapName);
				self.showRoute(self.routeParts[self.currentPartIndex].mapName, targetName, self.currentPartIndex);
			};
		}
		
		// если это последняя часть маршрута, то тултип в конце отключаем
		if (routePartIndex === this.routeParts.length - 1) {
			currentMap.Settings.showEndTooltip = false;
		} else {
			currentMap.Settings.showEndTooltip = true;
		}
		
		currentMap.setStartPosition(startPosition);
		currentMap.show();
		currentMap.showRoute(route, mapName, targetShape, tooltips);
		currentMap.showSelectedShape(targetShape);
		
		var size = currentMap.stage.getSize();
		var bounds = this.calcRouteBounds(route, mapName);
		
		var boundsWidth = bounds.right - bounds.left + this.boundsSpacer;
		var boundsHeight = bounds.bottom - bounds.top + this.boundsSpacer;
		
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
		
		if (this.scale > this.maxScale) {
			this.scale = this.maxScale;
		}

		// увеличиваем или уменьшаем карту
		if ( currentMap.scale != this.scale ) {
			this.scaleUp(this.scale);
		}
		
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
		currentMap.origin.x = currentMap.Settings.x / scale.x + currentMap.origin.x - currentMap.Settings.x / newscale;
		currentMap.origin.y = currentMap.Settings.y / scale.y + currentMap.origin.y - currentMap.Settings.y / newscale;
		
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
		currentMap.origin.x = currentMap.Settings.x / scale.x + currentMap.origin.x - currentMap.Settings.x / newscale;
		currentMap.origin.y = currentMap.Settings.y / scale.y + currentMap.origin.y - currentMap.Settings.y / newscale;
		
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