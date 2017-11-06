{
   angular.module("placenames.zone", [])

   .factory('zoneService', ['$http', '$q', 'configService', function($http, $q, configService) {
      return {
         counts: function(searched) {
            return  configService.getConfig("download").then(({outCoordSys}) => {
               return this.intersections(searched).then(results => {
                  let map = {};
                  results.forEach(container => {
                     map[container.zone.code] = container.intersections.response.numFound;
                  });

                  outCoordSys.forEach(sys => {
                     if(sys.extent) {
                        sys.intersects = map[sys.code]? map[sys.code] : 0;
                     }
                  });
                  return outCoordSys.filter(sys => !sys.extent || sys.intersects);
               });
            });
         },
         intersections: function(searched) {
            return configService.getConfig().then(function(config) {
               let outCoordSys = config.download.outCoordSys;

               let zones = outCoordSys.filter(sys => sys.extent);
               let bounds = searched.bounds;
               let q = searched.params.q;
               let xMin = bounds.getWest();
               let xMax = bounds.getEast();
               let yMin = bounds.getSouth();
               let yMax = bounds.getNorth();

               let responses = zones.filter(zone => {
                  return xMin <= zone.extent.xMax &&
                        xMax >= zone.extent.xMin &&
                        yMin <= zone.extent.yMax &&
                        yMax >= zone.extent.yMin;
               }).map(zone => {
                  return {
                     zone,
                     get bounds() {
                        return {
                           xMin: xMin > zone.extent.xMin ? xMin : zone.extent.xMin,
                           xMax: xMax < zone.extent.xMax ? xMax : zone.extent.xMax,
                           yMin: yMin > zone.extent.yMin ? yMin : zone.extent.yMin,
                           yMax: yMax < zone.extent.yMax ? yMax : zone.extent.yMax
                        };
                     },

                     get location() {
                        let bounds = this.bounds;
                        return "location:[" + bounds.yMin + "," + bounds.xMin + " TO " + bounds.yMax + "," + bounds.xMax + "]";
                     }
                  };
               });

               let template = config.zoneQueryTemplate + "&q=" + q;

               return $q.all(responses.map(response => {
                  return $http.get(template + "&fq=" + response.location).then(({data}) => {
                     response.intersections = data;
                     return response;
                  });
               }));
            });
         }
      };
   }]);
}