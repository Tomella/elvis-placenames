{
   angular.module("antarctic.search", [])


      .factory('searchService', SearchService);

   SearchService.$inject = ['$http', '$rootScope', '$timeout', 'configService', 'groupsService', 'mapService'];
}

function SearchService($http, $rootScope, $timeout, configService, groupsService, mapService) {
   let data = {
      searched: null // Search results
   };

   let countsMapping = {
      group: "groups",
      authority: "authorities",
      feature: "features",
      category: "categories"
   };

   let summary = {};
   let mapListeners = [];

   let results;
   let marker;

   let service = {

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
            let params = response.responseHeader.params;
            filteredAuthorities(params);
            filteredCurrent(params);
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
            let location = what.location.split(" ").reverse().map(str => +str);
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
      let timeout;
      let facets = {
         facet: true,
         "facet.field": "feature"
      };

      map.on('resize moveend viewreset', update);

      function update() {
         $rootScope.$broadcast('pn.search.start');
         $timeout.cancel(timeout);
         if (!data.searched) {
            timeout = $timeout(function () {
               service.filtered();
            }, 20);
            mapListeners.forEach(listener => {
               listener();
            });
         } else {
            $rootScope.$broadcast('pn.search.complete', data.searched.data);
         }
      }
   });

   // We replace the search parameters like filters with a unique record ID.
   function select(recordId) {
      return createParams().then(params => {
         params.q = "recordId:" + recordId;
         return run(params).then(response => {
            return service.persist(params, response).then(function () {
               decorateCounts(response.facet_counts.facet_fields);
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
               decorateCounts(response.facet_counts.facet_fields);
               $rootScope.$broadcast('pn.search.complete', response);
               return response;
            });
         });
      });
   }

   function decorateCounts(facets) {
      groupsService.getAll().then(response => {

         summary.counts = arraysToMap(facets);

         response.authorities.forEach(auth => {
            auth.count = summary.counts.authorities[auth.code];
            auth.count = auth.count ? auth.count : 0;
         });

         ["groups", "features", "categories"].forEach(key => {
            response[key].forEach(item => {
               item.count = summary.counts[key][item.name];
               item.count = item.count ? item.count : 0;
            });
         });
         console.log("TODO apply counts", response);
      });
   }

   function arrayToMap(facets) {
      let lastElement;
      let counts = {};

      facets.forEach((value, index) => {
         if (index % 2) {
            counts[lastElement] = value;
         } else {
            lastElement = value;
         }
      });
      return counts;
   }


   function arraysToMap(facets) {
      let lastElement;
      let counts = {};
      Object.values(countsMapping).forEach(value => {
         counts[value] = {};
      });

      Object.keys(facets).forEach(key => {
         facets[key].forEach((value, index) => {
            if (index % 2) {
               counts[countsMapping[key]][lastElement] = value;
            } else {
               lastElement = value;
            }
         });
      });
      return counts;
   }

   function createSummary() {
      return mapService.getMap().then(map => {
         return groupsService.getAll().then(response => {
            let filterIsObject = typeof data.filter === "object";
            let summary = service.summary;
            summary.filter = filterIsObject ? data.filter.name : data.filter;
            summary.bounds = map.getBounds();
            summary.authorities = response.authorities.filter(auth => auth.selected);
            summary.current = [];
            response.groups.forEach(group => summary.current = summary.current.concat(group.selections()));
            return summary;
         });
      });
   }

   function createParams() {
      return createSummary().then(summary => {
         let params = baseParameters();
         let bounds = summary.bounds;

         params.fq = getBounds(bounds);
         params.sort = getSort(bounds);
         params.q = createQText(summary);

         let qs = createCurrentParams();
         let qas = createAuthorityParams();

         if (qas.length) {
            params.q += ' AND (' + qas.join(" ") + ')';
         }

         if (qs.length) {
            params.q += ' AND (' + qs.join(" ") + ')';
         }
         return params;
      });
   }

   function createQText(summary) {
      let q = summary.filter;
      return q ? '*' + q.toLowerCase() : "*:*";
   }

   function filteredAuthorities(params) {
      return groupsService.getAuthorities().then(authorities => {
         if (summary.authorities && summary.authorities.length) {
            // We need get the facets as though no authorities are selected Select against Solr
            let newParams = authBaseParameters();

            let qs = createCurrentParams();
            if (qs.length) {
               newParams.q += ' AND (' + qs.join(" ") + ')';
            }
            newParams.q = createQText(summary);
            newParams.fq = params.fq;

            return request(newParams).then(data => {
               let countMap = arrayToMap(data.facet_counts.facet_fields.authority);
               authorities.forEach(auth => {
                  auth.allCount = countMap[auth.code];
               });

               data.facetCounts = {};
               console.log("auth counts", data, summary);
               return data;
            });

         } else {
            // Otherwise we can just use the normal counts to set the allCounts
            authorities.forEach(auth => {
               auth.allCount = summary.counts.authorities[auth.code];
            });
            return null;
         }
      });
   }

   function filteredCurrent(params) {
      if (summary.current && summary.current.length) {
         return groupsService.getGroups().then(groups => {

            // We need get the facets as though no filters are selected. Select against Solr
            let newParams = typeBaseParameters(["group", "category", "feature"]);
            newParams.q = createQText(summary);
            let qs = createAuthorityParams();
            if (qs.length) {
               newParams.q += ' AND (' + qs.join(" ") + ')';
            }
            newParams.fq = params.fq;

            return request(newParams).then(data => {
               let groupMap = arrayToMap(data.facet_counts.facet_fields.group);
               let categoryMap = arrayToMap(data.facet_counts.facet_fields.category);
               let featureMap = arrayToMap(data.facet_counts.facet_fields.feature);
               groups.forEach(group => {
                  group.allCount = groupMap[group.name];
                  group.categories.forEach(category => {
                     category.allCount = categoryMap[category.name];
                     category.features.forEach(feature => {
                        feature.allCount = featureMap[feature.name];
                     });
                  });
               });

               data.facetCounts = {};
               console.log("oth counts", data, summary);
               return data;
            });
         });
      } else {
         // Otherwise we can just decorate the counts in from the bigger query to set the all counts
         if (summary.filterBy) {
            return groupsService[{ group: "getGroups", category: "getCategories", feature: "getFeatures" }[summary.filterBy]]().then(items => {
               items.forEach(item => {
                  item.allCount = summary.counts[{ group: "groups", category: "categories", feature: "features" }[summary.filterBy]][item.name];
               });
            });
         }
      }

   }

   // We assume summary is already made.
   function createAuthorityParams() {
      return summary.authorities.map(auth => 'authority:' + auth.code);
   }

   // We assume
   // Current is one of group category or feature, which ever panel is open.
   function createCurrentParams() {
      return summary.current.map(item => item.label + ':"' + item.name + '"');
   }

   function run(params) {
      return request(params).then(data => {
         let code;
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
      return ""
   }

   function getBounds(bounds) {
      /*
      const MAX_LENGTH = 3700000; // 3,700km radius?
      let sw = proj4("EPSG:4326", "EPSG:3031", [bounds.getWest(), bounds.getSouth()]);
      let ne = proj4("EPSG:4326", "EPSG:3031", [bounds.getEast(), bounds.getNorth()]);

      // Lng
      let xLow = limitBetween(sw[0], MAX_LENGTH).toFixed(0);
      let xMax = limitBetween(ne[0], MAX_LENGTH).toFixed(0);

      // Lat
      let yLow = limitBetween(sw[1], MAX_LENGTH).toFixed(0);
      let yMax = limitBetween(ne[1], MAX_LENGTH).toFixed(0);
*/
      var bounds = map.getPixelBounds();

      var sw = map.unproject(bounds.getBottomLeft());
      var ne = map.unproject(bounds.getTopRight());

      var size = map.getSize();
      var ne_p = map.options.crs.project(ne);
      var sw_p = map.options.crs.project(sw);

      return [
         "xPolar:[" + sw_p.x + " TO " + ne_p.x + "]", // Long
         "yPolar:[" + sw_p.y + " TO " + ne_p.y + "]"  // Lat
      ];

      function limitBetween(value, limit) {
         let sign = value < 0? -1: 1;
         let acc = Math.abs(value);
         return sign * (acc < limit? acc : limit);
      }
   }

   function authBaseParameters() {
      return {
         facet: true,
         "facet.field": ["authority"],
         rows: 0,
         wt: "json"
      };
   }

   function typeBaseParameters(types) {
      let response = {
         "facet.limit": -1,
         facet: true,
         rows: 0,
         wt: "json"
      };
      if (types) {
         response["facet.field"] = types;
      }
      return response;
   }

   function baseParameters() {
      return {
         "facet.limit": -1,
         facet: true,
         "facet.field": ["feature", "category", "authority", "group"],
         rows: 50,
         wt: "json"
      };
   }

   return service;
}