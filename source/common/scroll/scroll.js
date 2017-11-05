{

   angular.module("placenames.scroll", [])

      .directive("commonScroller", ['$timeout', function ($timeout) {
         return {
            scope: {
               more: "&",
               buffer: "=?"
            },
            link: function (scope, element, attrs) {
               let fetching;
               if (!scope.buffer) scope.buffer = 100;

               element.on("scroll", function (event) {
                  let target = event.currentTarget;
                  $timeout.cancel(fetching);
                  fetching = $timeout(bouncer, 120);

                  function bouncer() {
                     if (scope.more && (target.scrollHeight - target.scrollTop <= target.clientHeight + scope.buffer)) {
                        scope.more();
                     }
                  }
               });
            }
         };
      }]);

}