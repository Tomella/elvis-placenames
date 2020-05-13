{
   angular.module('antarctic.australia', [])

      .directive('australiaView', function () {
         return {
            restrict: 'AE',
            scope: {},
            templateUrl: '/australia/australia.html',
            controller: ['$scope', function ($scope) {
               $scope.go = function () {
                  window.location = "index.html";
               };
            }]
         };
      });
}