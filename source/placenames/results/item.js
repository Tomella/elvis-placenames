(function (angular) {

   'use strict';

   angular.module("placenames.results.item", [])

      .directive("placenamesResultsItem", ['placenamesItemService', 'placenamesResultsService',
            function (placenamesItemService, placenamesResultsService) {

         return {
            templateUrl: "placenames/results/item.html",
            bindToController: {
               item: "="
            },
            controller: function () {
               console.log("Creating an item scope");
               this.showPan = function (feature) {
                  placenamesResultsService.showPan(feature);
               };

               this.download = function (type) {
                  placenamesItemService[type](this);
               };

               placenamesResultsService.load(this.item.recordId).then(data => {
                  this.feature = data.features[0];
               });
            },
            controllerAs: "vm"
         };
      }])

      .factory('placenamesItemService', ['$http', 'configService', function ($http, configService) {
         var service = {
            esri(vm) {
               var blob = new Blob([JSON.stringify(vm.feature, null, 3)], { type: "application/json;charset=utf-8" });
               saveAs(blob, "gazetteer-esri-feature-" + vm.item.recordId + ".json");
            },

            wfs(vm) {
               configService.getConfig("results").then(({wfsTemplate}) => {
                  $http.get(wfsTemplate.replace("${id}", vm.item.recordId)).then(response => {
                     var blob = new Blob([response.data], { type: "application/json;charset=utf-8" });
                     saveAs(blob, "gazetteer-wfs-feature-" + vm.item.recordId + ".xml");
                  });
               });
            }
         };
         return service;
      }])

      .filter("itemLongitude", function() {
         return function(location) {
            return location.split(" ")[0];
         };
      })

      .filter("itemLatitude", function() {
         return function(location) {
            return location.split(" ")[1];
         };
      });

})(angular);
