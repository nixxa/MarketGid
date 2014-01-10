using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using NLog;

namespace MarketGid.UI.Controllers
{
    public class ClientLoggerController : Controller
    {
		public ActionResult Index()
        {
			string logger = Request.Params ["logger"];
			string timestamp = Request.Params ["timestamp"];
			string level = Request.Params ["level"];
			string url = Request.Params ["url"];
			string message = Request.Params ["message"];
			string layout = Request.Params ["layout"];

			switch (level)
			{
				case "DEBUG":
					Logger.Debug("{0} in {1}", message, url);
					break;
				case "INFO":
					Logger.Info("{0} in {1}", message, url);
					break;
				case "ERROR":
					Logger.Error("{0} in {1}", message, url);
					break;
				case "FATAL":
					Logger.Error("{0} in {1}", message, url);
					break;
			}

			return new EmptyResult();
        }

		#region Private members

		static readonly Logger Logger = LogManager.GetCurrentClassLogger();

		#endregion
    }
}
