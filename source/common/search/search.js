{
   angular.module("placenames.search", ['placenames.authorities', 'placenames.groups'])

      .directive('placenamesClear', ['searchService', function (searchService) {
         return {
            link: function (scope, element) {
               searchService.onMapUpdate(listening);
               function listening() {
                  if (element.is(":focus")) {
                     let e = $.Event("keydown");
                     e.which = 27; // # Some key code value
                     element.trigger(e);
                     element.blur();
                  }
               }
            }
         };
      }])

      .directive('placenamesOnEnter', function () {
         return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
               if (event.which === 13) {
                  scope.$apply(function () {
                     scope.$eval(attrs.placenamesOnEnter);
                  });

                  event.preventDefault();
               }
            });
         };
      })

      .directive('placenamesSearchFilters', ["searchService", function (searchService) {
         const groupMatch = {
            group: "groups",
            category: "categories",
            feature: "features"
         };

         return {
            templateUrl: "/search/searchfilters.html",
            link: function (scope) {
               scope.summary = searchService.summary;
               scope.data = searchService.data;
            }
         };
      }])

      .directive('placenamesOptions', ['searchService', function (searchService) {
         return {
            link: function (scope) {
               scope.leave = function () {
                  searchService.hide();
               };

               scope.enter = function () {
                  searchService.show(scope.match.model);
               };

               scope.$destroy = function () {
                  searchService.hide();
               };
            }
         };
      }])

      .directive("placenamesQuickSearch", ['$document', '$rootScope', '$timeout', 'groupsService', 'searchService',
         function ($document, $rootScope, $timeout, groupsService, searchService) {
            return {
               templateUrl: '/search/quicksearch.html',
               restrict: 'AE',
               link: function (scope, element) {
                  scope.state = searchService.data;

                  scope.erase = () => {
                     scope.state.filter = "";
                     searchService.filtered();
                  };

                  $document.on('keyup', function keyupHandler(keyEvent) {
                     if (keyEvent.which === 27) {
                        keyEvent.stopPropagation();
                        keyEvent.preventDefault();
                        scope.$apply(function () {
                           scope.showFilters = false;
                        });
                     }
                  });

                  scope.loadDocs = function () {
                     return searchService.filtered().then(fetched => {
                        return fetched.response.docs;
                     });
                  };

                  scope.clear = function () {
                     scope.state.searched = null;
                     $timeout(() => {
                        $rootScope.$broadcast("clear.button.fired");
                     }, 10);
                  };

                  scope.select = function (item) {
                     scope.search(item);
                  };

                  scope.search = function search(item) {
                     scope.showFilters = false;
                     searchService.search(item);
                     $timeout(() => {
                        $rootScope.$broadcast("search.button.fired");
                     }, 100);
                  };
               }
            };
         }
      ])

      .directive("placenamesSearch", ['$timeout', 'groupsService', 'searchService',
         function ($timeout, groupsService, searchService) {
            return {
               templateUrl: '/search/search.html',
               restrict: 'AE',
               link: function (scope) {
                  scope.state = searchService.data;
                  scope.status = {};

                  scope.$watch("state.searched", function (newVal, oldVal) {
                     if (!newVal && oldVal) {
                        searchService.filtered();
                     }
                  });

                  searchService.filtered();
                  scope.update = function () {
                     searchService.filtered();
                  };

                  scope.loadOnEmpty = function () {
                     if (!scope.state.filter) {
                        searchService.filtered();
                     }
                  };

                  scope.deselect = function (facet) {
                     facet.selected = false;
                     searchService.filtered();
                  };
               }
            };
         }])

      .filter('placenamesDocName', [function () {
         return function (docs) {
            return docs ? docs.map(doc => doc.name + " (" + doc.authorityId + ")") : [];
         };
      }])

      .filter('placenamesSomeSelected', [function () {
         return function (facets) {
            return facets ? Object.keys(facets).some(key => facets[key].selected) : false;
         };
      }])

      .filter('placenamesUnselectedFacets', [function () {
         return function (facets) {
            return !facets ? [] : facets.filter(facet => !facet.selected);
         };
      }])

      .filter('placenamesSelectedFacets', [function () {
         return function (facets) {
            return !facets ? [] : facets.filter(facet => facet.selected);
         };
      }])

      .filter('placenamesClean', [function () {
         return function (str) {
            return str.replace(/\s?[, ]\s?/g, " ");
         };
      }])

      .filter('placenamesTooltip', [function () {
         return function (model) {
            let buffer = "<div style='text-align:left'>";
            if (model.variant) {
               let variants = model.variant.split("|");
               variants.forEach((name, index) => {
                  buffer += index ? "" : "Also known as";
                  buffer += (index && index < variants.length - 1 ? "," : "") + " ";
                  if (index && index === variants.length - 1) {
                     buffer += "or ";
                  }
                  buffer += name;
               });
               buffer += "<br/>";
            }
            buffer += "Lat " + model.location.split(" ").reverse().join("&deg; Lng ") + "&deg;<br/>Feature type: " +
               model.feature + "</div>";

            return buffer;
         };
      }]);
}