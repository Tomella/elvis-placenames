{
   angular.module("placenames.pill", [])
      .directive('placenamesPill', ['searchService', function (searchService) {
         return {
				restrict: 'EA',
            templateUrl: "/pill/pill.html",
            scope: {
               item: "=",
               update: "&",
               name: "@?"
            },
            link: function(scope) {
               if(scope.item.label) {
                  scope.label = scope.item.label.charAt(0).toUpperCase() + scope.item.label.slice(1) + ": ";
               }

               if(!scope.name) {
                  scope.name = "name";
               }
               scope.deselect = function() {
                  scope.item.selected = false;
                  searchService.filtered();
               };
            }
         };
      }]);
}