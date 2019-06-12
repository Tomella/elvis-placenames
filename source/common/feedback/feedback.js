{
   angular.module('placenames.feedback', [])

      .directive('feedback', ['$window', 'configService', function ($window, configService) {
         return {
            restrict: 'AE',
            templateUrl: 'feedback/feedback.html',
            link: function ($scope) {
               $scope.open = () => {
                  configService.getConfig("feedbackUrl").then(url => {
                     $window.open(url, "_blank");
                  });
               };
            }
         };
      }]);
}