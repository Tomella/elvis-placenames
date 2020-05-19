{
    angular.module('placenames.survey', [])
 
       .directive('survey', ['$window', 'configService', function ($window, configService) {
          return {
             restrict: 'AE',
             templateUrl: '/survey/survey.html',
             link: function ($scope) {
                $scope.openSurvey = () => {
                   configService.getConfig("surveyUrl").then(url => {
                      $window.open(url, "_blank");
                   });
                };
             }
          };
       }]);
 }