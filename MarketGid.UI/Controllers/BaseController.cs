﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using MarketGid.Core;
using MarketGid.Core.Models;

namespace MarketGid.UI.Controllers
{
	/// <summary>
	/// Базовый класс
	/// </summary>
    public abstract class BaseController : Controller
    {
		/// <summary>
		/// Initializes a new instance of the <see cref="MvcApplication1.Controllers.BaseController"/> class.
		/// </summary>
		/// <param name="factory">Factory.</param>
        public BaseController(IUnitOfWorkFactory factory)
		{
			Factory = factory;
		}

		protected readonly IUnitOfWorkFactory Factory;

		/// <summary>
		/// Идентификатор киоска, для которого выполняется запрос
		/// </summary>
		/// <value>The kiosk identifier.</value>
		protected int KioskId
		{
			get
			{
				string value = (string) HttpContext.Items ["kioskId"];
				if (string.IsNullOrWhiteSpace (value))
					return 1;
				return int.Parse (value);
			}
		}

		/// <summary>
		/// Возвращает следующий рекламный материал для указанной области
		/// </summary>
		/// <returns>The advert.</returns>
		/// <param name="place">Place.</param>
		protected Advertisement GetAdvert(string place)
		{
			using (var db = Factory.Create())
			{
				var collection = db.Query<Advertisement> ().Where (item => item.Places.Contains (place));

				int currentIndex = Session [place + "_advertIndex"] != null ? (int) Session[place + "_advertIndex"] : 0;
				currentIndex += 1;
				if (currentIndex > collection.Count ()) currentIndex = 1;
				Session [place + "_advertIndex"] = currentIndex;

				var advert = collection.Skip (currentIndex > 0 ? currentIndex - 1 : 0).First ();
				advert.MapObject = db.Query<MapObject>().SingleOrDefault(m => m.Id == advert.ObjectId);

				return advert;
			}
		}
    }
}
