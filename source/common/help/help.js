{
	angular.module("icsm.help", [])

		.directive("icsmHelp", [function () {
			return {
				templateUrl: "icsm/help/help.html"
			};
		}])

		.directive("icsmFaqs", [function () {
			return {
				restrict: "AE",
				templateUrl: "icsm/help/faqs.html",
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
	function HelpCtrl($log, helpService) {
		var self = this;
		$log.info("HelpCtrl");
		helpService.getFaqs().then(function (faqs) {
			self.faqs = faqs;
		});
	}

	HelpService.$inject = ['$http'];
	function HelpService($http) {
		var FAQS_SERVICE = "icsm/resources/config/faqs.json";

		return {
			getFaqs: function () {
				return $http.get(FAQS_SERVICE, { cache: true }).then(function (response) {
					return response.data;
				});
			}
		};
	}

}