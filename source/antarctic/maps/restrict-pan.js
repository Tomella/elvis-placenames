{

      angular.module("antarctic.restrict.pan", [])

         .directive("restrictPanLatitude", ['mapService', function (mapService) {
            return {
               restrict: "AE",
               scope: {
                  latitude: "="
               },
               link: function (scope) {
                  mapService.getMap().then(map => {
                     map.on('zoomend moveend resize', function (e, d) {
                        console.log("drag/zoom", e, d);
                     });
                  });
               }
            };
         }]);

   }