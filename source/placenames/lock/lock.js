{
   angular.module("placenames.lock", [])
   .directive("placenamesLock", [function() {
      return {
         scope: {
            hover: "="
         },
         template: '<i class="fa fa-lock" aria-hidden="true" title="The features shown on the map are locked to the current search results. Clear your search results to show more features"></i>'
      };
   }]);
}