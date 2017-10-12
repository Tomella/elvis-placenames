class SolrTransformer {
   constructor(data) {
      if (data) {
         let response = {};

         let lastField = null;
         data.forEach(function (element, idx) {
            if (idx % 2) {
               response[lastField] = element;
            } else {
               lastField = element;
            }
         });

         this.data = response;
         this.dx = (response.maxX - response.minX) / response.columns;
         this.dy = (response.maxY - response.minY) / response.rows;

         this.cells = [];
         response.counts_ints2D.forEach((row, rowIndex) => {
            if (row) {
               row.forEach((count, columnIndex) => {
                  if (!count) {
                     return;
                  }

                  let cell = {
                     type: "Feature",
                     properties: {},
                     geometry: {
                        type: "Point",
                        coordinates: []
                     }
                  },
                     properties = cell.properties,
                     geometry = cell.geometry;

                  properties.count = count;

                  geometry.coordinates[0] = this.data.minX + this.dx * (columnIndex + 0.5);
                  geometry.coordinates[1] = this.data.maxY - this.dy * (rowIndex + 0.5);

                  this.cells.push(cell);
               });
            }
         })
      }
   }

   getGeoJson() {
      return {
         type: "FeatureCollection",
         features: this.cells
      };
   }
}

{
   angular.module("placenames.clusters", [])

      .directive("placenamesClusters", ["placenamesClusterService", function (placenamesClusterService) {
         return {
            link: function () {
               placenamesClusterService.init();
            }
         };
      }])

      .factory("placenamesClusterService",
      ["$http", "$rootScope", "configService", "mapService", function ($http, $rootScope, configService, mapService) {
         let service = {
            showClusters: true,
            sequence: 0,
            layer: null
         };

         service.init = function () {
            configService.getConfig("clusters").then(config => {
               mapService.getMap().then(map => {
                  console.log("Now we have the map", map);
                  this.map = map;
                  this.config = config;

                  console.log(mapService.getGroup("clusters"));
                  let self = this;
                  $rootScope.$on('pn.search.complete', movePan);

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

            let count = response.response.numFound;

            if (this.layer) {
               this.map.removeLayer(this.layer);
            }


            if (count > 2000) {
               this.layer = L.markerClusterGroup({
                  showCoverageOnHover: false,
                  zoomToBoundsOnClick: false,
                  singleMarkerMode: true
               });

               let data = response.facet_counts.facet_heatmaps[this.config.countField];
               let worker = new SolrTransformer(data);
               let result = worker.getGeoJson();

               let maxCount = d3.max(result.features, function (item) {
                  return item.properties.count;
               });

               worker.cells.forEach(cell => {
                  let count = cell.properties.count;
                  for (let i = 0; i < count; i++) {
                     this.layer.addLayer(L.marker([cell.geometry.coordinates[1], cell.geometry.coordinates[0]]));
                  }
               });
            } else {
               this.layer = L.markerClusterGroup({
                  disableClusteringAtZoom: count > 1000 ? 12 : 10
               });
               let params = Object.assign({}, response.responseHeader.params);
               params.rows = count;

               let url = "select?fl=location,name&" + Object.keys(params).filter(key => key.indexOf("facet") !== 0).map(key => key + "=" + params[key]).join("&");
               $http.get(url).then(result => {
                  let docs = result.data.response.docs;
                  docs.forEach( doc => {
                     let coords = doc.location.split(" ");
                     doc.title = doc.name;
                     this.layer.addLayer(L.marker([+coords[1], +coords[0]], doc));
                  });
               });

            }

            this.layer.addTo(this.map);
         }

         return service;
      }]);
}