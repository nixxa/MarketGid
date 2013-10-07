using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using MarketGid.Core.Models;
using MarketGid.Core;

namespace MarketGid.UI.Controllers
{
	/// <summary>
	/// Контроллер для страницы ~/home
	/// </summary>
	public class HomeController : BaseController
	{
		/// <summary>
		/// c-tor
		/// </summary>
		/// <param name="factory">Factory.</param>
		public HomeController(IUnitOfWorkFactory factory) : base(factory)
		{
		}

		/// <summary>
		/// Страница блокировки
		/// </summary>
		public ActionResult Index()
		{
			using (var db = Factory.Create()) 
			{
				var advertisement = db.Query<Advertisement> ().First (item => item.Places.Contains (PLACE_NAME));
				ViewData ["imageSource"] = UrlHelper.GenerateContentUrl (advertisement.Uri, this.HttpContext);
				ViewData ["imageName"] = advertisement.Name;
				ViewData ["duration"] = advertisement.Duration.TotalMilliseconds;
			}

			return View("Index");
		}

		/// <summary>
		/// Возвращает следующий рекламный материал
		/// </summary>
		public JsonResult Rotate()
		{
			using (var db = Factory.Create())
			{
				var collection = db.Query<Advertisement> ().Where (item => item.Places.Contains (PLACE_NAME));

				_currentIndex += 1;
				if (_currentIndex > collection.Count ()) _currentIndex = 1;

				var advertisement = collection.Skip (_currentIndex > 0 ? _currentIndex - 1 : 0).First ();
				return Json(new { 
					imageSource = UrlHelper.GenerateContentUrl (advertisement.Uri, this.HttpContext), 
					name = advertisement.Name,
					duration = advertisement.Duration.TotalMilliseconds 
				});
			}
		}

		/// <summary>
		/// Переход к первоначальному экрану
		/// </summary>
		public ActionResult Timedout()
		{
			_currentIndex = 1;
			return Index();
		}

		private const string PLACE_NAME = "LockScreen";
		private static int _currentIndex = 1;
	}
}
