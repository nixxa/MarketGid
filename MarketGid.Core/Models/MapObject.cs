using System;
using Newtonsoft.Json;
using System.Collections.Generic;

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
		/// Идентификаторы категории
		/// </summary>
		public List<int> CategoryIds;
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
		/// Категории объекта
		/// </summary>
		[JsonIgnore]
		public List<Category> Categories;
	}
}

