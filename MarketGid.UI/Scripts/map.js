/// <reference path="_references.js" />
/// <reference path="graph.js" />
/// <reference path="kineticjs-4.6.0.js" />

// width: 1000, height: 820

function Map(options) {

    /**
    * Settings object
    */
    this.Settings = {
        // масштаб
        //globalScale: 1.2,
        // координаты киоска
        x: 0,
        y: 0,
		width: 1000,
		height: 820,
		mapName: '',
        // фоновое изображение
        backgroundImage: '',
        kioskPointRadius: 5,
        kioskPointColor: 'black',
        kioskPointBgColor: 'white',
        // цвет активного объекта
        activeObjectBgColor: '#F87E0F',
        // прозрачность активного объекта
        activeObjectOpacity: 1,
        // цвет неактивного объекта
        inactiveObjectBgColor: '#dedede',
        // прозрачность неактивного объекта
        inactiveObjectOpacity: 0.5,
        // цвет маршрута
        pathColor: '#5735FF',
        // прозрачность проложенного маршрута
        pathOpacity: 0.75,
        // цвет проложенного маршрута
        pathWidth: 8,
        // цвет всех границ объектов
        borderColor: 'black',
        // цвет всех теней
        shadowColor: 'black',
		// показывать или нет текст на конце маршрута
		showEndTooltip: false
    };

    this.Objects = {};
    this.stage = null;
    this.mapLayer = null;
    this.navLayer = null;
    this.backgroundLayer = null;
    this.tooltip = null;
    this.selectedObject = null;
    this.route = null;
    this.startObject = null;
    this.navObjectName = null;
	this.bounds = { left: 0, top: 0, right: 0, bottom: 0};
	//this.originalOptions = null;
	this.pageLifetime = null;

    /**
    * Init map and draw objects
	* @private
    */
    this.init = function (options) {
		var visible = false;
        if (options != undefined) {
            if (options.x != undefined) {
                this.Settings.x = options.x * this.Settings.globalScale;
            }
            if (options.y != undefined) {
                this.Settings.y = options.y * this.Settings.globalScale;
            }
			if (options.mapName != undefined) {
				this.Settings.mapName = options.mapName;
			}
			if (options.backgroundImage != undefined) {
				this.Settings.backgroundImage = options.backgroundImage;
			}
			if (options.visible != undefined) {
				visible = options.visible;
			}

			//this.originalOptions = options;
        }

        Graph.init(options);

        this.setupObjects();

		if (visible) {
			this.show();
		}

		this.pageLifetime = window.pageLifetime;
        //Map.stage._mousemove = function () {};
		return this;
    };

    /**
    * Очищает карту
	* @public
    */
    this.clear = function () {
        this.Objects = {};
        this.backgroundLayer.remove();
        this.mapLayer.remove();
        this.navLayer.remove();
    };
	
	/**
	 * Устанавливает стартовую точки для навигации
	 * @public
	 */
	this.setStartPosition = function (point) {
		this.Settings.x = point.x;// * this.Settings.globalScale;
		this.Settings.y = point.y;// * this.Settings.globalScale;
		
		this.startObject = this.setupStartObject();
	};

    /**
    * Load objects data and create Kinetic.Path objects
	* @private
    */
    this.setupObjects = function () {
        for (id in PathData) {
			// собираем только объекты на данной карте, остальные игнорируем
			if (PathData[id].map != this.Settings.mapName) {
				continue;
			}
			
			// если объект - фигура, добавляем
			if (PathData[id].path != undefined && PathData[id].path != null) {
				var pathObject = new Kinetic.Path({
					data: PathData[id].path,
					opacity: PathData[id].opacity,
					id: id
				});
				if (PathData[id].bgColor != 'none') {
					pathObject.setFill(PathData[id].bgColor);
				}
				if (PathData[id].borderColor != 'none') {
					pathObject.setStroke(PathData[id].borderColor);
					pathObject.setStrokeWidth(PathData[id].borderWidth);
					pathObject.setLineJoin(PathData[id].borderJoin);
				}
				pathObject.objectId = PathData[id].objectId;
				this.Objects[id] = {
					path: pathObject,
					name: PathData[id].name,
					bgColor: PathData[id].bgColor,
					borderColor: PathData[id].borderColor,
					opacity: PathData[id].opacity,
					objectId: PathData[id].objectId
				};
			}
			// если объект - текст, добавляем
			if (PathData[id].text != undefined && PathData[id].text != null) {
				var textObject = new Kinetic.Text({
					x: PathData[id].x,
					y: PathData[id].y,
					fontSize: PathData[id].fontSize,
					fontFamily: PathData[id].fontFamily,
					fontWeight: PathData[id].fontWeight,
					fill: PathData[id].color,
					opacity: PathData[id].opacity,
					text: PathData[id].text,
					id: id
				});
				textObject.objectId = PathData[id].objectId;
				if (PathData[id].angle != undefined && PathData[id].angle != 0.0) {
					textObject.rotateDeg(PathData[id].angle);
				}
				if (PathData[id].scaleX > 0) {
					textObject.setScaleX(PathData[id].scaleX);
				}
				if (PathData[id].scaleY > 0) {
					textObject.setScaleY(PathData[id].scaleY);
				}
				this.Objects[id] = {
					text: textObject,
					objectId: PathData[id].objectId,
					id: id
				};
			}
        }

		this.startObject = this.setupStartObject();
		
		var minLeft = 100000, maxRight = 1, minTop = 100000, maxBottom = 1;
		for (var key in this.Objects) {
			var left = 100000, right = 1, top = 100000, bottom = 1;
			if (this.Objects[key].path == undefined || this.Objects[key].path == null) {
				continue;
			}
			for (var k = 0; k < this.Objects[key].path.dataArray.length; k++) {
				if (this.Objects[key].path.dataArray.length == 0) continue;
				if (this.Objects[key].path.dataArray[k].points.length == 0) continue;
				left = Math.min(left, this.Objects[key].path.dataArray[k].points[0]);
				right = Math.max(right, this.Objects[key].path.dataArray[k].points[0]);
				top = Math.min(left, this.Objects[key].path.dataArray[k].points[1]);
				bottom = Math.max(right, this.Objects[key].path.dataArray[k].points[1]);
			}
			minLeft = Math.min(minLeft, left);
			maxRight = Math.max(maxRight, right);
			minTop = Math.min(minTop, top);
			maxBottom = Math.max(maxBottom, bottom);
		}
		
		this.bounds = { left: minLeft, top: minTop, right: maxRight, bottom: maxBottom };
    };
	
	this.setupStartObject = function () {
        return new Kinetic.Circle({
            fill: this.Settings.kioskPointBgColor,
            stroke: this.Settings.kioskPointColor,
            strokeWidth: 1,
            x: this.Settings.x,
            y: this.Settings.y,
            radius: this.Settings.kioskPointRadius,
            shadowOffset: 3,
            shadowColor: this.Settings.shadowColor,
            shadowBlur: 6,
            shadowOpacity: 0.5
        });
	};

	/**
	 * Создает тултип
	 * @private
	 */
    this.setupTooltip = function (options) {
        if (options == undefined) {
            options = { x: this.Settings.x, y: this.Settings.y, pointerDirection: 'down' };
        }
        if (options.pointerDirection == undefined) {
            options.pointerDirection = 'down';
        }
        if (options.bgColor == undefined) {
            options.bgColor = 'black';
        }

        var tooltip = new Kinetic.Label({
            x: options.x,
            y: options.y,
            opacity: 0.75
        });

        tooltip.add(new Kinetic.Tag({
            fill: options.bgColor,
            pointerDirection: options.pointerDirection,
            pointerWidth: 10,
            pointerHeight: 10,
            lineJoin: 'round',
            shadowColor: 'black',
            shadowBlur: 5,
            shadowOffset: 5,
            shadowOpacity: 0.5
        }));

        tooltip.add(new Kinetic.Text({
            text: options.text,
            fontFamily: 'Calibri',
            fontSize: 18,
            padding: 5,
            fill: 'white'
        }));
        return tooltip;
    };

    /**
    * Draw background image
	* @private
    */
    this.drawBackground = function () {
        var imgObj = new Image();
		var self = this;
        imgObj.onload = function () {
            var img = new Kinetic.Image({
                image: imgObj
            });
            self.backgroundLayer.add(img);
            self.backgroundLayer.draw();
        };
        imgObj.src = this.Settings.backgroundImage;
    };

    /**
     * Отображает все объекты на карте
	 * @private
     */
    this.drawObjects = function () {
        for (t in this.Objects) {
            var path = this.Objects[t].path;
			if (path != undefined) {
				if (this.Objects[t].objectId > 0) {
					var self = this;
					path.on('mousedown touchstart', function (evt) {
						self.showPath(evt);
					});
				}
				this.mapLayer.add(path);
			}
			var text = this.Objects[t].text;
			if (text != undefined) {
				if (this.Objects[t].objectId > 0) {
					var self = this;
					text.on('mousedown touchstart', function (evt) {
						var mapObj = self.findByObjectId(evt.targetNode.objectId);
						if (mapObj != null) {
							self.showPath({ targetNode: mapObj.path });
						}
					});
				}
				this.mapLayer.add(text);
			}
        }
    };

	/**
	 * Проверяет, есть ли объект на карте
	 * @public
	 * @param objectName - имя объекта
	 */
	this.contains = function (objectName) {
        var mapObject = this.findObject(objectName);
		return mapObject != null;
	};
	
	/**
	 * Ищет объект по имени
	 * @public
	 * @param objectName - имя объекта
	 */
	this.findObject = function (objectName) {
		var mapObject = null;

        for (var key in this.Objects) {
            if (this.Objects[key].name == objectName) {
                mapObject = this.Objects[key];
                break;
            }
        }
		
		return mapObject;
	};
	
	/**
	* Ищет объект по его фигуре (text или shape)
	* @private
	*/
	this.findByPath = function (objectPath) {
		var mapObject = null;
		
		for (var key in this.Objects) {
            if (this.Objects[key].path != null && this.Objects[key].path == objectPath) {
                mapObject = this.Objects[key];
                break;
            }
			if (this.Objects[key].text != null && this.Objects[key].text == objectPath) {
                mapObject = this.Objects[key];
                break;
            }
        }
		
		return mapObject;
	};
	
	/**
	* Ищет объект по идентификатору
	* @private
	*/
	this.findByObjectId = function (objectId) {
		var mapObject = null;
		
		for (var key in this.Objects) {
            if (this.Objects[key].path != null && this.Objects[key].objectId == objectId) {
                mapObject = this.Objects[key];
                break;
            }
        }
		
		return mapObject;	
	};
	
    /**
     * Отображает путь к именованному объекту
	 * @public
	 * @param objectName - имя объекта
     */
    this.navigateTo = function (objectName) {
        var mapObject = this.findObject(objectName);

        if (mapObject != null) {
            this.showPath({ targetNode: mapObject.path }, this.Settings.mapName);
        }

        this.navObjectName = objectName;
		if (this.pageLifetime != null) {
			this.pageLifetime.update();
		}
    };

    /**
     * отображает объекты на карте
	 * @public
     */
    this.show = function () {
        // init kinetic stage
		if (this.stage == null) {
			this.stage = new Kinetic.Stage({
				container: 'map',
				width: this.Settings.width,
				height: this.Settings.height,
				draggable: true
			});
		} else {
			this.stage.show();
		}

		if (this.backgroundLayer == null) {
			this.backgroundLayer = new Kinetic.Layer();
		} else {
			this.clearLayer(this.backgroundLayer);
		}

		if (this.mapLayer == null) {
			this.mapLayer = new Kinetic.Layer();
		} else {
			this.clearLayer(this.mapLayer);
		}

		if (this.navLayer == null) {
			this.navLayer = new Kinetic.Layer();
		} else {
			this.clearLayer(this.navLayer);
		}

        this.drawBackground();
        this.drawObjects();

        this.stage.add(this.backgroundLayer);
        this.stage.add(this.mapLayer);
        this.stage.add(this.navLayer);
    };
	
	/**
	 * Скрывает объекты карты
	 * @public
	 */
	this.hide = function () {
		this.stage.remove();
		this.stage = null;
		//this.stage.hide();
	};

	this.clearLayer = function (layer) {
		layer.clear();
		while (layer.getChildren().length > 0) {
			layer.children[0].remove();
		}
	};
	
	/**
	 * Отображает путь на карте
	 * @private
	 * @param evt - объект, содержащий св-во targetNode
	 * @param mapName - имя карты
	 */
    this.showPath = function (evt, mapName) {
        var path = evt.targetNode;
		this.showSelectedShape(path);

        // clear navLayer
        this.navLayer.remove();
		this.clearLayer(this.navLayer);
		
        // get path points
		if (mapName == undefined) {
			mapName = this.Settings.mapName;
		}
		Graph.StartVertex = Graph.findVertex({ x: this.Settings.x, y: this.Settings.y }, mapName);
        var vertexes = Graph.navigateTo(path, mapName);
		
		this.showRoute(vertexes, mapName, path);
		
		var mapObject = this.findByObjectId(path.objectId);
		if (mapObject != null && this.objectSelected != undefined && this.objectSelected != null) {
			this.objectSelected.apply(this, [mapObject]);
		}
		
		if (this.pageLifetime != null) {
			this.pageLifetime.update();
		}
    };

	this.showSelectedShape = function (selectedShape) {
		var oldSelected = this.selectedObject;
		var newSelected = selectedShape;
	
		// скрываем старый объект
		if (oldSelected != null) {
			var mapObj = this.findByObjectId(oldSelected.objectId);
			//oldSelected.setFill(this.Settings.inactiveObjectBgColor);
			oldSelected.setFill(mapObj.bgColor);
			//oldSelected.setStrokeWidth(1);
			//oldSelected.setStroke('transparent');
			oldSelected.setStroke(mapObj.borderColor);
			//oldSelected.setOpacity(this.Settings.inactiveObjectOpacity);
			oldSelected.setOpacity(mapObj.opacity);
			oldSelected.setShadowOffset(0);
			oldSelected.setShadowOpacity(0);
			oldSelected.setShadowBlur(0);
			oldSelected.getLayer().batchDraw();
		}
	
		// показываем новый объект
		if (newSelected != null) {
			newSelected.setFill(this.Settings.activeObjectBgColor);
			newSelected.setStroke(this.Settings.activeObjectBgColor);
			//newSelected.setStroke(this.Settings.borderColor);
			//newSelected.setStrokeWidth(1);
			newSelected.setOpacity(this.Settings.activeObjectOpacity);
			newSelected.setShadowColor(this.Settings.shadowColor);
			newSelected.setShadowBlur(5);
			newSelected.setShadowOffset(5);
			newSelected.setShadowOpacity(0.5);
			newSelected.getLayer().batchDraw();
		}
		
		this.selectedObject = newSelected;
	};
	
	/**
	 * Отображает маршрут с тултипами начальной и конечной точек
	 * @public
	 */
	this.showRoute = function (vertexes, mapName, targetShape, tooltips) {
        // show route
        var points = [];
        for (var i = 0; i < vertexes.length; i++) {
			if (vertexes[i].mapName != mapName) {
				continue;
			}
            points = points.concat([vertexes[i].position.x, vertexes[i].position.y]);
        }
        points = Graph.distinct(points);

        var x = points[points.length - 2];
        var y = points[points.length - 1];

        // create path line and finish circle
        this.navLayer.add(new Kinetic.Line({
            points: points,
            stroke: this.Settings.pathColor,
            strokeWidth: this.Settings.pathWidth,
            lineJoin: 'round',
            lineCap: 'round',
            opacity: this.Settings.pathOpacity,
            shadowOffset: 3,
            shadowColor: this.Settings.shadowColor,
            shadowBlur: 6,
            shadowOpacity: 0.5
        }));
        this.navLayer.add(new Kinetic.Circle({
            x: x,
            y: y,
            radius: this.Settings.kioskPointRadius,
            fill: this.Settings.kioskPointBgColor,
            stroke: this.Settings.kioskPointColor,
            strokeWidth: 1,
            shadowOffset: 3,
            shadowColor: this.Settings.borderColor,
            shadowBlur: 6,
            shadowOpacity: 0.5
        }));

        // setup start point tooltip
        this.navLayer.add(this.startObject);
		
		var text = 'Вы здесь';
		if (tooltips != undefined) {
			if (tooltips.start != undefined) {
				text = tooltips.start;
			}
		}

		var tooltip = null;
        var rect = { x1: x - 250 / 2, y1: y + 10, x2: x + 250 / 2, y2: y + 60, d: 'down' };
        if (this.checkCollide(points, rect)) {
			tooltip =
				this.setupTooltip({
					x: this.Settings.x, 
					y: this.Settings.y, 
					text: text, 
					pointerDirection: 'up', 
					bgColor: 'black'
				});
        } else {
            tooltip =
				this.setupTooltip({ 
					x: this.Settings.x, 
					y: this.Settings.y, 
					text: text, 
					pointerDirection: 'down', 
					bgColor: 'black' 
				});
        }
		if (tooltips != undefined && tooltips.startAction != undefined) {
			tooltip.on('mousedown touchstart', function (evt) {
				tooltips.startAction(evt);
			});
		}
		this.navLayer.add(tooltip);
		
        // setup endpoint tooltip
        var mapObject = null;
        text = 'Искомый объект';
		if (tooltips != undefined) {
			if (tooltips.stop != undefined) {
				text = tooltips.stop;
			}
		}
		
		// подготавливаем тултип для конца маршрута
		if (mapObject != null) text = mapObject.name;
        rect = { x1: x - 250 / 2, y1: y + 10, x2: x + 250 / 2, y2: y + 60, d: 'down' };
		
        if (this.checkCollide(points, rect)) {
            tooltip = this.setupTooltip({ x: x, y: y, text: text, pointerDirection: 'down', bgColor: 'black' });
        } else {
            tooltip = this.setupTooltip({ x: x, y: y, text: text, pointerDirection: 'up', bgColor: 'black' });
        }
		if (tooltips != undefined && tooltips.stopAction != undefined) {
			tooltip.on('mousedown touchstart', function (evt) {
				tooltips.stopAction(evt);
			});
		}

		// select target shape
		if (targetShape != undefined)
		{
			if (targetShape != null) {
				for (var key in this.Objects) {
					if (this.Objects[key].path == targetShape) {
						mapObject = this.Objects[key];
						break;
					}
				}
				if (this.Settings.showEndTooltip) {
					this.navLayer.add(tooltip);
				}
			} else {
				// targetShape is on another map. Clear current selectedObject
				if (this.selectedObject != null) {
					this.showSelectedShape(null);
				}
				this.navLayer.add(tooltip);
			}
		}
		
        // show navLayer
        this.stage.add(this.navLayer);
		
		if (this.pageLifetime != null) {
			this.pageLifetime.update();
		}
	};
	
	/**
	 * Проверяет наличие коллизий м/у объектом и точкой (находится ли точка внутри объекта)
	 * @private
	 */
    this.checkCollide = function (points, object) {
        var collide = false;
        for (var i = 0; i < points.length; ) {
			var leftBottom = { x: points[i] - 5, y: points[i+1] - 5 };
			var leftTop = { x: points[i] - 5, y: points[i+1] + 5 };
			var rightTop = { x: points[i] + 5, y: points[i+1] + 5 };
			var rightBottom = { x: points[i] + 5, y: points[i+1] - 5 };
			if (this.pointInRect(leftTop, object) || this.pointInRect(leftBottom, object) || this.pointInRect(rightTop, object) || this.pointInRect(rightBottom, object)) {
                collide = true;
                break;
            }
            i = i + 2;
        }
        return collide;
    };
	
	this.pointInRect = function (point, rect) {
		return point.x >= rect.x1 && point.x <= rect.x2 && point.y >= rect.y1 && point.y <= rect.y2;
	};

    /**
    * Увеличить масштаб
	* @public
    */
    this.scaleUp = function () {
		var oldScale = this.Settings.globalScale;
        this.Settings.globalScale = this.Settings.globalScale + 0.1;
		var newScale = this.Settings.globalScale;

		this.Settings.x = (this.Settings.x / oldScale) * newScale;
		this.Settings.y = (this.Settings.y / oldScale) * newScale;
		
		this.setupObjects();
		
		if (this.pageLifetime != null) {
			this.pageLifetime.update();
		}
    };

    /**
    * Уменьшить масштаб
	* @public
    */
    this.scaleDown = function () {
		var oldScale = this.Settings.globalScale;
        this.Settings.globalScale = this.Settings.globalScale - 0.1;
		var newScale = this.Settings.globalScale;

		this.Settings.x = (this.Settings.x / oldScale) * newScale;
		this.Settings.y = (this.Settings.y / oldScale) * newScale;
		
		this.setupObjects();
		
		if (this.pageLifetime != null) {
			this.pageLifetime.update();
		}
    };

    /**
    * Сдвинуть карту вверх
	* @public
    */
    this.moveUp = function () {
        this.stage.move(0, -100);
        this.stage.batchDraw();
		
		if (this.pageLifetime != null) {
			this.pageLifetime.update();
		}
    };

    /**
    * Сдвинуть карту вниз
	* @public
    */
    this.moveDown = function () {
        this.stage.move(0, 100);
        this.stage.batchDraw();
		
		if (this.pageLifetime != null) {
			this.pageLifetime.update();
		}
    };

    /**
    * Сдвинуть карту влево
	* @public
    */
    this.moveLeft = function () {
		this.stage.move(-100, 0);
        this.stage.batchDraw();
		
		if (this.pageLifetime != null) {
			this.pageLifetime.update();
		}
    };

    /**
    * Сдвинуть карту вправо
	* @public
    */
    this.moveRight = function () {
        this.stage.move(100, 0);
        this.stage.batchDraw();
		
		if (this.pageLifetime != null) {
			this.pageLifetime.update();
		}
    };
	
	/**
	* Сдвинуть карту на указанные значения
	*/
	this.move = function (x,y) {
		if (x != undefined && y != undefined) {
			this.stage.move(x,y);
			this.stage.batchDraw();
		}
	};

	return this.init(options);
}