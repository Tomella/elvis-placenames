{
   angular.module('placenames.antarctic', [])

      .directive('antarcticView', function () {
         return {
            restrict: 'AE',
            scope: {},
            templateUrl: 'placenames/antarctic/antarctic.html',
            controller: ['$scope', function ($scope) {
               $scope.go = function () {
                  window.location = "antarctic.html";
               };
            }]
         };
      });
}