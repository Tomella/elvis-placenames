{
   angular.module("placenames.nt", [])

      .directive('placenamesNt', ['$http', 'mapService', function ($http, mapService) {
         return {
            link: function (scope) {
               mapService.getMap().then(map => {
                  $http.get("placenames/resources/config/nt.json").then(({data}) => {
                     let layer = L.geoJSON(data, {
                           onEachFeature: function(feature, layer) {
                              var label = L.marker(layer.getBounds().getCenter(), {
                                 icon: L.divIcon({
                                 className: "nt-label",
                                 html: "Coming<br/>Soon.",
                                 iconSize: [40, 20]
                              })
                           }).addTo(map);
                        },
                        style: {
                           color: "gray",
                           weight: 2,
                           fillOpacity: 0.8
                       }
                     });
                     map.addLayer(layer);
                  });
               });
            }
         };
      }]);
}