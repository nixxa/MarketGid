/// <reference path="_references.js" />
/// <reference path="graph.js" />
/// <reference path="kineticjs-4.6.0.js" />

// width: 910, height: 820

function Map(options) {

    /**
    * Settings object
    */
    this.Settings = {
        // масштаб
        globalScale: 1.2,
        // координаты киоска
        x: 0,
        y: 0,
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
        shadowColor: 'black'
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
	this.originalOptions = null;

    /**
    * Init map and draw objects
	* @private
    */
    this.init = function (options) {
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

			this.originalOptions = options;
        }

        Graph.init(options);

        // init kinetic stage
        this.stage = new Kinetic.Stage({
            container: 'map',
            width: 910,
            height: 820
            //draggable: true
        });

        this.show();

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
    },

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
            var pathObject = new Kinetic.Path({
                scale: this.Settings.globalScale,
                data: PathData[id].path,
                fill: this.Settings.inactiveObjectBgColor,
                opacity: this.Settings.inactiveObjectOpacity,
                //stroke: Map.Settings.borderColor,
                //strokeWidth: 1,
                id: id
            });
            this.Objects[id] = {
                path: pathObject,
                name: PathData[id].name,
                color: null
            };
        }

        this.startObject = new Kinetic.Circle({
            fill: this.Settings.kioskPointBgColor,
            stroke: this.Settings.kioskPointColor,
            strokeWidth: 1,
            x: this.originalOptions.x * this.Settings.globalScale,
            y: this.originalOptions.y * this.Settings.globalScale,
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
            options = { x: this.originalOptions.x * this.Settings.globalScale, y: this.originalOptions.y * this.Settings.globalScale, pointerDirection: 'down' };
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
            shadowBlur: 10,
            shadowOffset: 10,
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
                image: imgObj,
                scale: self.Settings.globalScale
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
			var self = this;
            path.on('mousedown touchstart', function (evt) {
            	self.showPath(evt);
            });
            this.mapLayer.add(path);
        }

        this.navLayer.add(this.startObject);

        var tooltip = this.setupTooltip(
		{ 
			x: this.originalOptions.x * this.Settings.globalScale, 
			y: this.originalOptions.y * this.Settings.globalScale, 
			text: 'Вы здесь' 
		});
        this.navLayer.add(tooltip);
    };

    /**
     * Отображает путь к именованному объекту
	 * @public
	 * @param objectName - имя объекта
     */
    this.navigateTo = function (objectName) {
        var mapObject = null;

        for (var key in this.Objects) {
            if (this.Objects[key].name == objectName) {
                mapObject = this.Objects[key];
                break;
            }
        }

        if (mapObject != null) {
            this.showPath({ targetNode: mapObject.path }, mapObject.map);
        }

        this.navObjectName = objectName;
    };

    /**
     * отображает объекты на карте
	 * @public
     */
    this.show = function () {
        this.setupObjects();

        this.backgroundLayer = new Kinetic.Layer({
            scale: this.Settings.globalScale
        });

        this.mapLayer = new Kinetic.Layer({
            scale: this.Settings.globalScale
        });

        this.navLayer = new Kinetic.Layer({
            scale: this.Settings.globalScale
        });

        this.drawBackground();
        this.drawObjects();

        this.stage.add(this.backgroundLayer);
        this.stage.add(this.mapLayer);
        this.stage.add(this.navLayer);
    };

	/**
	 * Отображает путь на карте
	 * @private
	 * @param evt - объект, содержащий св-во targetNode
	 * @param mapName - имя карты
	 */
    this.showPath = function (evt, mapName) {
        var path = evt.targetNode;
        path.setFill(this.Settings.activeObjectBgColor);
        path.setStroke(this.Settings.borderColor);
        path.setStrokeWidth(1);
        path.setOpacity(this.Settings.activeObjectOpacity);
        path.setShadowColor(this.Settings.shadowColor);
        path.setShadowBlur(10);
        path.setShadowOffset(10);
        path.setShadowOpacity(0.5);

        if (this.selectedObject == null) {
            this.selectedObject = path;
        } else if (this.selectedObject != path) {
            this.selectedObject.setFill(this.Settings.inactiveObjectBgColor);
            this.selectedObject.setStrokeWidth(1);
            this.selectedObject.setStroke('transparent');
            this.selectedObject.setOpacity(this.Settings.inactiveObjectOpacity);
            this.selectedObject.setShadowOffset(0);
            this.selectedObject.setShadowOpacity(0);
            this.selectedObject.setShadowBlur(0);
            this.selectedObject = path;
        }

        // clear navLayer
        this.stage.remove(Map.navLayer);
        this.navLayer.removeChildren();

        // get path points
		if (mapName == undefined) {
			mapName = this.Settings.mapName;
		}
        var points = Graph.navigateTo(path, mapName);

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

        var rect = { x1: x - 150 / 2, y1: y + 10, x2: x + 150 / 2, y2: y + 30, d: 'down' };
        if (this.checkCollide(points, rect)) {
            this.navLayer.add(
				this.setupTooltip({
					x: this.originalOptions.x * this.Settings.globalScale, 
					y: this.originalOptions.y * this.Settings.globalScale, 
					text: 'Вы здесь', 
					pointerDirection: 'up', 
					bgColor: 'black'
				}));
        } else {
            this.navLayer.add(
				this.setupTooltip({ 
					x: this.originalOptions.x * this.Settings.globalScale, 
					y: this.originalOptions.y * this.Settings.globalScale, 
					text: 'Вы здесь', 
					pointerDirection: 'down', 
					bgColor: 'black' 
				}));
        }

        // setup endpoint tooltip
        var mapObject = null;
        var text = 'Искомый объект';
        for (var key in this.Objects) {
            if (this.Objects[key].path == path) {
                mapObject = this.Objects[key];
                break;
            }
        }
        if (mapObject != null) text = mapObject.name;
        rect = { x1: x - 250 / 2, y1: y + 10, x2: x + 250 / 2, y2: y + 30, d: 'down' };
        if (this.checkCollide(points, rect)) {
            this.navLayer.add(this.setupTooltip({ x: x, y: y, text: text, pointerDirection: 'down', bgColor: 'black' }));
        } else {
            this.navLayer.add(this.setupTooltip({ x: x, y: y, text: text, pointerDirection: 'up', bgColor: 'black' }));
        }

        // show navLayer
        this.stage.add(this.navLayer);

        this.mapLayer.drawScene();
    };

    this.checkCollide = function (points, object) {
        var collide = false;
        for (var i = 0; i < points.length; ) {
            if (points[i] >= object.x1 && points[i] <= object.x2 && points[i + 1] >= object.y1 && points[i + 1] <= object.y2) {
                collide = true;
                break;
            }
            i = i + 2;
        }
        return collide;
    };

    /**
    * Увеличить масштаб
	* @public
    */
    this.scaleUp = function () {
        this.Settings.globalScale = this.Settings.globalScale + 0.1;
        this.clear();

		var options = this.originalOptions;
		options.globalScale = this.Settings.globalScale;

		Graph.clear();
		Graph.init(options);

        this.show();
        if (this.navObjectName != null) {
            this.navigateTo(this.navObjectName);
        }
    };

    /**
    * Уменьшить масштаб
	* @public
    */
    this.scaleDown = function () {
        this.Settings.globalScale = this.Settings.globalScale - 0.1;
        this.clear();

		var options = this.originalOptions;
		options.globalScale = this.Settings.globalScale;

		Graph.clear();
		Graph.init(options);

        this.show();
        if (this.navObjectName != null) {
            this.navigateTo(this.navObjectName);
        }
    };

    /**
    * Сдвинуть карту вверх
	* @public
    */
    this.moveUp = function () {
        this.stage.move(0, -100);
        this.stage.draw();
    };

    /**
    * Сдвинуть карту вниз
	* @public
    */
    this.moveDown = function () {
        this.stage.move(0, 100);
        this.stage.draw();
    };

    /**
    * Сдвинуть карту влево
	* @public
    */
    this.moveLeft = function () {
        this.stage.move(-100, 0);
        this.stage.draw();
    };

    /**
    * Сдвинуть карту вправо
	* @public
    */
    this.moveRight = function () {
        this.stage.move(100, 0);
        this.stage.draw();
    };

	return this.init(options);
}