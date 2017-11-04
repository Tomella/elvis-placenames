{
   angular.module("placenames.tree", [])
   .directive("placenamesTree", ["groupsService", "searchService", function(groupsService, searchService) {
      return {
         templateUrl: "filters/tree.html",
         restrict: "AE",
         link: function(scope) {
            groupsService.getGroups().then(groups => scope.groups = groups);

            scope.change = function(group) {
               searchService.filtered();
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