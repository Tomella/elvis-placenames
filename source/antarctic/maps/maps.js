{

   class MapService {
      constructor(p) {
         this._promise = p;
         this._promises = [];
      }

      getMap() {
         if (this.map) {
            return this._promise.when(this.map);
         }

         let promise = this._promise.defer();
         this._promises.push(promise);
         return promise.promise;
      }

      init(div) {
         // Map resolutions that NASA GIBS specify
         let resolutions = [
            67733.46880027094, 33866.73440013547, 16933.367200067736, 8466.683600033868, 4233.341800016934, 2116.670900008467, 1058.3354500042335
         ];

         let bounds = L.bounds(
            [-24925916.518499706, -11159088.984844638],
            [24925916.518499706, 11159088.984844638]
         );

         // The polar projection
         let crs = new L.Proj.CRS('EPSG:3031', '+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs', {
            resolutions: resolutions,
            origin: [-30636100, 30636100],
            bounds
         });
         crs.distance = L.CRS.Earth.distance;
         crs.R = 6378137;
         crs.projection.bounds = bounds;

         let map = this.map = L.map(div, {
            center: [-90, 0],
            zoom: 2,
            maxZoom: 6,
            minZoom: 1,
            crs: crs
         });

         // Initialise bounds hack
         constrainMapToBounds(map, crs, L.point(4194304, -4194304));

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
         }
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

         if (this._promises.length) {
            this._promises.forEach(promise => promise.resolve(map));
         }
         this._promises = [];
      }
   }

   angular.module("antarctic.maps", [])
      .directive("antarcticMaps", ["mapService", function (mapService) {
         return {
            restict: "AE",
            template: "<div id='mappo' style='height: 100%;'></div>",
            link: function (scope) {
               scope.map = mapService.init("mappo");
            }
         };
      }])

      .service("mapService", ['$q', function ($q) {
         let service = new MapService($q);
         return service;
      }]);


   function constrainMapToBounds(map, crs, point) {
      map.on('move', function (e) {
         // Unproject the point for the current zoom level
         var maxPxPoint = map.project(crs.projection.unproject(point));

         // Get the current pixel bounds
         var b = map.getPixelBounds();

         // Do we break any of the pixel bounds constraints
         if (b.min.x < 0 || b.min.y < 0 || b.max.x > maxPxPoint.x || b.max.y > maxPxPoint.y) {
            var x, y;

            // The bounds of the map container
            var elB = document.querySelector('#mappo').getBoundingClientRect();

            if (maxPxPoint.x < elB.width) {
               // Map is smaller than container width
               x = (maxPxPoint.x / 2)
            }
            else if (b.min.x < 0) {
               // Less than min
               x = elB.width / 2
            }
            else if (b.max.x > maxPxPoint.x) {
               // Greater than max
               x = maxPxPoint.x - (elB.width / 2)
            }
            else {
               // Get current
               x = map.project(map.getCenter()).x;
            }

            if (maxPxPoint.y < elB.height) {
               // Map is smaller than container height
               y = (maxPxPoint.y / 2)
            }
            else if (b.min.y < 0) {
               // Less than min
               y = elB.height / 2
            }
            else if (b.max.y > maxPxPoint.y) {
               // Greater than max
               y = maxPxPoint.y - (elB.height / 2)
            }
            else {
               // Get current
               y = map.project(map.getCenter()).y;
            }

            // Reset the map position
            var pos = map.unproject(L.point(x, y));
            map.setView(pos, map.getZoom(), {
               // No animation because we are already scrolling
               animate: false
            });
         }

      });
   }
}