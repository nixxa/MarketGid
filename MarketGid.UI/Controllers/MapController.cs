using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace MarketGid.UI.Controllers
{
    public class MapController : Controller
    {
        public ActionResult Index()
        {
            return View ();
        }

		public ActionResult Item(int? id)
		{
			return View ("Index");
		}
    }
}
