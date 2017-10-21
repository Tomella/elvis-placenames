{
   angular.module("placenames.categories", [])

      .directive("placenamesCategories", ['groupsService', "placenamesSearchService", function(groupsService, placenamesSearchService) {
         return {
            templateUrl: "placenames/categories/categories.html",
            link: function(scope) {
               groupsService.getCategories().then(categories => scope.categories = categories);
               scope.change = function() {
                  placenamesSearchService.filtered();
               };
            }
         };
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