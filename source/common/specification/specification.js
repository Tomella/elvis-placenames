{
   angular.module('placenames.specification', [])

      .directive('productSpecification', ['$window', 'configService', function ($window, configService) {
         return {
            restrict: 'AE',
            templateUrl: 'specification/specification.html',
            link: function ($scope) {
               $scope.openSpec = () => {
                  configService.getConfig("dataSpecificationUrl").then(url => {
                     $window.open(url, "_blank");
                  });
               };
            }
         };
      }]);
}