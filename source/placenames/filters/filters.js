{
   const options = { cache: true };
   let feature = null;
   const authorities = [];
   const groups = [];
   const categories = [];
   const featureCodes = [];

   angular.module('placenames.filters', ['placenames.groups'])

   .directive('placenamesFilters', [function() {
      return {
         templateUrl: "placenames/filters/filters.html",
         scope: {
            status: "=",
            state: "="
         },
         link: function(scope) {
            scope.$watch("status.groupOpen", function(value) {
               let status = scope.status;

            });
         }
      };
   }]);

}


