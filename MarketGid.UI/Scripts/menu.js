/// <reference path="jquery-2.0.3.vsdoc.js" />
/// <reference path="animation.js" />

var Menu = {

	Settings: {
		mainMenuUri: '',
		subMenuUri: '',
		objectUri: '',
		homeUri: '',
		findUri: '',
		thumbnailsContainer: '',
		thumbnails: '',
		backButton: '',
		title: ''
	},

	titleBranch: [ 'МОСФИЛЬМ' ],
	backButton: null,
	thumbnailsContainer: null,
	title: null,

	init: function (options) {
		if (options != undefined) {
			if (options.mainMenuUri != undefined) Menu.Settings.mainMenuUri = options.mainMenuUri;
			if (options.subMenuUri != undefined) Menu.Settings.subMenuUri = options.subMenuUri;
			if (options.objectUri != undefined) Menu.Settings.objectUri = options.objectUri;
			if (options.homeUri != undefined) Menu.Settings.homeUri = options.homeUri;
			if (options.findUri != undefined) Menu.Settings.findUri = options.findUri;
			if (options.thumbnailsContainer != undefined) Menu.Settings.thumbnailsContainer = options.thumbnailsContainer;
			if (options.thumbnails != undefined) Menu.Settings.thumbnails = options.thumbnails;
			if (options.backButton != undefined) Menu.Settings.backButton = options.backButton;
			if (options.title != undefined) Menu.Settings.title = options.title;
		}

		Menu.backButton = $(Menu.Settings.backButton);
		Menu.thumbnailsContainer = $(Menu.Settings.thumbnailsContainer);
		Menu.title = $(Menu.Settings.title);

		Menu.initBackButton();
		Menu.initThumbs();
		Menu.initKeyboard();
	},

	initBackButton: function () {
		// init link
		Menu.backButton.data('state', 'outpage');
		Menu.backButton.click(function () {
			var link = $(this);
			if (link.data('state') == 'onpage') {
				Menu.titleBranch.pop();
				Menu.displayTitle();
				Animation.fadeOut(Menu.Settings.thumbnailsContainer);
				$.get(Menu.Settings.mainMenuUri, function (data) {
					Menu.thumbnailsContainer.html(data);
					Menu.initThumbs();
					link.attr('href', Menu.Settings.homeUri);
					link.data('state', 'outpage');
					Animation.fadeIn(Menu.Settings.thumbnailsContainer);
				});
			} else {
				Animation.fadeOut('body');
			}
		});		
	},

		// добавляет обработчик события 'mousedown' & 'mouseup' для тайлов
	// По клику будут получаться данные по адресу ~/main/category/{id}
	initThumbs: function () {
		$(Menu.Settings.thumbnails).mousedown( function () {
			$(this).toggleClass('clicked');
		});
		$(Menu.Settings.thumbnails).mouseup( function () {
			if ($(this).hasClass('clicked') == false) return;
			var subTitle = $(this).find('h3:first-child').text();
			$(this).toggleClass('clicked');
			Animation.fadeOut(Menu.Settings.thumbnailsContainer);
			if ( $(this).data('category') != undefined) {
				$.get(Menu.Settings.subMenuUri + $(this).data('category'), function (data) {
					Menu.thumbnailsContainer.html(data);
					Menu.initThumbs();
					Menu.backButton.attr('href', '#');
					Menu.backButton.data('state', 'onpage');
					Menu.titleBranch.push(subTitle);
					Menu.displayTitle();
					Animation.fadeIn(Menu.Settings.thumbnailsContainer);
				});
			} else if ( $(this).data('object') != undefined) {
				window.location.href = Menu.Settings.objectUri + $(this).data('object');
			}
		});
	},

	initKeyboard: function () {
		// init virtual keyboard
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
				Animation.fadeOut(Menu.Settings.thumbnailsContainer);
				$.get(Menu.Settings.findUri + el.value, function (data) {
					Menu.thumbnailsContainer.html(data);
					Menu.initThumbs();
					Animation.fadeIn(Menu.Settings.thumbnailsContainer);
				});
			}
		});
	},

	displayTitle: function () {
		Menu.title.text(Menu.titleBranch.join(' \\ '));
	}
};
