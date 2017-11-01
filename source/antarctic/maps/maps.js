{

   class MapService {
      constructor() {

         // Map resolutions that NASA GIBS specify
         let resolutions = [
            67733.46880027094, 33866.73440013547, 16933.367200067736, 8466.683600033868, 4233.341800016934, 2116.670900008467, 1058.3354500042335
         ];


         let bounds = L.bounds(
            [-24925916.518499706, -11159088.984844638],
            [24925916.518499706, 11159088.984844638]
         );

         // The polar projection
         let EPSG3031 = new L.Proj.CRS('EPSG:3031', '+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs', {
            resolutions: resolutions,
            origin: [-30636100, 30636100],
            bounds
         });

         EPSG3031.projection.bounds = bounds;

         let map = this.map = L.map("mappo", {
            center: [-90, 0],
            zoom: 2,
            maxZoom: 8,
            minZoom: 1,
            crs: EPSG3031
         });

         let template =
            "//map1{s}.vis.earthdata.nasa.gov/wmts-antarctic/" +
            "{layer}/default/{time}/{tileMatrixSet}/{z}/{y}/{x}.jpg";

         let options = {
            layer: "MODIS_Aqua_CorrectedReflectance_TrueColor",
            tileMatrixSet: "EPSG3031_250m",
            format: "image%2Fjpeg",
            time: "2013-12-01",
            tileSize: 512,
            subdomains: "abc",
            noWrap: true,
            continuousWorld: true,
            attribution:
            "<a href='https://wiki.earthdata.nasa.gov/display/GIBS'>" +
            "NASA EOSDIS GIBS</a>"
         };

         template = "https://tiles{s}.arcgis.com/tiles/wfNKYeHsOyaFyPw3/arcgis/rest/services/" +
            "Antarctic_Hillshade_and_Bathymetric_Base_Map_SSP/MapServer/tile/{z}/{y}/{x}";
         options = {
            layer: "MODIS_Aqua_CorrectedReflectance_TrueColor",
            format: "image%2Fpng",
            tileSize: 256,
            subdomains: "1234",
            noWrap: true,
            continuousWorld: true,
            attribution:
            "<a href='.'>" +
            "Geoscience Australia</a>"
         };

         let layer = this.layer = L.tileLayer(template, options);

         // HACK: BEGIN
         // Leaflet does not yet handle these kind of projections nicely. Monkey
         // patch the getTileUrl function to ensure requests are within
         // tile matrix set boundaries.
         var superGetTileUrl = layer.getTileUrl;

         layer.getTileUrl = function (coords) {
            var max = Math.pow(2, layer._getZoomForUrl() + 2);
            if (coords.x < 0) { return ""; }
            if (coords.y < 0) { return ""; }
            if (coords.x >= max) { return ""; }
            if (coords.y >= max) { return ""; }
            return superGetTileUrl.call(layer, coords);
         };
         // HACK: END


         map.addLayer(layer);

         // Module which adds graticule (lat/lng lines)
         // L.graticule().addTo(map);

         L.control.scale({ imperial: false }).addTo(map);
         /*
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
         */


         /*
         for (let i = -180; i < 181; i += 10) {
            L.marker([-81 + (i / 20), i]).addTo(map);
         }
         */

         L.marker([-90, 90]).addTo(map);
         L.marker([-88, 88]).addTo(map);

         L.marker([-80, 90]).addTo(map);
         L.marker([-78, 88]).addTo(map);

         L.marker([-70, 90]).addTo(map);
         L.marker([-68, 88]).addTo(map);
      }
   }

   angular.module("antarctic.maps", [])


      .service("mapService", [function () {
         let service = new MapService();
      }]);

}