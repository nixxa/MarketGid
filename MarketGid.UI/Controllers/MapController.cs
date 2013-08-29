using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using MarketGid.Core;
using MarketGid.Core.Models;

namespace MarketGid.UI.Controllers
{
    public class MapController : BaseController
    {
		/// <summary>
		/// Initializes a new instance of the <see cref="MarketGid.UI.Controllers.MapController"/> class.
		/// </summary>
		/// <param name="factory">Factory.</param>
		public MapController(IUnitOfWorkFactory factory) : base(factory)
		{
		}

        public ActionResult Index()
        {
			return Redirect ("~/");
        }

		public ActionResult Item(int? id)
		{
			if (!id.HasValue)
				return Redirect ("~/");
			using (var db = Factory.Create()) 
			{
				var topAdvertisement = db.Query<Advertisement> ().FirstOrDefault (item => item.Places.Contains (TOP_PLACE_NAME));
				var bottomAdvertisement = db.Query<Advertisement> ().FirstOrDefault (item => item.Places.Contains (BOTTOM_PLACE_NAME));
				var categories = db.Query<Category> ().Where (c => c.Level == 0);

				ViewBag.TopAdvertisement = topAdvertisement;
				ViewBag.BottomAdvertisement = bottomAdvertisement;
				ViewBag.MapObject = db.Query<MapObject> ().SingleOrDefault (item => item.Id == id.Value);
				ViewBag.Kiosk = db.Query<Kiosk> ().First ();
			}

			return View ("Index");
		}

		public ActionResult ItemPartial(int? id)
		{
			return View ("_MapObject");
		}

		const string TOP_PLACE_NAME = "MapScreenTop";
		const string BOTTOM_PLACE_NAME = "MapScreenBottom";
    }
}
