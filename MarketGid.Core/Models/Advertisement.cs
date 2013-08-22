using System;
using System.Xml.Serialization;
using System.Xml;
using System.ComponentModel;

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
		public string Place;
	}
}

