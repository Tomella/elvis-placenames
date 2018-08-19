{
   angular.module("placenames.searched", ["placenames.feature"])
      .directive('placenamesSearched', ['searchService', function (searchService) {
         return {
            restrict: "AE",
            templateUrl: "searched/searched.html",
            scope: {
               authorities: "="
            },
            link: function (scope) {
               scope.data = searchService.data;
               scope.summary = searchService.summary;
            }
         };
      }])

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
            link: function (scope) {
               scope.zoomToAll = function () {
                  mapService.getMap().then(function (map) {
                     if (scope.center && scope.zoom) {
                        map.setView(scope.center, scope.zoom);
                     } else {
                        map.fitBounds(scope.bounds);
                     }
                  });
               };
            }
         };
      }])

      .directive("placenamesSearchedSummary", [function () {
         return {
            templateUrl: "searched/summary.html",
            scope: {
               state: "="
            }
         };
      }])

      .directive("placenamesSearchedDownload", [function () {
         return {
            template: "<placenames-download data='data'></placenames-download>",
            scope: {
               data: "="
            }
         };
      }])

      .directive('placenamesJurisdiction', ['searchedService', function (searchedService) {
         return {
            restrict: "AE",
            templateUrl: "searched/jurisdiction.html",
            scope: {
               authority: "="
            },
            link: function (scope) {
               scope.features = [];

               scope.toggle = () => {
                  scope.showing = !scope.showing;
                  if (scope.showing && !scope.features.length) {
                     scope.loadPage();
                  }
               };

               scope.loadPage = () => {
                  if (scope.features.length >= scope.authority.count) return;

                  searchedService.getPage(scope.authority, scope.features.length).then(({ response }) => {
                     scope.features.push(...response.docs);
                  });
               };
            }
         };
      }])

      .filter("activeAuthorities", function () {
         return (all) => all.filter(item => item.count);
      })

      .factory("searchedService", ['$rootScope', 'searchService', function ($rootScope, searchService) {
         let lastResponse = null;
         let service = {
            data: {
               searched: false
            }
         };

         $rootScope.$on('pn.search.complete', (event, response) => {
            lastResponse = response;
         });

         $rootScope.$on("search.button.fired", () => {
            service.data.searched = searchService.data.searched;
         });

         $rootScope.$on("clear.button.fired", () => {
            delete service.data.searched;
         });

         service.getPage = function (authority, start) {
            console.log("Paging", authority, start);
            return searchService.loadPage(this.data.searched, authority, start);
         };

         return service;

         function toMap(arr) {
            let key = null;
            let response = {};
            arr.forEach((item, index) => {
               if (index % 2 === 0) {
                  key = item;
               } else if (item) {
                  response[key] = item;
               }
            });
            return response;
         }
      }]);
}