(function (angular) {

   'use strict';

   angular.module("placenames.results.item", [])

      .directive("placenamesResultsItem", ['placenamesItemService', 'placenamesResultsService', 'searchService',
            function (placenamesItemService, placenamesResultsService, searchService) {

         return {
            templateUrl: "results/item.html",
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


               this.leave = function () {
                  searchService.hide();
               };

               this.enter = function () {
                  searchService.show(this.item);
               };

               this.$destroy = function () {
                  searchService.hide();
               };
            },
            controllerAs: "vm"
         };
      }])

      .factory('placenamesItemService', ['$http', 'configService', function ($http, configService) {
         let service = {

            wfs(vm) {
               configService.getConfig("results").then(({wfsTemplate}) => {
                  $http.get(wfsTemplate.replace("${id}", vm.item.recordId)).then(response => {
                     let blob = new Blob([response.data], { type: "application/json;charset=utf-8" });
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
