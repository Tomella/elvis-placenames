{
   angular.module("placenames.quicksearch",[])

   .directive('placenamesQuicksearch', [function() {
      return {
         link: function(scope) {
         },
         templateUrl: "placenames/quicksearch/quicksearch.html"
      };
   }])

   .directive('placenamesFilteredSummary', [function() {
      return {
         link: function(scope) {
            state: "="
         },
         templateUrl: "placenames/quicksearch/filteredsummary.html"
      };
   }]);

}