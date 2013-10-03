using System;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace MarketGid.Core.Models
{
	/// <summary>
	/// Категория объектов
	/// </summary>
	public class Category
	{
		/// <summary>
		/// Идентификатор
		/// </summary>
		public int Id;
		/// <summary>
		/// Идентификатор родительской категории
		/// </summary>
		public int? ParentId;
		/// <summary>
		/// Название
		/// </summary>
		public string Name;
		/// <summary>
		/// Путь к иконке
		/// </summary>
		public string IconPath;
		/// <summary>
		/// Цвет фона кнопки категории
		/// </summary>
		public string StyleName;

		/// <summary>
		/// Список объектов в категории
		/// </summary>
		[JsonIgnore]
		public IList<MapObject> Objects = new List<MapObject> ();
		/// <summary>
		/// Список дочерних категорий
		/// </summary>
		[JsonIgnore]
		public IList<Category> Children = new List<Category> ();
		/// <summary>
		/// Родительская категория
		/// </summary>
		[JsonIgnore]
		public Category Parent = null;
		/// <summary>
		/// Уровень категории (0,1,2,...)
		/// </summary>
		/// <value>The level.</value>
		[JsonIgnore]
		public int Level
		{
			get 
			{
				if (Parent == null)
					return 0;
				return Parent.Level + 1;
			}
		}
		/// <summary>
		/// Ветка категорий
		/// </summary>
		/// <value>The branch.</value>
		[JsonIgnore]
		public IList<Category> Branch
		{
			get
			{
				if (Parent == null)
					return new List<Category> { this };
				var list = Parent.Branch;
				list.Add (this);
				return list;
			}
		}
	}
}

