{
   angular.module("placenames.quicksearch",[])

   .directive('placenamesQuicksearch', [function() {
      return {
         link: function(scope) {
         },
         templateUrl: "placenames/quicksearch/quicksearch.html"
      };
   }])

   .directive('placenamesFilteredSummary', ["groupsService", function(groupsService) {
      return {
         scope: {
            state: "="
         },
         templateUrl: "placenames/quicksearch/filteredsummary.html",
         link: function(scope) {
            scope.filters = groupsService.getAll().then(all => scope.filters = all);
         }
      };
   }]);

}