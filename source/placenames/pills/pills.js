(function (angular) {
   'use strict';

   angular.module("placenames.pills", [])


      .directive('placenamesPills', [function () {
         return {
				restrict: 'EA',
            templateUrl: "placenames/pills/pills.html",
            bindToController: {
               pills: "=",
               update: "&"
            },
            controller: function () {
               this.clear = function(item) {
                  item.selected = false;
                  this.update();
               };
            },
            controllerAs: "pp"
         };
      }]);

})(angular);
