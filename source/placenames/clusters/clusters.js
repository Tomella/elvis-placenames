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
                     properties: {
                        count
                     },
                     geometry: {
                        type: "Point",
                        coordinates: []
                     }
                  },
                     properties = cell.properties,
                     geometry = cell.geometry;

                  geometry.coordinates[0] = this.data.minX + this.dx * (columnIndex + 0.5);
                  geometry.coordinates[1] = this.data.maxY - this.dy * (rowIndex + 0.5);

                  this.cells.push(cell);
               });
            }
         });
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
                     if ( self.layer) {
                        self.flasher  = flashService.add("Loading clusters", null, true);
                        self.map.removeLayer( self.layer);
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

            if ( this.layer) {
               this.map.removeLayer( this.layer);
            }
            if (count > 40000) {
               options.iconCreateFunction = function (cluster) {
                  let childCount = cluster.getAllChildMarkers().reduce((sum, value) => sum + value.options.count, 0);
                  let c = ' marker-cluster-';
                  if (childCount < 1000) {
                     c += 'small';
                  } else if (childCount < 5000) {
                     c += 'medium';
                  } else {
                     c += 'large';
                  }
                  return new L.DivIcon({
                     html: '<div><span>' + childCount + '</span></div>',
                     className: 'marker-cluster' + c, iconSize: new L.Point(40, 40)
                  });
               };

               this.layer = L.markerClusterGroup(options);

               let data = response.facet_counts.facet_heatmaps[this.config.countField];
               let worker = new SolrTransformer(data);
               let result = worker.getGeoJson();

               let maxCount = Math.max(...result.features.map(item => item.properties.count));

               worker.cells.forEach(cell => {
                  let count = cell.properties.count;
                  let x = cell.geometry.coordinates[1];
                  let y = cell.geometry.coordinates[0];
                  let xy = [x, y];
                  this.layer.addLayer(L.marker(xy, { count }));
               });
            } else if (count > 2000) {
               let flag = count > 50000;

               this.layer = L.markerClusterGroup(options);

               let data = response.facet_counts.facet_heatmaps[this.config.countField];
               let worker = new SolrTransformer(data);
               let result = worker.getGeoJson();

               let maxCount = Math.max(...result.features.map(item => item.properties.count));

               worker.cells.forEach(cell => {
                  let count = cell.properties.count;
                  let x = cell.geometry.coordinates[1];
                  let y = cell.geometry.coordinates[0];
                  let xy = [x, y];
                  for (let i = 0; i < count; i++) {
                     this.layer.addLayer(L.marker(xy));
                  }
               });
            } else {
               let layer = this.layer = L.markerClusterGroup({
                  disableClusteringAtZoom: count > 600 ? 12 : 4
               });
               let params = Object.assign({}, response.responseHeader.params);
               params.rows = count;

               let url = "select?fl=location,name&" + Object.keys(params).filter(key => key.indexOf("facet") !== 0).map(key => key + "=" + params[key]).join("&");
               $http.get(url).then(result => {
                  let docs = result.data.response.docs;
                  docs.forEach(doc => {
                     let coords = doc.location.split(" ");
                     doc.title = doc.name;
                     layer.addLayer(L.marker([+coords[1], +coords[0]], doc));
                  });
               });

            }
            if(this.flasher) {
               this.flasher.remove();
            }
            this.layer.addTo(this.map);
         };

         return service;
      }]);
}
