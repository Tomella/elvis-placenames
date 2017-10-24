{
   angular.module("placenames.search", ['placenames.filters', 'placenames.authorities'])

      .directive('placenamesClear', ['placenamesSearchService', function (placenamesSearchService) {
         return {
            link: function (scope, element) {
               placenamesSearchService.onMapUpdate(listening);
               function listening() {
                  if (element.is(":focus")) {
                     var e = $.Event("keydown");
                     e.which = 27; // # Some key code value
                     element.trigger(e);
                     element.blur();
                  }
               }
            }
         };
      }])

      .directive('placenamesSearchFilters', ["groupsService", "placenamesSearchService", function (groupsService, placenamesSearchService) {
         const groupMatch = {
            group: "groups",
            category: "categories",
            feature: "features"
         };

         return {
            templateUrl: "placenames/search/searchfilters.html",
            link: function (scope) {
               scope.summary = placenamesSearchService.summary;
               scope.data = placenamesSearchService.data;
               groupsService.getAll().then(data => {
                  if (scope.data.filterBy) {
                     let type = groupMatch[scope.data.filterBy];
                     scope.filters = data[type].filter(item => item.selected).map(item => item.name).join(", ");
                     if (scope.filters.length) {
                        scope.type = type;
                     }
                  }
                  scope.authorities = data.authorities.filter(authority => authority.selected).map(authority => authority.code).join(", ");
               });
            }
         };
      }])

      .directive('placenamesOptions', ['placenamesSearchService', function (placenamesSearchService) {
         return {
            link: function (scope) {
               scope.leave = function () {
                  placenamesSearchService.hide();
               };

               scope.enter = function () {
                  placenamesSearchService.show(scope.match.model);
               };

               scope.$destroy = function () {
                  placenamesSearchService.hide();
               };
            }
         };
      }])

      .directive("placenamesQuickSearch", ['$rootScope', '$timeout', 'groupsService', 'placenamesSearchService',
         function ($rootScope, $timeout, groupsService, placenamesSearchService) {
            return {
               templateUrl: 'placenames/search/quicksearch.html',
               restrict: 'AE',
               link: function (scope) {
                  scope.state = placenamesSearchService.data;

                  scope.loadDocs = function () {
                     return placenamesSearchService.filtered().then(fetched => {
                        return fetched.response.docs;
                     });
                  };

                  scope.clear = function () {
                     scope.state.searched = null;
                     $timeout(() => {
                        $rootScope.$broadcast("clear.button.fired");
                     }, 10);
                  };

                  scope.search = function search(item) {
                     scope.showFilters = false;
                     placenamesSearchService.search(item);
                     $timeout(() => {
                        $rootScope.$broadcast("search.button.fired");
                     }, 100);
                  };
               }
            };
         }
      ])

      .directive("placenamesSearch", ['$timeout', 'groupsService', 'placenamesSearchService',
         function ($timeout, groupsService, placenamesSearchService) {
            return {
               templateUrl: 'placenames/search/search.html',
               restrict: 'AE',
               link: function (scope) {
                  scope.state = placenamesSearchService.data;
                  scope.status = {};

                  scope.$watch("state.searched", function (newVal, oldVal) {
                     if (!newVal && oldVal) {
                        placenamesSearchService.filtered();
                     }
                  });

                  placenamesSearchService.filtered();
                  scope.update = function () {
                     placenamesSearchService.filtered();
                  };

                  scope.loadOnEmpty = function () {
                     if (!scope.state.filter) {
                        placenamesSearchService.filtered();
                     }
                  };

                  scope.select = function (item) {
                     scope.search(item);
                  };

                  scope.deselect = function (facet) {
                     facet.selected = false;
                     placenamesSearchService.filtered();
                  };

                  scope.$watch("status.groupOpen", function (load) {
                     if (load) {
                        console.log("Update filter", load);
                        scope.state.filterBy = "group";
                        placenamesSearchService.filtered();
                     }
                  });

                  scope.$watch("status.catOpen", function (load) {
                     if (load) {
                        console.log("Update filter", load);
                        scope.state.filterBy = "category";
                        placenamesSearchService.filtered();
                     }
                  });

                  scope.$watch("status.featureOpen", function (load) {
                     if (load) {
                        console.log("Update filter", load);
                        scope.state.filterBy = "feature";
                        placenamesSearchService.filtered();
                     }
                  });
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
            var buffer = "<div style='text-align:left'>";
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
      }])

      .factory('placenamesSearchService', SearchService);

   SearchService.$inject = ['$http', '$rootScope', '$timeout', 'configService', 'groupsService', 'mapService'];
}

function SearchService($http, $rootScope, $timeout, configService, groupsService, mapService) {
   var data = {
      searched: null // Search results
   };
   var summary = {};
   var mapListeners = [];

   var results;
   var marker;

   var service = {

      onMapUpdate(listener) {
         mapListeners.push(listener);
      },

      offMapUpdate(listener) {
         delete mapListeners[listener];
      },

      get data() {
         return data;
      },

      get summary() {
         return summary;
      },

      filtered() {
         return filtered().then(response => {
            data.filtered = response;
            return response;
         });
      },

      request(params) {
         return request(params);
      },

      search(item) {
         if (item) {
            select(item.recordId).then(() => this.searched());
         } else {
            this.searched();
         }
      },

      persist(params, response) {
         data.persist = {
            params,
            data: response
         };
         return mapService.getMap().then(map => data.persist.bounds = map.getBounds());
      },

      searched() {
         data.searched = data.persist;
         this.hide();
      },

      show(what) {
         this.hide().then(map => {
            // split lng/lat string seperated by space, reverse to lat/lng, cooerce to numbers
            var location = what.location.split(" ").reverse().map(str => +str);
            marker = L.popup()
               .setLatLng(location)
               .setContent(what.name + "<br/>Lat/Lng: " +
               location[0] + "&deg;" +
               location[1] + "&deg;")
               .openOn(map);
         });
      },

      hide(what) {
         return mapService.getMap().then(map => {
            if (marker) {
               map.removeLayer(marker);
            }
            return map;
         });
      }
   };

   mapService.getMap().then(map => {
      var timeout;
      var facets = {
         facet: true,
         "facet.field": "feature"
      };

      map.on('resize moveend viewreset', update);

      function update() {
         $timeout.cancel(timeout);
         if (!data.searched) {
            timeout = $timeout(function () {
               service.filtered();
            }, 200);
            mapListeners.forEach(listener => {
               listener();
            });
         }
      }
   });

   // We replace the search parameters like filters with a unique record ID.
   function select(recordId) {
      return createParams().then(params => {
         params.q = "recordId:" + recordId;
         return run(params).then(response => {
            return service.persist(params, response).then(function () {
               $rootScope.$broadcast('pn.search.complete', response);
               return response;
            });
         });
      });
   }

   function filtered() {
      return createParams().then(params => {
         return run(params).then(response => {
            return service.persist(params, response).then(function () {
               $rootScope.$broadcast('pn.search.complete', response);
               return response;
            });
         });
      });
   }

   function createSummary() {
      return mapService.getMap().then(map => {
         return groupsService.getAll().then(response => {
            var filterIsObject = typeof data.filter === "object";
            var summary = service.summary;
            summary.filter = filterIsObject ? data.filter.name : data.filter;
            summary.bounds = map.getBounds();
            summary.filterBy = data.filterBy;
            summary.authorities = response.authorities.filter(auth => auth.selected);

            let current = [];
            switch (data.filterBy) {
               case "group":
                  current = response.groups.filter(group => group.selected);
                  break;
               case "feature":
                  current = response.features.filter(feature => feature.selected);
                  break;
               case "category":
                  current = response.categories.filter(category => category.selected);
            }
            summary.current = current;
            return summary;
         });
      });
   }

   function createParams() {
      return createSummary().then(summary => {
         let params = baseParameters();
         let q = summary.filter;
         let bounds = summary.bounds;

         params.fq = getBounds(bounds);
         params["facet.heatmap.geom"] = getHeatmapBounds(bounds);
         params.sort = getSort(bounds);
         params.q = q ? '*' + q.toLowerCase() : "*:*";


         let qs = summary.current.map(item => summary.filterBy + ':"' + item.name + '"');
         let qas = summary.authorities.map(auth => 'authority:' + auth.code);

         if (qas.length) {
            params.q += ' AND (' + qas.join(" ") + ')';
         }

         if (qs.length) {
            params.q += ' AND (' + qs.join(" ") + ')';
         }
         return params;
      });
   }

   function run(params) {
      return request(params).then(data => {
         var code;
         data.facetCounts = {};
         $rootScope.$broadcast("pn.facets.changed", data.facet_counts.facet_fields);

         return data;
      });
   }

   function request(params) {
      return $http({
         url: "/select?",
         method: "GET",
         params,
         cache: true
      }).then(response => {
         return response.data;
      });
   }

   function getSort(bounds) {
      var dx = (bounds.getEast() - bounds.getWest()) / 2;
      var dy = (bounds.getNorth() - bounds.getSouth()) / 2;
      return "geodist(ll," +
         (bounds.getSouth() + dy) +
         "," +
         (bounds.getWest() + dx) +
         ") asc";
   }

   function getBounds(bounds) {
      return "location:[" +
         Math.max(bounds.getSouth(), -90) + "," +
         Math.max(bounds.getWest(), -180) + " TO " +
         Math.min(bounds.getNorth(), 90) + "," +
         Math.min(bounds.getEast(), 180) + "]";
   }


   function getHeatmapBounds(bounds) {
      return "[" +
         Math.max(bounds.getSouth(), -90) + "," +
         Math.max(bounds.getWest(), -180) + " TO " +
         Math.min(bounds.getNorth(), 90) + "," +
         Math.min(bounds.getEast(), 180) + "]";
   }

   function baseParameters() {
      return {
         "facet.heatmap.format": "ints2D",
         "facet.heatmap": "location",
         facet: true,
         "facet.field": ["feature", "category", "authority"],
         rows: 50,
         wt: "json"
      };
   }

   return service;

   function baseFacetParameters() {
      var params = baseParameters();
      params.rows = 0;
   }
}

