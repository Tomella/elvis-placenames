{
	angular.module("placenames.help", [])

		.directive("placenamesHelp", [function () {
			return {
				templateUrl: "/help/help.html"
			};
		}])

		.directive("placenamesFaqs", [function () {
			return {
				restrict: "AE",
				templateUrl: "/help/faqs.html",
				scope: {
					faqs: "="
				},
				link: function (scope) {
					scope.focus = function (key) {
						$("#faqs_" + key).focus();
					};
				}
			};
		}])

		.controller("HelpCtrl", HelpCtrl)
		.factory("helpService", HelpService);

	HelpCtrl.$inject = ['$log', 'helpService'];
}

function HelpCtrl($log, helpService) {
   var self = this;
   $log.info("HelpCtrl");
   helpService.getFaqs().then(function (faqs) {
      self.faqs = faqs;
   });
}

HelpService.$inject = ['$http'];
function HelpService($http) {
   var FAQS_SERVICE = "placenames/resources/config/faqs.json";

   return {
      getFaqs: function () {
         return $http.get(FAQS_SERVICE, { cache: true }).then(function (response) {
            return response.data;
         });
      }
   };
}