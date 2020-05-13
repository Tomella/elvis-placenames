{
   angular.module("placenames.results", ['placenames.results.item', 'placenames.scroll', 'placenames.download'])

      .directive("placenamesZoomToAll", ['mapService', function (mapService) {
         return {
            template: '<button type="button" class="map-tool-toggle-btn" ng-click="zoomToAll()" title="{{text}}">' +
                     '<span class="hidden-sm">{{text}}</span> ' +
                     '<i class="fa fa-lg {{icon}}"></i>' +
                     '</button>',
            scope: {
               center: "=",
               zoom: "=",
               bounds: "=",
               text: "@",
               icon: "@"
            },
            link: function(scope) {
               scope.zoomToAll = function() {
                  mapService.getMap().then(function(map) {
                     if(scope.center && scope.zoom) {
                        map.setView(scope.center, scope.zoom);
                     } else {
                        map.fitBounds(scope.bounds);
                     }
                  });
               };
            }
         };
      }])

      .directive("placenamesResultsSummary", [function () {
         return {
            templateUrl: "/results/summary.html",
            scope: {
               state: "="
            }
         };
      }])

      .directive("placenamesResultsDownload", [function () {
         return {
            template: "<placenames-download data='data'></placenames-download>",
            scope: {
               data: "="
            }
         };
      }])

      .directive("placenamesResults", ['placenamesResultsService', function (placenamesResultsService) {
         return {
            templateUrl: '/results/results.html',
            restrict: "AE",
            bindToController: {
               data: "="
            },
            controller: function () {
               this.clear = function (data) {
                  this.data.searched = null;
               };

               this.more = function () {
                  placenamesResultsService.moreDocs(this.data.persist);
               };

               this.clear = function () {
                  placenamesResultsService.clear(this.data);
               };

               this.download = function () {
                  placenamesResultsService.download(this.data.persist.data.response.docs.map(doc => doc.id));
               };
            },
            controllerAs: "pr",
            link: function (scope) {
               scope.$destroy = function () {
                  placenamesResultsService.hide();
               };
               placenamesResultsService.moreDocs(scope.pr.data.persist);
            }
         };
      }])

      .factory("placenamesResultsService", ResultsService)

      .filter("formatDate", function () {
         return function (dateStr) {
            if (!dateStr) {
               return dateStr;
            }
            let date = new Date(dateStr);
            return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
         };
      })

      .filter("resultsHasSomeData", function () {
         return function (list) {
            return list.some(item => item);
         };
      });

   ResultsService.$inject = ['proxy', '$http', '$rootScope', '$timeout', 'configService', 'mapService', 'searchService'];
}

function ResultsService(proxy, $http, $rootScope, $timeout, configService, mapService, searchService) {
   const ZOOM_IN = 13;
   let marker;

   let service = {
      showPan(what) {
         return this.show(what).then(details => {
            let map = details.map;
            let currentZoom = map.getZoom();

            map.setView(details.location, ZOOM_IN > currentZoom? ZOOM_IN: currentZoom, { animate: true });

            return details;
         });
      },

      clear(data) {
         data.searched = null;
         $timeout(() => {
            $rootScope.$broadcast("clear.button.fired");
         }, 10);
      },

      show(what) {
         return this.hide().then(map => {
            let location = what.location.split(" ").reverse().map(str => +str);
            // split lng/lat string seperated by space, reverse to lat/lng, cooerce to numbers
            marker = L.popup()
               .setLatLng(location)
               .setContent(what.name + "<br/>Lat/Lng: " +
               location[0] + "&deg;" +
               location[1] + "&deg;")
               .openOn(map);

            return {
               location,
               map,
               marker
            };
         });
      },

      download(ids) {
         this.config.then(config => {
            proxy.get(config.esriTemplate.replace("${id}", ids.join(","))).then(data => {
               let blob = new Blob([JSON.stringify(data, null, 3)], { type: "application/json;charset=utf-8" });
               saveAs(blob, "gazetteer-esri-features-" + Date.now() + ".json");
            });
         });
      },

      hide(what) {
         return mapService.getMap().then(map => {
            if (marker) {
               map.removeLayer(marker);
            }
            return map;
         });
      },

      get config() {
         return configService.getConfig().then(config => {
            return config.results;
         });
      },

      moreDocs(persist) {
         if (!persist) {
            return;
         }

         let response = persist.data.response;
         let start = response.docs.length;
         if (start >= response.numFound) {
            return;
         }

         let params = persist.params;
         params.start = start;

         searchService.request(params).then(data => {
            response.docs.push(...data.response.docs);
         });
      }
   };

   return service;
}