{
   angular.module("placenames.tree", [])
   .directive("placenamesTree", ["groupsService", "placenamesSearchService", function(groupsService, placenamesSearchService) {
      return {
         templateUrl: "filters/tree.html",
         restrict: "AE",
         link: function(scope) {
            groupsService.getGroups().then(groups => scope.groups = groups);

            scope.change = function(group) {
               placenamesSearchService.filtered();
               if (group.selected) {
                  group.expanded = true;
               }
            };
         }
      };
   }])
   .filter("withTotals", function() {
      return function(list) {
         if(list) {
            return list.filter(item => item.total);
         }
      };
   });
}