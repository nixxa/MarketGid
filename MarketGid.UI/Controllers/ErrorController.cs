﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace MarketGid.UI.Controllers
{
    public class ErrorController : Controller
    {
        public ActionResult Index()
        {
            return View ("General");
        }

		public ActionResult NoConfig()
		{
			return View ("General");
		}
    }
}
