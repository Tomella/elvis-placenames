{
   // We want to link parents and maybe even some behaviour
   const decorateGroups = (groups) => {
      groups.forEach(group => {
         group.allCategoriesSelected = function () {

         };

         groups.someCategoriesSelected = function () {

         };

         groups.noCategoriesSelected = function () {
            return
         }
      });
   };

   const createCategories = (target) => {
      target.categories = Object.keys(target.groups)
   }

   angular.module("placenames.groups", ["placenames.feature", "placenames.categories"])

      .directive("placenamesGroups", ['groupsService', function (groupsService) {
         return {
            templateUrl: "placenames/groups/groups.html",
            link: function (scope) {
               groupsService.getGroups().then(data => {
                  scope.data = data;
               });
            }
         }
      }])

      .directive("placenamesGroupChildren", ['groupsService', function (groupsService) {
         return {
            templateUrl: "placenames/groups/category.html",
            scope: {
               category: "="
            }
         }
      }])

      .factory("groupsService", ["$http", "$q", "$rootScope", "configService", "mapService",
         function ($http, $q, $rootScope, configService, mapService) {
            let service = {};
            service.getGroups = function () {
               if (service.config) {
                  return $q.when(service.config);
               }
               return configService.getConfig("groups").then(function (config) {
                  service.config = config;
                  return $http.get(config.referenceDataLocation).then(({ data }) => {
                     config.data = data;
                     config.categories = [];
                     config.features = [];

                     config.groups = Object.keys(data).filter(key => !(key === 'name' || key === 'definition')).map(key => {
                        let response = {
                           name: key,
                           definition: data[key].definition,
                           categories: Object.keys(data[key]).filter(key => !(key === 'name' || key === 'definition')).map(name => {
                              return {
                                 name,
                                 definition: data[key][name].definition,
                                 parent: data[key],
                                 features: data[key][name].features
                              };
                           })
                        };

                        config.categories.push(...response.categories);
                        response.categories.forEach(category => {
                           config.features.push(...category.features.map(feature => {
                              feature.parent = category;
                              return feature;
                           }));
                        });
                        return response;
                     });
                     decorateGroups(config.groups);
                     return config;
                  });
               });
            };

            service.getCategories = function () {
               return service.getGroups().then(() => {
                  return service.config.categories;
               });
            };

            service.getFeatures = function () {
               return service.getGroups().then(() => {
                  return service.config.features;
               });
            };

            return service;
         }]);
}