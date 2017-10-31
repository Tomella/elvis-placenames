{

   class MapService {
      constructor() {

         let EPSG3031 = new L.Proj.CRS(
            "EPSG:3031",
            "+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 +x_0=0 +y_0=0 " +
            "+ellps=WGS84 +datum=WGS84 +units=m +no_defs", {
               origin: [-4194304, 4194304],
               resolutions: [
                  8192.0,
                  4096.0,
                  2048.0,
                  1024.0,
                  512.0,
                  256.0
               ],
               bounds: [
                  [-4194304, -4194304],
                  [4194304, 4194304]
               ]
            }
         );

         let map = this.map = L.map("mappo", {
            center: [-90, 0],
            zoom: 0,
            maxZoom: 5,
            crs: EPSG3031
         });

         let template =
            "//map1{s}.vis.earthdata.nasa.gov/wmts-antarctic/" +
            "{layer}/default/{time}/{tileMatrixSet}/{z}/{y}/{x}.jpg";

         let layer = this.layer = L.tileLayer(template, {
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
         });

         // HACK: BEGIN
         // Leaflet does not yet handle these kind of projections nicely. Monkey
         // patch the getTileUrl function to ensure requests are within
         // tile matrix set boundaries.
         var superGetTileUrl = layer.getTileUrl;

         layer.getTileUrl = function (coords) {
            var max = Math.pow(2, layer._getZoomForUrl() + 1);
            if (coords.x < 0) { return ""; }
            if (coords.y < 0) { return ""; }
            if (coords.x >= max) { return ""; }
            if (coords.y >= max) { return ""; }
            return superGetTileUrl.call(layer, coords);
         };
         // HACK: END


         map.addLayer(layer);
         for(let i = -180; i < 181; i +=10) {
            L.marker([-81 + (i / 20), i]).addTo(map);
         }

         L.marker([-90, 0]).addTo(map);
         L.marker([-88, 0]).addTo(map);

         L.marker([-80, 0]).addTo(map);
         L.marker([-78, 0]).addTo(map);

         L.marker([-70, 0]).addTo(map);
         L.marker([-68, 0]).addTo(map);

         L.marker([-90, -90]).addTo(map);
         L.marker([-88, -88]).addTo(map);

         L.marker([-80, -90]).addTo(map);
         L.marker([-78, -88]).addTo(map);

         L.marker([-70, -90]).addTo(map);
         L.marker([-68, -88]).addTo(map);
      }
   }

   angular.module("antarctic.maps", [])


      .service("mapService", [function () {
         let service = new MapService();
      }]);

}