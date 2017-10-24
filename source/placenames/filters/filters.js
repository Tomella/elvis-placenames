{
   const options = { cache: true };
   let feature = null;
   const authorities = [];
   const groups = [];
   const categories = [];
   const featureCodes = [];

   angular.module('placenames.filters', ['placenames.groups'])

   .directive('placenamesFilters', ['placenamesSearchService',  function(placenamesSearchService) {
      return {
         templateUrl: "placenames/filters/filters.html",
         scope: {
            status: "="
         },
         link: function(scope) {
            scope.summary = placenamesSearchService.summary;
         }
      };
   }]);

}


