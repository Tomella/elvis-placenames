{
   const createCategories = (target) => {
      target.categories = Object.keys(target.groups);
   };

   angular.module("placenames.groups", ["placenames.feature", "placenames.categories"])

      .directive("placenamesGroups", ['groupsService', "placenamesSearchService", function (groupsService, placenamesSearchService) {
         return {
            templateUrl: "placenames/groups/groups.html",
            link: function (scope) {
               groupsService.getGroups().then(data => {
                  scope.data = data;
               });

               scope.change = function () {
                  console.log("Update groups");
                  placenamesSearchService.filtered();
               };
            }
         };
      }])

      .directive("placenamesGroupChildren", ['groupsService', function (groupsService) {
         return {
            templateUrl: "placenames/groups/category.html",
            scope: {
               category: "="
            }
         };
      }])

      .factory("groupsService", ["$http", "$q", "$rootScope", "configService", "mapService",
         function ($http, $q, $rootScope, configService, mapService) {
            let service = {};
            service.getGroups = function () {
               if (service.config) {
                  service.promise = null;
                  return $q.when(service.config);
               }

               if (service.promise) {
                  return service.promise;
               }

               service.promise = service.getCounts().then(count => {
                  return configService.getConfig().then(function (all) {
                     // Merge the groups
                     let config = all.groups;
                     service.config = config;

                     return $http.get(config.referenceDataLocation).then(({ data }) => {
                        config.data = data;
                        config.categories = [];
                        config.features = [];
                        config.authorities = all.authorities;

                        config.authorities.forEach(authority => {
                           let total = count.authority[authority.code];
                           authority.total = total ? total : 0;
                        });

                        config.groups = Object.keys(data).filter(key => !(key === 'name' || key === 'definition')).map(key => {
                           let response = {
                              name: key,
                              total: count.group[key] ? count.group[key] : 0,
                              definition: data[key].definition,
                              categories: Object.keys(data[key]).filter(key => !(key === 'name' || key === 'definition')).map(name => {
                                 return {
                                    name,
                                    total: count.category[name] ? count.category[name] : 0,
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
                                 feature.total = count.feature[feature.name] ? count.feature[feature.name] : 0;
                                 return feature;
                              }));
                           });
                           return response;
                        });
                        // After thought: Why bother with any that have zero counts? Filter them out now.
                        config.authorities = config.authorities.filter(authority => authority.total);
                        config.groups = config.groups.filter(group => group.total);
                        config.categories = config.categories.filter(category => category.total);
                        config.features = config.features.filter(feature => feature.total);
                        console.log(config);
                        return config;
                     });
                  });
               });

               return service.promise;
            };

            service.getCategories = function () {
               return service.getGroups().then(() => {
                  return service.config.categories;
               });
            };

            service.getAll = function() {
               return service.getGroups().then(() => service.config);
            };

            service.getAuthorities = function () {
               return service.getGroups().then(() => {
                  return service.config.authorities;
               });
            };

            service.getFeatures = function () {
               return service.getGroups().then(() => {
                  return service.config.features;
               });
            };

            service.getCounts = function () {
               return configService.getConfig("groups").then(({ referenceDataCountsUrl }) => {
                  return $http.get(referenceDataCountsUrl).then(({ data }) => {
                     // There are now three object within counts group, category and feature
                     let counts = data.facet_counts.facet_fields;
                     let response = {
                        feature: {},
                        category: {},
                        group: {},
                        authority: {}
                     };
                     let lastElement;

                     ["feature", "category", "group", "authority"].forEach(key => {

                        counts[key].forEach((value, index) => {
                           if (index % 2) {
                              response[key][lastElement] = value;
                           } else {
                              lastElement = value;
                           }
                        });
                     });
                     return response;
                  });
               });
            };

            return service;
         }]);
}