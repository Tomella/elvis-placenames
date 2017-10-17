{

   angular.module("placenames.facets", [])

      .factory('placenamesFacetsService', ['$http', '$q', '$rootScope', 'configService', 'proxy', function ($http, $q, $rootScope, configService, proxy) {
         const options = { cache: true };
         var feature = null;
         const authorities = [];
         const groups = [];
         const categories = [];
         const featureCodes = [];

         var service = {
            getGroups() {
               if (!groups.length) {
                  getGroupsTable().then(table => {
                     getFacets().then(fields => {
                        groups.push(...convertToEntries(fields.group).map(entry => {
                           entry.name = table[entry.code];
                           return entry;
                        }));
                     });
                  });
               }
               return $q.when(groups);
            },

            getFeatures() {
               if (!features.length) {
                  getFeaturesTable().then(table => {
                     getFacets().then(fields => {
                        features.push(...convertToEntries(fields.feature).map(entry => {
                           entry.name = table[entry.code];
                           return entry;
                        }));
                     });
                  });
               }
               return $q.when(features);
            },

            getAuthorities() {
               if (!authorities.length) {
                  getAuthoritiesTable().then(table => {
                     getFacets().then(fields => {
                        authorities.push(...convertToEntries(fields.authority).map(entry => {
                           entry.name = table[entry.code].name;
                           entry.jurisdiction = table[entry.code].jurisdiction;
                           return entry;
                        }));
                     });
                  });
               }
               return $q.when(authorities);
            },

            getCategories() {
               if (!categories.length) {
                  getFacets().then(fields => {
                     categories.push(...convertToEntries(fields.category));
                  });
               }
               return $q.when(categories);
            }
         };

         $rootScope.$on("pn.facets.changed", handleCounts);

         return service;

         function handleCounts(event, data) {
            service.getGroups().then(() => {
               updateCounts(groups, data.group);
            });
            service.getAuthorities().then(() => {
               updateCounts(authorities, data.authority);
            });
            service.getFeatures().then(() => {
               updateCounts(features, data.feature);
            });
            service.getCategories().then(() => {
               updateCounts(categories, data.category);
            });
         }

         function getGroupsTable() {
            return configService.getConfig('groups');
         }

         function getFeaturesTable() {
            return configService.getConfig('features');
         }

         function getAuthoritiesTable() {
            return configService.getConfig('authorities');
         }

         function getFacets() {
            return configService.getConfig('facetsQuery').then(url => {
               return $http.get(url, options).then(response => response.data.facet_counts.facet_fields);
            });
         }

         function updateCounts(data, counts) {
            var map = {}, code;

            counts.forEach((value, index) => {
               if (index % 2 === 0) {
                  code = value;
               } else {
                  map[code] = value;
               }
            });
            data.forEach(item => {
               var count = map[item.code];
               item.count = count ? count : 0;
            });
         }

         function convertToEntries(data) {
            var response = [],
               entry, code;

            data.forEach((item, index) => {
               if (index % 2) {
                  response.push({
                     code: code,
                     name: code,
                     total: item
                  });
               } else {
                  code = item;
               }
            });
            return response;
         }
      }]);

}
