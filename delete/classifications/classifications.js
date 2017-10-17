{
   angular.module("placenames.classifications", [])

      .directive('placenamesClassifications', [function () {
         return {
				restrict: 'EA',
            templateUrl: "placenames/classifications/classifications.html",
            bindToController: {
               classifications: "=",
               update: "&"
            },
            controller: function () {
               console.log(this.classifications);
            },
            controllerAs: "pc"
         };
      }])

      .directive('placenamesClassificationsPills', [function () {
         return {
				restrict: 'EA',
            template: '<span placenames-pills class="pn-classifications-pills" pills="pcp.classifications" class="pn-feature-pills" update="pcp.update()"></span>',
            bindToController: {
               classifications: "=",
               update: "&"
            },
            controller: function () {
            },
            controllerAs: "pcp"
         };
      }]);

}
