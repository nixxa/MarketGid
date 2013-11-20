using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using MarketGid.Core;

namespace MarketGid.UI.Controllers
{
	/// <summary>
	/// Контроллер для разной ифформации
	/// </summary>
    public class AboutController : BaseController
    {
		/// <summary>
		/// Initializes a new instance of the <see cref="MarketGid.UI.Controllers.AboutController"/> class.
		/// </summary>
		/// <param name="factory">Factory.</param>
		public AboutController(IUnitOfWorkFactory factory) : base(factory)
		{
		}

		/// <summary>
		/// Раздел информации об МГУ
		/// </summary>
        public ActionResult Info()
        {
            return View ();
        }

		/// <summary>
		/// Раздел для поступающих
		/// </summary>
		public ActionResult Abiturient()
		{
			return View ();
		}
    }
}
