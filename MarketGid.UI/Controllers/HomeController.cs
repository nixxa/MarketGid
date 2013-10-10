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
				var advertisement = GetAdvert (PLACE_NAME);
				ViewBag.Advertisement = advertisement;
			}

			return View("Index");
		}

		/// <summary>
		/// Возвращает следующий рекламный материал
		/// </summary>
		public JsonResult Rotate()
		{
			var advertisement = GetAdvert (PLACE_NAME);
			return Json(new { 
				imageSource = UrlHelper.GenerateContentUrl (advertisement.Uri, this.HttpContext), 
				name = advertisement.Name,
				duration = advertisement.Duration.TotalMilliseconds 
			});
		}

		/// <summary>
		/// Переход к первоначальному экрану
		/// </summary>
		public ActionResult Timedout()
		{
			return Index();
		}

		private const string PLACE_NAME = "LockScreen";
	}
}
