{
   angular.module("placenames.feature", [])


   .directive("placenamesFeatures", ['groupsService', function(groupsService) {
      return {
         templateUrl: "placenames/features/features.html",
         link: function(scope) {
            groupsService.getFeatures().then(features => scope.features = features);
         }
      }
   }]);
}
