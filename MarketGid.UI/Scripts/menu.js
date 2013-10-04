/// <reference path="jquery-2.0.3.vsdoc.js" />
/// <reference path="animation.js" />

var Menu = {

	Settings: {
		mainMenuUri: '',
		subMenuUri: '',
		objectUri: '',
		objectDetailsUri: '',
		homeUri: '',
		findUri: '',
		thumbnailsContainer: '',
		thumbnails: '',
		title: '',
		titleUri: ''
	},

	thumbnailsContainer: null,
	title: null,

	init: function (options) {
		if (options != undefined) {
			if (options.mainMenuUri != undefined) Menu.Settings.mainMenuUri = options.mainMenuUri;
			if (options.subMenuUri != undefined) Menu.Settings.subMenuUri = options.subMenuUri;
			if (options.objectUri != undefined) Menu.Settings.objectUri = options.objectUri;
			if (options.objectDetailsUri != undefined) Menu.Settings.objectDetailsUri = options.objectDetailsUri;
			if (options.homeUri != undefined) Menu.Settings.homeUri = options.homeUri;
			if (options.findUri != undefined) Menu.Settings.findUri = options.findUri;
			if (options.thumbnailsContainer != undefined) Menu.Settings.thumbnailsContainer = options.thumbnailsContainer;
			if (options.thumbnails != undefined) Menu.Settings.thumbnails = options.thumbnails;
			if (options.title != undefined) Menu.Settings.title = options.title;
			if (options.titleUri != undefined) Menu.Settings.titleUri = options.titleUri;
		}

		Menu.thumbnailsContainer = $(Menu.Settings.thumbnailsContainer);
		Menu.title = $(Menu.Settings.title);

		Menu.initThumbs();
		Menu.initKeyboard();
	},

	// добавляет обработчик события 'mousedown' & 'mouseup' для тайлов
	// По клику будут получаться данные по адресу ~/main/category/{id}
	initThumbs: function () {
		$(Menu.Settings.thumbnails).mousedown( function () {
			$(this).toggleClass('clicked');
		});
		$(Menu.Settings.thumbnails).mouseup( function () {
			if ($(this).hasClass('clicked') == false) return;
			$(this).toggleClass('clicked');
			if ( $(this).data('category') != undefined) {
				Menu.showCategory($(this).data('category'));
			} else if ( $(this).data('object') != undefined) {
				Menu.showObject($(this).data('object'));
			}
		});
	},
	
	catTitle: function () {
		if ($('.breadcrumb').height() > 65) {
			$('#mgid-menu-mosfilm').text('...');
		}
	},
	
	showCategory: function (id) {
		var cont = $('#container');
		Animation.fadeOut(Menu.Settings.thumbnailsContainer);
		$.post(Menu.Settings.subMenuUri + id, function (data) {
			// отсылаем данные в GA
			if (_gaq) {
				_gaq.push(['_trackPageview', Menu.Settings.subMenuUri + id]);
			}
			cont.html(data);
			Menu.initThumbs();
			Menu.initKeyboard();
			Animation.fadeIn(Menu.Settings.thumbnailsContainer);
		});
		$.post(Menu.Settings.titleUri + '?id=' + id, function (data) {
			// отсылаем данные в GA
			if (_gaq) {
				_gaq.push(['_trackPageview', Menu.Settings.titleUri + '?id=' + id]);
			}		
			Menu.title.html(data);
			Menu.catTitle();
		});
	},
	
	showObject: function (id, name) {
		var cont = $('#container');
		if (name == undefined) {
			Animation.fadeOut(cont);
			$.post(Menu.Settings.objectUri + id, function (data) {
				// отсылаем данные в GA
				if (_gaq) {
					_gaq.push(['_trackPageview', Menu.Settings.objectUri + id]);
				}
				cont.html(data);
				Animation.fadeIn(cont);
			});
		} else {
			mapManager.navigateTo(name, kioskOptions);
		}
		Menu.showObjectTitle(id);
		Menu.showObjectDetails(id);
	},
	
	showObjectTitle: function (objectId) {
		$.post(Menu.Settings.titleUri + '?objectId=' + objectId, function (data) {
			// отсылаем данные в GA
			if (_gaq) {
				_gaq.push(['_trackPageview', Menu.Settings.titleUri + '?objectId=' + objectId]);
			}
			Menu.title.html(data);
			Menu.catTitle();
		});
	},
	
	showObjectDetails: function (objectId) {
		$.post(Menu.Settings.objectDetailsUri + '?id=' + objectId, function (data) {
			// отсылаем данные в GA
			if (_gaq) {
				_gaq.push(['_trackPageview', Menu.Settings.objectDetailsUri + '?id=' + objectId]);
			}		
			$('.mgid-panel').html(data);
		});	
	},

	initKeyboard: function () {
		// init virtual keyboard
		$('#ipad').keypress(function (event) {
			var elem = $(this);
			if (event.keyCode == 13) {
				var cont = $('#container');
				Animation.fadeOut(cont);
				$.get(Menu.Settings.findUri + elem.val(), function (data) {
					// отсылаем данные в GA
					if (_gaq) {
						_gaq.push(['_trackPageview', Menu.Settings.findUri + elem.val()]);
					}
					cont.html(data);
					Menu.initThumbs();
					Menu.initKeyboard();
					Animation.fadeIn(cont);
				});
			}
		});
		/*
		$('#ipad').keyboard({ 
 		    display: { 
		        'bksp'   :  "\u2190", 
		        'accept' : 'Поиск', 
		        'default': 'АБВ', 
		        'meta1'  : '.?123', 
		        'meta2'  : '#+=',
		        'enter'  : 'Поиск'
		    }, 
		    layout: 'custom', 
		    customLayout: { 
		        'default': [ 
		            'й ц у к е н г ш щ з х {bksp}', 
		            'ф ы в а п р о л д ж {accept}', 
		            'я ч с м и т ь б ю э ъ .', 
		            '{s} {meta1} {space} {meta1}' 
		        ], 
		        'shift': [ 
		            'Й Ц У К Е Н Г Ш Щ З Х {bksp}', 
		            'Ф Ы В А П Р О Л Д Ж {accept}', 
		            'Я Ч С М И Т Ь Б Ю Э Ъ .', 
		            '{s} {meta1} {space} {meta1}' 
		        ], 
		        'meta1': [ 
		            '1 2 3 4 5 6 7 8 9 0 {bksp}', 
		            '- / : ; ( ) \u20ac & @@ {accept}', 
		            '{meta2} . , ? ! \' " {meta2}', 
		            '{default} {space} {default}' 
		        ], 
		        'meta2': [ 
		            '[ ] { } # % ^ * + = {bksp}', 
		            '_ \\ | ~ < > $ \u00a3 \u00a5 {accept}', 
		            '{meta1} . , ? ! \' " {meta1}', 
		            '{default} {space} {default}' 
		        ] 
		    },
			accepted : function(e, keyboard, el) {
				if (el.value == '') return;
				var cont = $('#container');
				Animation.fadeOut(cont);
				$.get(Menu.Settings.findUri + el.value, function (data) {
					// отсылаем данные в GA
					if (_gaq) {
						_gaq.push(['_trackPageview', Menu.Settings.findUri + el.value]);
					}
					cont.html(data);
					Menu.initThumbs();
					Menu.initKeyboard();
					Animation.fadeIn(cont);
				});
			}
		});
		*/
	}
};
