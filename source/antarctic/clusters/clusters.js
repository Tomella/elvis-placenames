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
               layer: null,
               cellSizes: [24, 19, 12, 9, 5, 2.5, 1.2, 1, 1, 1]
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

            // Stage one
            service._refreshClusters = function (response) {
               let count = response.response.numFound;

               let params = Object.assign({}, response.responseHeader.params);

               if (!this.lookup) {
                  let url = "select?q=*:*&fq=xPolar:*&rows=10000&wt=json&" +
                     "fl=location,recordId,authorityId,name,feature,category,group,authority,supplyDate,xPolar,yPolar";
                  $http.get(url).then(({ data }) => {
                     this.lookup = new PolarLookUp();
                     this.lookup.addPoints(data.response.docs);

                     _refreshAfterLookup(this);
                  });
               } else {
                  _refreshAfterLookup(this);
               }

               // Stage 2
               function _refreshAfterLookup(scope) {

                  mapService.getMap().then(map => {
                     // The filter is a bit tricky and only applicable here because the polar coordinates are in an array.
                     let params = {
                        q: response.responseHeader.params.q,
                        fl: "recordId",
                        rows: 10000,
                        fq: getBounds(map, response.restrict),
                        wt: "json"
                     };

                     $http({
                        url: "/select?",
                        method: "GET",
                        params,
                        cache: false
                     }).then(({ data }) => {
                        if (scope.layer) {
                           map.removeLayer(scope.layer);
                        }

                        let docs = data.response.docs;
                        let zoom = map.getZoom();
                        let cellSize = (service.config.cellSizes ? service.config.cellSizes : service.cellSizes)[zoom] * 100000; // Tuned to suit the spacing of clusters on the map
                        let count = docs.length;
                        let features = scope.lookup.find(docs.map(doc => doc.recordId));

                        if (features.length > 600) {
                           let polarGrid = new PolarGrid({ cellWidth: cellSize, cellHeight: cellSize });
                           polarGrid.addPoints(features);

                           let max = Math.max(...polarGrid.cells.map(cell => cell.length));

                           scope.layer = L.layerGroup(polarGrid.cells.map(cell => {
                              let template = '<div class="leaflet-marker-icon marker-cluster marker-cluster-{size} leaflet-zoom-animated leaflet-interactive" ' +
                                 'tabindex="0" style="transform: translate3d(-8px, -8px, 0px);">' +
                                 '<div style="transform: translate3d(-2px, -2px, 0px);"><span>{value}</span></div></div>';

                              let size = "small";
                              if (cell.length > max * 0.8) {
                                 size = "large";
                              } else if (cell.length > max * 0.4) {
                                 size = "medium";
                              }

                              template = template.replace("{size}", size).replace("{value}", cell.length);
                              return L.marker(cell.weightedLatLng, { icon: L.divIcon({ html: template }) }).on('click', () => {
                                 map.setZoomAround(cell.weightedLatLng, map.getZoom() + 1);
                              });
                           })).addTo(map);

                        } else {
                           let layer = scope.layer = L.layerGroup();

                           features.forEach(feature => {
                              let popup = ["<table class='cluster-table'>"];
                              let doc = feature.data;
                              let coords = doc.location.split(" ");
                              let latLng = feature.latLng;
                              let date = new Date(doc.supplyDate);
                              let dateStr = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
                              let wasclicked = false;


                              popup.push("<tr><th>Name </th><td>" + doc.name + "</td></tr>");
                              popup.push("<tr><th>Feature type </th><td>" + doc.feature + "</td></tr>");
                              popup.push("<tr><th>Category </th><td>" + doc.category + "</td></tr>");
                              popup.push("<tr><th>Authority </th><td>" + doc.authority + "</td></tr>");
                              popup.push("<tr><th>Supply date</th><td>" + dateStr + "</td></tr>");
                              popup.push("<tr><th>Lat / Lng</th><td>" + coords[1] + "° / " + coords[0] + "°</td></tr>");


                              doc.zIndexOffset = 500;
                              doc.icon = declusteredIcon;

                              let marker;
                              if (features.length > 50) {
                                 marker = L.marker(latLng, doc);
                              } else {
                                 doc.radius = 2;
                                 marker = L.circleMarker(latLng, doc);
                                 layer.addLayer(marker);
                                 marker = L.marker(latLng,
                                    { icon: L.divIcon({ html: "<div class='cluster-icon'><div class='ellipsis'>" + doc.name + "</div></div>" }) });
                              }

                              popup.push("</table>");
                              marker.bindPopup(popup.join(""));
                              marker.on("mouseover", function () {
                                 this.openPopup();
                              });
                              marker.on('mouseout', function (e) {
                                 if(!wasclicked) {
                                    this.closePopup();
                                 }
                              });
                              marker.on('click', function (e) {
                                 wasclicked = true;
                                 this.openPopup();
                              });

                              marker.on('popupclose', function (e) {
                                 wasclicked = false;
                              });

                              layer.addLayer(marker);
                           });
                           layer.addTo(map);
                        }

                        if (scope.flasher) {
                           scope.flasher.remove();
                        }
                     });
                  });
               }
            };

            return service;
         }]);
}