// map-manager.js

function MapManager (options) {
	this.maps = [];
	this.currentMapName = '';
	this.kioskPosition = {};
	this.route = [];
	this.routeMaps = [];
	this.targetName = '';

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
		
		return this;
	};
	
	/**
	 * Инициализирует список карт
	 * @private
	 */
	this.setupMaps = function () {
		for (var i = 0; i < MapsData.length; i++) {
			var mapData = MapsData[i];
			this.maps.push(
				new Map({ 
						mapName: mapData.name, 
						backgroundImage: mapData.backgroundImage,
						visible: false
				})
			);
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
					x: this.route[i].position.x / currentMap.Settings.globalScale,
					y: this.route[i].position.y / currentMap.Settings.globalScale
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
				self.selectMap(self.routeMaps[self.routeMaps.indexOf(mapName) + 1]);
				self.showRoute(self.routeMaps[self.routeMaps.indexOf(mapName) + 1], targetName);
			};
		}
		
		currentMap.setStartPosition(startPosition);
		currentMap.show();
		currentMap.showRoute(this.route, mapName, targetShape, tooltips);
		if (targetShape != null) {
			currentMap.showSelectedShape(targetShape);
		}
	};
	
    /**
    * Увеличить масштаб
	* @public
    */
    this.scaleUp = function () {
        var currentMap = this.firstOrDefault( function (m) { return m.Settings.mapName == this.currentMapName; } );
		var oldScale = currentMap.Settings.globalScale;
		var oldX = currentMap.Settings.x;
		var oldY = currentMap.Settings.y;
		
		for (var i = 0; i < this.maps.length; i++) {
			this.maps[i].scaleUp();
		}
		var newScale = currentMap.Settings.globalScale;
		
		for (var i = 0; i < this.route.length; i++) {
			this.route[i].position.x = this.route[i].position.x / oldScale * newScale;
			this.route[i].position.y = this.route[i].position.y / oldScale * newScale;
		}
		
		this.showRoute(this.currentMapName, this.targetName);

		//var deltaX = Math.abs(500 * newScale - 500);
		//var deltaY = Math.abs(410 * newScale - 410);
		//currentMap.move(-deltaX, -deltaY);
    };

    /**
    * Уменьшить масштаб
	* @public
    */
    this.scaleDown = function () {
        var currentMap = this.firstOrDefault( function (m) { return m.Settings.mapName == this.currentMapName; } );
		var oldScale = currentMap.Settings.globalScale;
		var oldX = currentMap.Settings.x;
		var oldY = currentMap.Settings.y;
		
		for (var i = 0; i < this.maps.length; i++) {
			this.maps[i].scaleDown();
		}
		var newScale = currentMap.Settings.globalScale;
		
		for (var i = 0; i < this.route.length; i++) {
			this.route[i].position.x = this.route[i].position.x / oldScale * newScale;
			this.route[i].position.y = this.route[i].position.y / oldScale * newScale;
		}
		
		this.showRoute(this.currentMapName, this.targetName);
		
		//var deltaX = Math.abs(500 * oldScale - 500);
		//var deltaY = Math.abs(410 * oldScale - 410);
		//currentMap.move(deltaX, deltaY);

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