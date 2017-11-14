{
   function createMap() {

      let bounds = L.bounds(
         [-24925916.518499706, -11159088.984844638],
         [24925916.518499706, 11159088.984844638]
      );

      // Map resolutions that NASA GIBS specify
      let resolutions = [
         67733.46880027094, 33866.73440013547, 16933.367200067736, 8466.683600033868, 4233.341800016934, 2116.670900008467, 1058.3354500042335, 529.16772500211675, 264.583862501058375
      ];


      // The polar projection
      let crs = new L.Proj.CRS('EPSG:3031', '+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs', {
         resolutions: resolutions,
         origin: [-30636100, 30636100],
         bounds
      });
      crs.distance = L.CRS.Earth.distance;
      crs.R = 6378137;
      crs.projection.bounds = bounds;


      let bbox = {};
      let search = document.location.search;
      if (search) {
         search.substr(1).split("&").forEach((item, index) => {
            let kvp = item.split("=");
            bbox[kvp[0]] = +kvp[1];
         });
      }

      let dx = bbox.xMax - bbox.xMin;
      let dy = bbox.yMax - bbox.yMin;
      let xy = [
         bbox.xMin + dx /2,
         bbox.yMin + dy /2
      ];
      let maxXy = Math.max(dx, dy);
      let zoom = 2;

      if(maxXy < 200000) {
         zoom = 6;
      } else if(maxXy < 400000) {
         zoom = 4;
      }

      let centre = proj4("EPSG:3031", "EPSG:4326", [bbox.xMin, bbox.yMin]).reverse();

      let map = this.map = L.map(mappo, {
         center: centre,
         zoom: zoom,
         maxZoom: 8,
         minZoom: 1,
         crs: crs
      });

      // This data is from the "Heroes of the Antarctic"
      // http://geoscience-au.maps.arcgis.com/apps/OnePane/storytelling_basic/index.html?appid=bb956e835f44421da9160b7557ba64a6
      let template = "https://tiles{s}.arcgis.com/tiles/wfNKYeHsOyaFyPw3/arcgis/rest/services/" +
         "Antarctic_Hillshade_and_Bathymetric_Base_Map_SSP/MapServer/tile/{z}/{y}/{x}";
      let options = {
         format: "image%2Fpng",
         tileSize: 256,
         subdomains: "1234",
         noWrap: true,
         continuousWorld: true,
         attribution:
         "<a href='http://www.ga.gov.au'>" +
         "Geoscience Australia</a>"
      };

      let layer = this.layer = L.tileLayer(template, options);

      // HACK: BEGIN
      // Leaflet does not yet handle these kind of projections nicely. Monkey
      // patch the getTileUrl function to ensure requests are within
      // tile matrix set boundaries.
      var superGetTileUrl = layer.getTileUrl;

      // From the metadata https://tiles.arcgis.com/tiles/wfNKYeHsOyaFyPw3/arcgis/rest/services/Antarctic_Hillshade_and_Bathymetric_Base_Map_SSP/MapServer
      let validTiles = {
         0: { min: 1, max: 2 },
         1: { min: 3, max: 4 },
         2: { min: 6, max: 8 },
         3: { min: 12, max: 16 },
         4: { min: 24, max: 32 },
         5: { min: 48, max: 64 },
         6: { min: 96, max: 129 },
         7: { min: 192, max: 259 },
         8: { min: 385, max: 519 }
      };
      layer.getTileUrl = function (coords) {
         let zoom = layer._getZoomForUrl();
         let max = validTiles[zoom].max;
         let min = validTiles[zoom].min;

         if (coords.x < min) { return ""; }
         if (coords.y < min) { return ""; }
         if (coords.x > max) { return ""; }
         if (coords.y > max) { return ""; }
         return superGetTileUrl.call(layer, coords);
      };
      // HACK: END


      map.addLayer(layer);
      window.map = map;

      let latLngs = [
         proj4("EPSG:3031", "EPSG:4326", [bbox.xMin, bbox.yMin]).reverse(),
         proj4("EPSG:3031", "EPSG:4326", [bbox.xMax, bbox.yMin]).reverse(),
         proj4("EPSG:3031", "EPSG:4326", [bbox.xMax, bbox.yMax]).reverse(),
         proj4("EPSG:3031", "EPSG:4326", [bbox.xMin, bbox.yMax]).reverse(),
         proj4("EPSG:3031", "EPSG:4326", [bbox.xMin, bbox.yMin]).reverse()
      ];

      var polygon = L.polygon(latLngs, {color: 'red'}).addTo(map);



/*

      let ll = proj4("EPSG:3031", "EPSG:4326", [bbox.xMin, bbox.yMin]);
      let ur = proj4("EPSG:3031", "EPSG:4326", [bbox.xMax, bbox.yMax]);

      var box = [ll.reverse(), ur.reverse()];
      L.rectangle(box, {color: "#ff7800", weight: 1}).addTo(map);
*/
      // Module which adds graticule (lat/lng lines)
      // L.graticule().addTo(map);

      L.control.scale({ imperial: false }).addTo(map);

      L.control.mousePosition({
         position: "bottomright",
         emptyString: "",
         seperator: " ",
         latFormatter: function (lat) {
            return "Lat " + L.Util.formatNum(lat, 5) + "°";
         },
         lngFormatter: function (lng) {
            return "Lng " + L.Util.formatNum(lng % 180, 5) + "°";
         }
      }).addTo(map);

   }

   L.Control.MousePosition = L.Control.extend({
      options: {
         position: 'bottomleft',
         separator: ' : ',
         emptyString: 'Unavailable',
         lngFirst: false,
         numDigits: 5,
         elevGetter: undefined,
         lngFormatter: undefined,
         latFormatter: undefined,
         prefix: ""
      },

      onAdd: function (map) {
         this._container = L.DomUtil.create('div', 'leaflet-control-mouseposition');
         L.DomEvent.disableClickPropagation(this._container);
         map.on('mousemove', this._onMouseMove, this);
         this._container.innerHTML = this.options.emptyString;
         return this._container;
      },

      onRemove: function (map) {
         map.off('mousemove', this._onMouseMove);
      },

      _onMouseHover: function () {
         var info = this._hoverInfo;
         this._hoverInfo = undefined;
         this.options.elevGetter(info).then(function (elevStr) {
            if (this._hoverInfo) return; // a new _hoverInfo was created => mouse has moved meanwhile
            this._container.innerHTML = this.options.prefix + ' ' + elevStr + ' ' + this._latLngValue;
         }.bind(this));
      },

      _onMouseMove: function (e) {
         var w = e.latlng.wrap();
         let lng = this.options.lngFormatter ? this.options.lngFormatter(w.lng) : L.Util.formatNum(w.lng, this.options.numDigits);
         let lat = this.options.latFormatter ? this.options.latFormatter(w.lat) : L.Util.formatNum(w.lat, this.options.numDigits);


         let sw = proj4("EPSG:4326", "EPSG:3031", [w.lng, w.lat]);



         this._latLngValue = this.options.lngFirst ? lng + this.options.separator + lat : lat + this.options.separator + lng;
         if (this.options.elevGetter) {
            if (this._hoverInfo) window.clearTimeout(this._hoverInfo.timeout);
            this._hoverInfo = {
               lat: w.lat,
               lng: w.lng,
               timeout: window.setTimeout(this._onMouseHover.bind(this), 400)
            };
         }
         this._container.innerHTML = this.options.prefix + ' ' + this._latLngValue; // + " " + sw[1].toFixed(0) + "m, " + sw[0].toFixed(0) + "m";
      }

   });

   L.Map.mergeOptions({
      positionControl: false
   });

   L.Map.addInitHook(function () {
      if (this.options.positionControl) {
         this.positionControl = new L.Control.MousePosition();
         this.addControl(this.positionControl);
      }
   });

   L.control.mousePosition = function (options) {
      return new L.Control.MousePosition(options);
   };

}