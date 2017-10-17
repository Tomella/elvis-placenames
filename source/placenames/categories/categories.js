{
   angular.module("placenames.categories", [])

      .directive("placenamesCategories", ['groupsService', function(groupsService) {
         return {
            templateUrl: "placenames/categories/categories.html",
            link: function(scope) {
               groupsService.getCategories().then(categories => scope.categories = categories);
            }
         }
      }])

      .directive("placenamesCategoryChildren", [function() {
         return {
            templateUrl: "placenames/categories/features.html",
            scope: {
               features: "="
            }
         };
      }]);
}