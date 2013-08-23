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

        public ActionResult Index()
        {
			using (var db = Factory.Create())
			{
				var topAdvertisement = db.Query<Advertisement> ().FirstOrDefault (item => item.Place == TOP_PLACE_NAME);
				var bottomAdvertisement = db.Query<Advertisement> ().FirstOrDefault (item => item.Place == BOTTOM_PLACE_NAME);
				var categories = db.Query<Category> ().Where (c => c.Level == 0);

				ViewBag.TopAdvertisement = topAdvertisement;
				ViewBag.BottomAdvertisement = bottomAdvertisement;
				ViewBag.Categories = categories.ToList ();
			}
            return View();
        }

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

		const string TOP_PLACE_NAME = "MainScreenTop";
		const string BOTTOM_PLACE_NAME = "MainScreenBottom";
    }
}
