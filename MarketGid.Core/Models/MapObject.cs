using System;
using Newtonsoft.Json;

namespace MarketGid.Core.Models
{
	/// <summary>
	/// Объект карты
	/// </summary>
	public class MapObject
	{
		/// <summary>
		/// Идентификатор
		/// </summary>
		public int Id;
		/// <summary>
		/// Идентификатор категории
		/// </summary>
		public int CategoryId;
		/// <summary>
		/// Наименование объекта
		/// </summary>
		public string Name;
		/// <summary>
		/// Описание для плитки в меню
		/// </summary>
		public string TileDescription;
		/// <summary>
		/// Полное описание
		/// </summary>
		public string Description;

		/// <summary>
		/// Категория объекта
		/// </summary>
		[JsonIgnore]
		public Category Category;
	}
}

