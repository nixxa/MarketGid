using System;
using System.Xml.Serialization;
using System.Xml;
using System.ComponentModel;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace MarketGid.Core.Models
{
	/// <summary>
	/// Рекламное объявление
	/// </summary>
	public class Advertisement
	{
		/// <summary>
		/// Идентификатор
		/// </summary>
		public int Id;
		/// <summary>
		/// Наименование объявления (показывается в статистике)
		/// </summary>
		public string Name;
		/// <summary>
		/// Путь к данным (картинка, видео, текст и т.д.)
		/// </summary>
		public string Uri;
		/// <summary>
		/// Время показа
		/// </summary>
		public TimeSpan Duration;
		/// <summary>
		/// Место показа
		/// </summary>
		public List<string> Places;
		/// <summary>
		/// Тип рекламы [ "image" | "video" ]
		/// </summary>
		public string MimeType = "image/jpeg";
		/// <summary>
		/// Текущее место показа
		/// </summary>
		public string CurrentPlace;
		/// <summary>
		/// Идентификатор объекта, которму принадлежит реклама
		/// </summary>
		public int ObjectId;

		/// <summary>
		/// Gets the GA event category.
		/// </summary>
		/// <value>The GA event category.</value>
		[JsonIgnore]
		public string GAEventCategory
		{
			get 
			{
				return MimeType.Contains("image") ? "Изображение" : "Видео";
			}
		}

		/// <summary>
		/// The map object.
		/// </summary>
		[JsonIgnore]
		public MapObject MapObject;
	}
}

