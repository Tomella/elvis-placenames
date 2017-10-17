{

   angular.module("placenames.authorities", [])

      .directive('placenamesAuthorities', [function () {
         return {
				restrict: 'EA',
            templateUrl: "placenames/authorities/authorities.html",
            bindToController: {
               authorities: "=",
               update: "&"
            },
            controller: function () {
               console.log(this.authorities);
            },
            controllerAs: "pa"
         };
      }])

      .filter('pnUnselectedFacets', [function () {
         return function (facets) {
            return !facets ? [] : facets.filter(facet => !facet.selected);
         };
      }])
;

}
