// animations.js

var Animation = {
	/**
	 * Плавно проявляет элемент
	 */
	fadeIn: function (elem) {
		var jelem = $(elem);
		if (jelem.hasClass('animated')) jelem.removeClass('animated');
		if (jelem.hasClass('fadeOut')) jelem.removeClass('fadeOut');
		if (jelem.hasClass('fadeIn')) jelem.removeClass('fadeIn');
		jelem.addClass('animated fadeIn');
	},

	/**
	 * Плавно скрывает элемент
	 */
	fadeOut: function (elem) {
		var jelem = $(elem);
		if (jelem.hasClass('animated')) jelem.removeClass('animated');
		if (jelem.hasClass('fadeOut')) jelem.removeClass('fadeOut');
		if (jelem.hasClass('fadeIn')) jelem.removeClass('fadeIn');
		jelem.addClass('animated fadeOut');
	}	
};

