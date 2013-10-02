// map-manager.js

function MapManager (options) {
	this.maps = [];
	this.currentMapName = '';
	this.kioskPosition = {};
	this.route = [];
	this.routeMaps = [];
	this.targetName = '';
	this.zoomFactor = 0.25;
	this.scale = 1.0;
	this.origin = { x: 0, y: 0 };
	this.objectSelected = null;

	/**
	 * Инициализирует объект
	 * @private
	 */
	this.init = function (options) {
		if (options != undefined) {
			if (options.kioskPosition != undefined) {
				this.kioskPosition = options.kioskPosition;
				this.currentMapName = this.kioskPosition.mapName;
			}
		}
	
		this.setupMaps();
		
		var mapName = this.currentMapName;
		var currentMap = this.firstOrDefault( function (m) { return m.Settings.mapName == mapName; } );
		currentMap.setStartPosition(this.kioskPosition);
		
		this.scale = 0.3;
		
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
	};
	
	this.selectMap = function (mapName) {
		var currentMap = this.firstOrDefault( function (m) { return m.Settings.mapName == this.currentMapName; } );
		var targetMap = this.firstOrDefault( function (m) { return m.Settings.mapName == mapName; } );
		
		if (currentMap != null && targetMap != null) {
			currentMap.hide();
			currentMap.centered = false;
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
		// центрируем карту
		if ( ! currentMap.centered ) {
			var size = currentMap.stage.getSize();
			currentMap.stage.move(size.width/2 - (currentMap.bounds.right/2 + currentMap.bounds.left/2), size.height/2 - (currentMap.bounds.bottom/2 + currentMap.bounds.top/2));
			currentMap.stage.draw();
			currentMap.centered = true;
		}
		// увеличиваем или уменьшаем карту
		if ( currentMap.scale != this.scale ) {
			this.scaleUp(this.scale);
		}
	};
	
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
			newscale = scale.x + this.zoomFactor;
		}
		
		if (currentMap.origin == undefined) currentMap.origin = { x: 0, y: 0 };
		currentMap.origin.x = this.kioskPosition.x / scale.x + currentMap.origin.x - this.kioskPosition.x / newscale;
		currentMap.origin.y = this.kioskPosition.y / scale.y + currentMap.origin.y - this.kioskPosition.y / newscale;
		
		currentMap.stage.setOffset(currentMap.origin.x, currentMap.origin.y);
		currentMap.stage.setScale({x: newscale, y: newscale });
		currentMap.stage.draw();
		
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
			newscale = scale.x - this.zoomFactor;
		}
		
		if (currentMap.origin == undefined) currentMap.origin = { x: 0, y: 0 };
		currentMap.origin.x = this.kioskPosition.x / scale.x + currentMap.origin.x - this.kioskPosition.x / newscale;
		currentMap.origin.y = this.kioskPosition.y / scale.y + currentMap.origin.y - this.kioskPosition.y / newscale;
		
		currentMap.stage.setOffset(currentMap.origin.x, currentMap.origin.y);
		currentMap.stage.setScale({x: newscale, y: newscale });
		currentMap.stage.draw();
		
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