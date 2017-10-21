{
   angular.module("placenames.feature", [])

   .directive("placenamesFeatures", ['groupsService', "placenamesSearchService", function(groupsService, placenamesSearchService) {
      return {
         templateUrl: "placenames/features/features.html",
         link: function(scope) {
            groupsService.getFeatures().then(features => scope.features = features);
            scope.change = function() {
               placenamesSearchService.filtered();
            };
         }
      };
   }]);
}
