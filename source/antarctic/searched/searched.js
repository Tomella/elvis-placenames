{
   angular.module("antarctic.searched", ["antarctic.feature", 'placenames.download'])
      .directive('antarcticSearched', ['$rootScope', 'searchService', function ($rootScope, searchService) {
         return {
            restrict: "AE",
            templateUrl: "searched/searched.html",
            scope: {
               authorities: "="
            },
            link: function (scope) {
               scope.data = searchService.data;
               scope.summary = searchService.summary;

               $rootScope.$on("clear.button.fired", () => {
                  scope.showDownload = false;
               });

               scope.clear = () => {
                  $rootScope.$broadcast("clear.button.fired");
               };
            }
         };
      }])

      .directive("antarcticZoomToAll", ['mapService', function (mapService) {
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

      .directive("antarcticSearchedSummary", [function () {
         return {
            templateUrl: "searched/summary.html",
            scope: {
               state: "="
            }
         };
      }])

      .directive("antarcticSearchedItem", [function () {
         return {
            templateUrl: "searched/item.html",
            scope: {
               authority: "=",
               feature: "="
            }
         };
      }])

      .directive("antarcticSearchedDownload", [function () {
         return {
            template: "<placenames-download data='data' class='searched-download'></placenames-download>",
            scope: {
               data: "="
            }
         };
      }])

      .directive('antarcticJurisdiction', ['searchedService', function (searchedService) {
         return {
            restrict: "AE",
            templateUrl: "searched/jurisdiction.html",
            scope: {
               authority: "=",
               item: "="
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
                  scope.loading = true;
                  searchedService.getPage(scope.authority, scope.features.length).then(({ response }) => {
                     scope.loading = false;
                     scope.features.push(...response.docs);
                  }).catch(() => {
                     scope.loading = false;
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
            },
            scratch: {

            }
         };

         $rootScope.$on('pn.search.complete', (event, response) => {
            lastResponse = response;
         });

         $rootScope.$on("search.button.fired", () => {
            service.data.searched = searchService.data.searched;
         });

         $rootScope.$on("clear.button.fired", () => {
            service.scratch = {};
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