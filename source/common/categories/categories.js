{
   angular.module("placenames.categories", [])

      .directive("placenamesCategories", ['groupsService', "searchService", function(groupsService, searchService) {
         return {
            templateUrl: "/categories/categories.html",
            link: function(scope) {
               groupsService.getCategories().then(categories => scope.categories = categories);
               scope.change = function() {
                  searchService.filtered();
               };
            }
         };
      }])

      .directive("placenamesCategoryChildren", [function() {
         return {
            templateUrl: "/categories/features.html",
            scope: {
               features: "="
            }
         };
      }]);
}