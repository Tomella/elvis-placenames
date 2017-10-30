{
   angular.module("placenames.pill", [])
      .directive('placenamesPill', ['placenamesSearchService', function (placenamesSearchService) {
         return {
				restrict: 'EA',
            templateUrl: "placenames/pill/pill.html",
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
                  placenamesSearchService.filtered();
               };
            }
         };
      }]);
}