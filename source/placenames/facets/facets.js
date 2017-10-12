{

   angular.module("placenames.facets", [])

   .factory('placenamesFacetsService', ['$http', '$q', '$rootScope', 'configService', 'proxy', function($http, $q, $rootScope, configService, proxy) {
      const options = {cache: true};
      var featureCode = null;
      const authorities = [];
      const classifications = [];
      const featureCodes = [];

      var service = {
         getFeatureCodes() {
            if(!featureCodes.length) {
               getFeaturesTable().then(table => {
                  getFacets().then(fields => {
                     featureCodes.push(...convertToEntries(fields.featureCode).map(entry => {
                        entry.name = table[entry.code];
                        return entry;
                     }));
                  });
               });
            }
            return $q.when(featureCodes);
         },

         getAuthorities() {
            if(!authorities.length) {
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
            return  $q.when(authorities);
         },

         getClassifications() {
            if(!classifications.length) {
               getFacets().then(fields => {
                  classifications.push(...convertToEntries(fields.classification));
               });
            }
            return  $q.when(classifications);
         }
      };

      $rootScope.$on("pn.facets.changed", handleCounts);

      return service;

      function handleCounts(event, data) {
         service.getAuthorities().then(() => {
            updateCounts(authorities,     data.authority);
         });
         service.getFeatureCodes().then(() => {
            updateCounts(featureCodes,    data.featureCode);
         });
         service.getClassifications().then(() => {
            updateCounts(classifications, data.classification);
         });
      }

      function getFeaturesTable() {
         return configService.getConfig('featureCodes');
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
            item.count = count? count: 0;
         });
      }

      function convertToEntries(data) {
         var response = [],
            entry, code;

         data.forEach((item, index) => {
            if(index % 2) {
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
