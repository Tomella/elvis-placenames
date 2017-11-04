{
   angular.module("antarctic.clusters", [])

      .directive("antarcticClusters", ["clusterService", function (clusterService) {
         return {
            link: function () {
               clusterService.init();
            }
         };
      }])

      .factory("clusterService",
      ["$http", "$rootScope", "configService", "flashService", "mapService",
         function ($http, $rootScope, configService, flashService, mapService) {
            let service = {
               showClusters: true,
               sequence: 0,
               layer: null
            };

            service.init = function () {
               configService.getConfig("clusters").then(config => {
                  mapService.getMap().then(map => {
                     this.map = map;
                     this.config = config;

                     let self = this;
                     $rootScope.$on('pn.search.complete', movePan);
                     $rootScope.$on('pn.search.start', hideClusters);

                     function hideClusters() {
                        if (self.layer) {
                           self.flasher = flashService.add("Loading clusters", null, true);
                           self.map.removeLayer(self.layer);
                           self.layer = null;
                        }
                     }

                     function movePan(event, data) {
                        if (!self.showClusters) {
                           return;
                        }
                        self._refreshClusters(data);
                     }
                  });
               });
            };

            service._refreshClusters = function (response) {

               let geojsonMarkerOptions = {
                  radius: 8,
                  fillColor: "#ff0000",
                  color: "#000",
                  weight: 1,
                  opacity: 1,
                  fillOpacity: 0.8
               };
               let options = {
                  showCoverageOnHover: false,
                  zoomToBoundsOnClick: false,
                  singleMarkerMode: true,
                  animate: false
               };

               let count = response.response.numFound;

               if (this.layer) {
                  this.map.removeLayer(this.layer);
               }

               let layer = this.layer = L.layerGroup();
               let params = Object.assign({}, response.responseHeader.params);
               params.rows = count;

               let url = "select?" + Object.keys(params)
                  .filter(key => key.indexOf("facet") !== 0)
                  .map(key => {
                     let obj = params[key];
                     return (Array.isArray(obj) ? obj : [obj]).map(item => key + "=" + item).join("&");
                  }).join("&");
               $http.get(url).then(result => {
                  let docs = result.data.response.docs;
                  docs.forEach(doc => {
                     let coords = doc.location.split(" ");
                     let date = new Date(doc.supplyDate);
                     let dateStr = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();

                     doc.title = '"' + doc.name + "\"is a " + doc.feature + " feature in the " +
                        doc.category + "\ncategory which is in the " +
                        doc.group + " group." +
                        "\nThe authority is " + doc.authority +
                        " and the data was supplied on " + dateStr +
                        "\nLat / Lng: " + coords[1] + "° / " + coords[0] + "°";

                     doc.zIndexOffset = 500;

                     let marker = L.marker([+coords[1], +coords[0]], doc);
                     layer.addLayer(marker);
                  });
               });

               if (this.flasher) {
                  this.flasher.remove();
               }
               this.layer.addTo(this.map);
            };

            return service;
         }]);
}
