{
   angular.module("placenames.feature", [])

      .directive("placenamesFeature", ['placenamesItemService', 'searchService',
         function (placenamesItemService, searchService) {

            return {
               templateUrl: "searched/feature.html",
               bindToController: {
                  feature: "="
               },
               controller: function () {
                  console.log("Creating an item scope");
                  this.showPan = function (feature) {
                     placenamesItemService.showPan(feature);
                  };

                  this.download = function (type) {
                     placenamesItemService[type](this);
                  };


                  this.leave = function () {
                     searchService.hide();
                  };

                  this.enter = function () {
                     searchService.show(this.feature);
                  };

                  this.$destroy = function () {
                     searchService.hide();
                  };
               },
               controllerAs: "vm"
            };
         }])

      .filter("formatDate", function () {
         return function (dateStr) {
            if (!dateStr) {
               return dateStr;
            }
            let date = new Date(dateStr);
            return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
         };
      })

      .factory('placenamesItemService', ['$http', 'configService', 'mapService', function ($http, configService, mapService) {
         const ZOOM_IN = 8;
         let marker;
         let service = {
            hide(what) {
               return mapService.getMap().then(map => {
                  if (marker) {
                     map.removeLayer(marker);
                  }
                  return map;
               });
            },

            show(what) {
               return this.hide().then(map => {
                  let location = what.location.split(" ").reverse().map(str => +str);
                  // split lng/lat string seperated by space, reverse to lat/lng, cooerce to numbers
                  marker = L.popup()
                     .setLatLng(location)
                     .setContent(what.name + "<br/>Lat/Lng: " +
                        location[0] + "&deg;" +
                        location[1] + "&deg;")
                     .openOn(map);

                  return {
                     location,
                     map,
                     marker
                  };
               });
            },

            wfs(vm) {
               configService.getConfig("results").then(({ wfsTemplate }) => {
                  $http.get(wfsTemplate.replace("${id}", vm.item.recordId)).then(response => {
                     let blob = new Blob([response.data], { type: "application/json;charset=utf-8" });
                     saveAs(blob, "gazetteer-wfs-feature-" + vm.item.recordId + ".xml");
                  });
               });
            },

            showPan(what) {
               return this.show(what).then(details => {
                  let map = details.map;
                  map.setView(details.location, ZOOM_IN, { animate: true });

                  return details;
               });
            }

         };
         return service;
      }])

      .filter("itemLongitude", function () {
         return function (location) {
            return location.split(" ")[0];
         };
      })

      .filter("itemLatitude", function () {
         return function (location) {
            return location.split(" ")[1];
         };
      });
}