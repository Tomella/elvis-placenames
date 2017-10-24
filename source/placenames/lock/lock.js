{
   angular.module("placenames.lock", [])
   .directive("placenamesLock", [function() {
      return {
         scope: {
            title: "="
         },
         template: '<i class="fa fa-lock" aria-hidden="true" ng-title="title"></i>'
      };
   }]);
}