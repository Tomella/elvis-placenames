{

   angular.module("placenames.toolbar", [])

      .directive("placenamesToolbar", [function () {
         return {
            templateUrl: "placenames/toolbar/toolbar.html",
            controller: 'toolbarLinksCtrl',
            transclude: true
         };
      }])

      .controller("toolbarLinksCtrl", ["$scope", "configService", function ($scope, configService) {

         var self = this;
         configService.getConfig().then(function (config) {
            self.links = config.toolbarLinks;
         });

         $scope.item = "";
         $scope.toggleItem = function (item) {
            $scope.item = ($scope.item === item) ? "" : item;
         };

      }]);

}