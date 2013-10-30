// lifetime.js
/*jslint nomen: true*/
/*global $*/
/*jslint nomen: false */

function Lifetime () {
	"use strict";
	
	this.last = {};
	this.timeoutInterval = 20000;
	
	/**
	* Инициализирует объект
	* @public
	*/
	this.init = function (options) {
		if (options !== undefined) {
			if (options.timeoutInterval !== undefined) {
				this.timeoutInterval = options.timeoutInterval;
			}
			if (options.timedout !== undefined) {
				this.timedout = options.timedout;
			}
		}
		
		this.last = new Date();
		var self = this;

		setInterval (function () { 
			var current = new Date();
			if ((current.getTime() - self.last.getTime()) > self.timeoutInterval) {
				self.timedout();
			}
		}, 1000);
		
		$('*').on('click tap', function (evt) {
			self.update();
		});
	};
	
	/**
	* Обновляет время последнего действия на странице
	* @public
	*/
	this.update = function (millis) {
		var current = new Date();
		if (millis !== undefined) {
			if (this.last != null) {
				current = new Date(this.last.getTime() + millis);
			} else {
				current = new Date(new Date().getTime() + millis);
			}			
		}
		if (this.last == null) {
			this.last = current;
		} else if (current > this.last) {
			this.last = current;
		}
	};
	
	/**
	* Переводит на LockScreen, если пользователь долго ничего не делал
	*/
	this.timedout = function () {
		window.location = '/home/timedout';
	};
	
	return this;
}
