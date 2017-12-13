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
            const HIGHWATER_MARK = 40000;
            const MIDWATER_MARK = 600;
            const LOWWATER_MARK = 50;

            let service = {
               sequence: 0,
               layer: null,
               timeout: null
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
                           self.flasher = flashService.add("Loading features", null, true);
                           self.map.removeLayer(self.layer);
                           self.layer = null;
                        }
                     }

                     function movePan(event, data) {
                        if (service.timeout) {
                           clearTimeout(service.timeout);
                        }
                        service.timeout = setTimeout(() => {
                           self._refreshClusters(data);
                        }, 10);
                     }
                  });
               });
            };

            service._refreshClusters = function (response) {
               if (response.restrict && response.response.numFound > MIDWATER_MARK) {
                  clearTimeout(service.debounce);
                  service.debounce = setTimeout(() => {

                     let params = Object.assign(
                        {},
                        response.responseHeader.params,
                        {
                           rows: MIDWATER_MARK,
                           fq: getBounds(map.getBounds(), response.restrict)
                        });

                     return $http({
                        url: "/select?",
                        params,
                        method: "get"
                     }).then(result => {
                        service._refreshClusters2(result.data);
                     });

                  }, 200);
               } else {
                  return service._refreshClusters2(response);
               }
            };

            service._refreshClusters2 = function (response) {

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
                  zoomToBoundsOnClick: true,
                  singleMarkerMode: true,
                  animate: false
               };

               // We use this to know when to bail out on slow service calls
               service.sequence++;
               let mySequence = service.sequence;

               let count = response.response.numFound;

               if (this.layer) {
                  this.map.removeLayer(this.layer);
               }
               if (count > HIGHWATER_MARK) {
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
                        html: '<div><span>' + Number(childCount).toLocaleString() + '</span></div>',
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
                     let marker = L.marker(xy, { count });
                     this.layer.addLayer(marker);
                  });
                  if (this.flasher) {
                     this.flasher.remove();
                  }
                  this.layer.addTo(this.map);
               } else if (count > MIDWATER_MARK) {
                  options.iconCreateFunction = function (cluster) {
                     var childCount = cluster.getChildCount();

                     var c = ' marker-cluster-';
                     if (childCount < 10) {
                        c += 'small';
                     } else if (childCount < 100) {
                        c += 'medium';
                     } else {
                        c += 'large';
                     }

                     return new L.DivIcon({
                        html: '<div><span>' + Number(childCount).toLocaleString() + '</span></div>', className: 'marker-cluster' + c,
                        iconSize: new L.Point(40, 40)
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
                     for (let i = 0; i < count; i++) {
                        this.layer.addLayer(L.marker(xy));
                     }
                  });
                  if (this.flasher) {
                     this.flasher.remove();
                  }
                  this.layer.addTo(this.map);
               } else {
                  let params = {
                     q: response.responseHeader.params.q,
                     sort: response.responseHeader.params.sort,
                     rows: count,
                     fq: getBounds(map.getBounds(), response.restrict),
                     wt: "json"
                  };

                  $http({
                     url: "/select?",
                     params,
                     method: "get"
                  }).then(result => {
                     if (mySequence !== service.sequence) {
                        console.log("Bailing out as another post has started since this one started");
                        return;
                     }
                     let layer = this.layer = L.layerGroup();

                     let docs = result.data.response.docs;
                     docs.forEach(doc => {
                        let popup = ["<table class='cluster-table'>"];
                        let coords = doc.location.split(" ");
                        let date = new Date(doc.supplyDate);
                        let dateStr = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();

                        popup.push("<tr><th>Name </th><td>" + doc.name + "</td></tr>");
                        popup.push("<tr><th>Feature type </th><td>" + doc.feature + "</td></tr>");
                        popup.push("<tr><th>Category </th><td>" + doc.category + "</td></tr>");
                        popup.push("<tr><th>Authority </th><td>" + doc.authority + "</td></tr>");
                        popup.push("<tr><th>Supply date</th><td>" + dateStr + "</td></tr>");
                        popup.push("<tr><th>Lat / Lng</th><td>" + coords[1] + "° / " + coords[0] + "°</td></tr>");

                        doc.icon = declusteredIcon;

                        let marker;
                        if (docs.length > LOWWATER_MARK) {
                           marker = L.marker([+coords[1], +coords[0]], doc);
                        } else {
                           doc.radius = 2;
                           marker = L.circleMarker([+coords[1], +coords[0]], doc);
                           layer.addLayer(marker);
                           marker = L.marker([+coords[1], +coords[0]],
                              { icon: L.divIcon({ html: "<div class='cluster-icon'><div class='ellipsis'>" + doc.name + "</div></div>" }) });
                        }

                        popup.push("</table>")
                        marker.bindPopup(popup.join(""));
                        marker.on("mouseover", function() {
                           this.openPopup();
                        });
                        marker.on('mouseout', function (e) {
                           this.closePopup();
                        });
                        layer.addLayer(marker);
                     });
                     try {
                        layer.addTo(this.map);
                     } catch (e) {
                        console.log("What the ");
                     } finally {
                        if (this.flasher) {
                           this.flasher.remove();
                        }
                     }
                  });
               }
            };

            return service;
         }]);
}
