{
   angular.module('placenames.reset', [])

      .directive('resetPage', function ($window) {
         return {
            restrict: 'AE',
            scope: {},
            templateUrl: 'reset/reset.html',
            controller: ['$scope', function ($scope) {
               $scope.reset = function () {
                  $window.location.reload();
               };
            }]
         };
      });
}