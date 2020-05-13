{
   angular.module("placenames.feature", [])

   .directive("placenamesFeatures", ['groupsService', "searchService", function(groupsService, searchService) {
      return {
         templateUrl: "/features/features.html",
         link: function(scope) {
            groupsService.getFeatures().then(features => scope.features = features);
            scope.change = function() {
               searchService.filtered();
            };
         }
      };
   }]);
}
