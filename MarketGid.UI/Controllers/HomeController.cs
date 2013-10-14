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
				advertisement.CurrentPlace = PLACE_NAME;
				ViewBag.Advertisement = advertisement;
			}

			return View("Index");
		}

		/// <summary>
		/// Возвращает следующий рекламный материал
		/// </summary>
		public ActionResult Rotate()
		{
			var advertisement = GetAdvert (PLACE_NAME);
			advertisement.CurrentPlace = PLACE_NAME;
			return PartialView ("_Advertisement", advertisement);
		}

		/// <summary>
		/// Переход к первоначальному экрану
		/// </summary>
		public ActionResult Timedout()
		{
			return Index();
		}

		const string PLACE_NAME = "LockScreen";
	}
}
