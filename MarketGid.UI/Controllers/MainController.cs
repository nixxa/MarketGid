using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using MarketGid.Core;
using MarketGid.Core.Models;

namespace MarketGid.UI.Controllers
{
	/// <summary>
	/// Контроллер главное страницы (меню)
	/// </summary>
    public class MainController : BaseController
    {
		/// <summary>
		/// Initializes a new instance of the <see cref="MarketGid.UI.Controllers.MainController"/> class.
		/// </summary>
		/// <param name="factory">Factory.</param>
		public MainController(IUnitOfWorkFactory factory) : base(factory)
		{
		}

		/// <summary>
		/// Главное меню
		/// </summary>
		/// <returns></returns>
        public ActionResult Index()
        {
			using (var db = Factory.Create())
			{
				var topAdvertisement = db.Query<Advertisement> ().FirstOrDefault (item => item.Places.Contains (TOP_PLACE_NAME));
				var bottomAdvertisement = db.Query<Advertisement> ().FirstOrDefault (item => item.Places.Contains (BOTTOM_PLACE_NAME));
				var categories = db.Query<Category> ().Where (c => c.Level == 0);

				ViewBag.TopAdvertisement = topAdvertisement;
				ViewBag.BottomAdvertisement = bottomAdvertisement;
				ViewBag.Categories = categories.ToList ();
			}
            return View();
        }

        /// <summary>
        /// Дочерние категории
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
		public ActionResult Category(int? id)
		{
			using (var db = Factory.Create())
			{
				if (id.HasValue)
				{
					Category category = db.Query<Category> ().SingleOrDefault (c => c.Id == id);
					ViewBag.Category = category;
				}
				else
				{
					ViewBag.Category = new Category 
					{ 
						Children = db.Query<Category> ().Where (c => c.Level == 0).ToList (),
						Objects = new List<MapObject> (),
					};
				}
			}
			return PartialView("_Category");
		}
		
		/// <summary>
		/// Меню страницы
		/// </summary>
		/// <param name="id"></param>
		/// <returns></returns>
		public ActionResult Title(int? id, int? objectId)
		{
			using (var db = Factory.Create())
			{
				if (id.HasValue)
				{
					Category category = db.Query<Category> ().SingleOrDefault (c => c.Id == id);
					ViewBag.Category = category;
				}
				else
				{
					ViewBag.Category = new Category 
					{ 
						Children = db.Query<Category> ().Where (c => c.Level == 0).ToList (),
						Objects = new List<MapObject> (),
					};
				}
				if (objectId.HasValue) {
					var mapObject = db.Query<MapObject> ().SingleOrDefault (o => o.Id == objectId.Value);
					if (mapObject != null) 
					{
						ViewBag.Category = mapObject.Category;
						ViewBag.MapObject = mapObject;
					}
				}
					ViewBag.AllCategories = db.Query<Category> ().ToList();
			}
			return PartialView("_Title");
		}

		/// <summary>
		/// Результаты поиска
		/// </summary>
		/// <param name="q"></param>
		/// <returns></returns>
		public ActionResult Find(string q)
		{
			if (string.IsNullOrWhiteSpace (q))
				return Category (null);

			using (var db = Factory.Create())
			{
				ViewBag.Category = new Category ();
				ViewBag.Category.Children = db.Query<Category> ().Where (c => c.Name.Contains (q)).ToList ();
				ViewBag.Category.Objects = db.Query<MapObject> ().Where (o => 
				    (!string.IsNullOrEmpty (o.Name) && o.Name.IndexOf (q, StringComparison.InvariantCultureIgnoreCase) >= 0) 
				    || (!string.IsNullOrEmpty (o.Description) && o.Description.IndexOf (q, StringComparison.InvariantCultureIgnoreCase) >= 0)
				    || (!string.IsNullOrEmpty (o.TileDescription) && o.TileDescription.IndexOf (q, StringComparison.InvariantCultureIgnoreCase) >= 0))
					.ToList ();
			}
			return PartialView("_Category");
		}

		const string TOP_PLACE_NAME = "MainScreenTop";
		const string BOTTOM_PLACE_NAME = "MainScreenBottom";
    }
}
