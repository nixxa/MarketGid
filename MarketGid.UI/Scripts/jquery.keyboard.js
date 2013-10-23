(function($){
    $.fn.disableSelection = function() {
        return this
                 .attr('unselectable', 'on')
                 .css('user-select', 'none')
                 .on('selectstart', false);
    };
})(jQuery);

(function($){
    $.keyboard = function (el, text, lang, accepted) {
		var currentLang = lang;
        var shifted = false;
		var pageLifetime = window.pageLifetime;
		var kbLifetime = new Lifetime();

		var kbClose = function () {
			$('#keyboard-'+currentLang).hide();
			el.opened = false;
		};
		
		var kbOpen = function () {
			$('#keyboard-' + currentLang).slideDown(100);
			el.opened = true;
		};
		var mouseupEvt = 'mouseup', mousedownEvt = 'mousedown';
		var isTouchSupported = 'ontouchstart' in window;
		if (isTouchSupported) {
			mouseupEvt = 'touchend';
			mousedownEvt = 'touchstart';
		}
		
		el.on(mouseupEvt, function (e) {
			if (!el.opened) {
				kbOpen();

				kbLifetime.init({
					timeoutInterval: 5000,
					timedout: function () {
						if (el.opened) {
							if (el.html() !== text) {
								accepted(el.html());
								el.html(text);
							}
							kbClose();
						}
					}
				});
			}
		});
		
		$(document).on(mousedownEvt, function (e) {
			var $this = $(e.target);
			if ($this.hasClass('.keyboard') || $this.hasClass('.keyboard-wrap')) 
			{
				return;
			}
			var parents = $this.parents();
			for (var i = 0; i < parents.length; i++) {
				if ($(parents[i]).hasClass('keyboard') || $(parents[i]).hasClass('keyboard-wrap')) 
				{
					return;
				}
			}
			if (el.opened) {
				kbClose();
			}
		});
		
        $('.keyboard li').disableSelection();
        $('.keyboard li').on(mouseupEvt, function (evt) {
			if (pageLifetime != null) {
				pageLifetime.update();
			}
			if (kbLifetime != null) {
				kbLifetime.update();
			}
			
            var character = $(this).html();
            if (shifted) {
                character = character.toUpperCase();
            }
            var currentText = el.html();
            if (currentText === text) {
                el.html('');
                currentText = '';
            }
        
            var $this = $(this);
            var cssClass = $this.attr('class');    
            if ($this.hasClass('backspace')) {
                if (currentText.length > 0) {
                    el.html(currentText.substring(0, currentText.length-1));
                }
            } else if ($this.hasClass('shift')) {
                $('.keyboard li').toggleClass('uppercase');
                shifted = !shifted;
            } else if ($this.hasClass('enter')) {
				kbClose();
				if (accepted !== undefined) {
					accepted(currentText);
				}
            } else if ($this.hasClass('lang')) {
                var targetLang = $this.data('lang');
				if (targetLang !== currentLang) {
					$('#keyboard-'+currentLang).hide();
					$('#keyboard-'+targetLang).show();
					currentLang = targetLang;
				}
            } else if ($this.hasClass('space') || $this.hasClass('mini-space')) {
                el.html(currentText + ' ');
            } else {
                el.html(currentText + character);
            }
            if (el.html() === '') {
                el.removeClass('input-active');
                el.html(text);
            } else {
                el.addClass('input-active');
            }
        });
    };
})(jQuery);