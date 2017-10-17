{
   angular.module("placenames.featuretypes", ['placenames.pills'])

      .directive('placenamesFeaturetypes', [function () {
         return {
            restrict: 'EA',
            templateUrl: "placenames/featuretypes/featuretypes.html",
            bindToController: {
               types: "=",
               update: "&"
            },
            controller: function () {
               console.log(this.types);
            },
            controllerAs: "vm"
         };
      }])

      .directive('placenamesFeaturetypesPills', [function () {
         return {
            restrict: 'EA',
            template: '<placenames-pills pills="pfp.features" class="pn-feature-pills" update="pfp.update()"></placenames-pills>',
            bindToController: {
               features: "=",
               update: "&"
            },
            controller: function () {

            },
            controllerAs: "pfp"
         };
      }])

      .filter("placenamesHasName", function () {
         return function (list) {
            return (list ? list : []).filter(item => !!item.name);
         };
      });

}
