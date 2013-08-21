using System;
using System.Xml.Serialization;
using System.Xml;
using System.ComponentModel;

namespace MarketGid.Core
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
		[XmlIgnore]
		public TimeSpan Duration;

		[Browsable (false), EditorBrowsable(EditorBrowsableState.Never), XmlElement("Duration")]
		public string DurationString
		{
			get { return XmlConvert.ToString (Duration); }
			set { Duration = TimeSpan.Parse(value); }
		}
		/// <summary>
		/// Место показа
		/// </summary>
		public string Place;
	}
}

