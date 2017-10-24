{
   angular.module("placenames.quicksearch",[])

   .directive('placenamesQuicksearch', [function() {
      return {
         link: function(scope) {
         },
         templateUrl: "placenames/quicksearch/quicksearch.html"
      };
   }])

   .directive('placenamesFilteredSummary', ["placenamesSearchService", function(placenamesSearchService) {
      return {
         scope: {
            state: "="
         },
         templateUrl: "placenames/quicksearch/filteredsummary.html",
         link: function(scope) {
            scope.summary = placenamesSearchService.summary;
         }
      };
   }])

   .filter("quicksummary", [function() {
      return function(items, key) {
         return items.map(item => item[key]).join(", ");
      };
   }]);

}