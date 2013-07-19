using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace MvcApplication1.Controllers
{
	public class HomeController : Controller
	{
		public ActionResult Index()
		{
			ViewData["imageSource"] = UrlHelper.GenerateContentUrl(_links[_currentIndex], this.HttpContext);
			return View();
		}

		public JsonResult Rotate()
		{
			_currentIndex += 1;
			if (_currentIndex >= _links.Length) _currentIndex = 0;
			return Json(new { imageSource = UrlHelper.GenerateContentUrl(_links[_currentIndex], this.HttpContext) });
		}

		public ActionResult Timedout()
		{
			_currentIndex = 0;
			ViewData["imageSource"] = UrlHelper.GenerateContentUrl(_links[_currentIndex], this.HttpContext);
			return View("Index");
		}

		private static int _currentIndex = 0;
		private string[] _links = new string[] {
			"~/Content/images/ppl1.jpg",
			"~/Content/images/mosf1.jpg"
		};
	}
}
