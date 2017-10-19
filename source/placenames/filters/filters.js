{
   const options = { cache: true };
   let feature = null;
   const authorities = [];
   const groups = [];
   const categories = [];
   const featureCodes = [];

   angular.module('placenames.filters', ['placenames.groups'])

   .directive('placenamesFilters', ['placenamesFiltersService', function(placenamesFiltersService) {
      return {
         templateUrl: "placenames/filters/filters.html"
      };
   }])

   .factory('placenamesFiltersService', ['$http', '$q', 'configService', function($http, $q, configService) {

      let getAuthoritiesTable = () => {
         return configService.getConfig('authorities');
      }

      let getFacets = () => {
         return configService.getConfig('facetsQuery').then(url => {
            return $http.get(url, options).then(response => response.data.facet_counts.facet_fields);
         });
      }

      let convertToEntries = (data) => {
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

      return {
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
         }
      }
   }]);

}


