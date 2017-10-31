{
   angular.module("placenames.authorities", [])

      .directive('placenamesAuthorities', ["groupsService", "placenamesSearchService", function (groupsService, placenamesSearchService) {
         return {
				restrict: 'EA',
            templateUrl: "authorities/authorities.html",
            link: function (scope) {
               groupsService.getAuthorities().then(authorities => scope.authorities = authorities);
               scope.change = function(item) {
                  placenamesSearchService.filtered();
               };
            }
         };
      }]);
}
