{
   angular.module("placenames.quicksearch",['placenames.pill'])

   .directive('placenamesQuicksearch', [function() {
      return {
         link: function(scope) {
         },
         templateUrl: "/quicksearch/quicksearch.html"
      };
   }])

   .directive('placenamesFilteredSummary', ["searchService", function(searchService) {
      return {
         scope: {
            state: "="
         },
         templateUrl: "/quicksearch/filteredsummary.html",
         link: function(scope) {
            scope.summary = searchService.summary;
         }
      };
   }])

   .filter("quicksummary", [function() {
      return function(items, key) {
         return items.map(item => (item[key] + "(" + item.count + ")")).join(", ");
      };
   }]);

}