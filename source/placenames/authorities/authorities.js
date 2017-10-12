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

      .directive('placenamesAuthoritiesPills', [function () {
         return {
				restrict: 'EA',
            template: '<span class="pn-authorities-pills" placenames-pills pills="pap.authorities" class="pn-feature-pills" update="pap.update()"></span>',
            bindToController: {
               authorities: "=",
               update: "&"
            },
            controller: function () {
            },
            controllerAs: "pap"
         };
      }])

      .filter('pnUnselectedFacets', [function () {
         return function (facets) {
            return !facets ? [] : facets.filter(facet => !facet.selected);
         };
      }])
;

}
