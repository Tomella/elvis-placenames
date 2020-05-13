{
   class Group {
      constructor() {
         this.label = "group";
         this.color = "#4286f4";
         this._selected = false;
      }

      get selected() {
         return this._selected;
      }

      set selected(val) {
         this._selected = val;
         if (!val && this.categories) {
            this.categories.forEach(category => category.selected = false);
         }
      }

      get selectExpand() {
         return this.selected;
      }

      set selectExpand(val) {
         this.selected = val;
         if (val) {
            this.expanded = val;
         }
      }

      selections() {
         let response = [];
         if (this.selected) {
            this.categories.forEach(category => {
               response.push(...category.selections());
            });
            if (!response.length) {
               return [this];
            }
         }
         return response;
      }
   }

   class Category {
      constructor() {
         this.label = "category";
         this.color = "#21a470";
         this._selected = false;
      }

      get selected() {
         return this._selected;
      }

      set selected(val) {
         this._selected = val;
         if (val) {
            this.parent.selected = true;
         } else if (this.features) {
            this.features.forEach(feature => feature.selected = false);
         }
      }

      get selectExpand() {
         return this.selected;
      }

      set selectExpand(val) {
         this.selected = val;
         if (val) {
            this.expanded = val;
         }
      }

      selections() {
         let response = [];
         if (this.selected) {
            response = this.features.filter(feature => {
               return feature._selected;
            });

            if (!response.length) {
               return [this];
            }
         }
         return response;
      }
   }

   class Feature {
      constructor() {
         this.label = "feature";
         this.color = "#d68a39";
         this._selected = false;
      }

      get selected() {
         return this._selected;
      }

      set selected(val) {
         this._selected = val;
         if (val) {
            this.parent.selected = true;
         }
      }

      selections() {
         if (this.selected) {
            return [this];
         }
         return [];
      }
   }

   const createCategories = (target) => {
      target.categories = Object.keys(target.groups);
   };

   angular.module("placenames.groups", ["placenames.feature", "placenames.categories"])

      .directive("placenamesGroups", ['groupsService', "searchService", function (groupsService, searchService) {
         return {
            templateUrl: "/groups/groups.html",
            link: function (scope) {
               groupsService._loadGroups().then(data => {
                  scope.data = data;
               });

               scope.change = function () {
                  console.log("Update groups");
                  searchService.filtered();
               };
            }
         };
      }])

      .directive("placenamesGroupChildren", ['groupsService', function (groupsService) {
         return {
            templateUrl: "/groups/category.html",
            scope: {
               category: "="
            }
         };
      }])

      .factory("groupsService", ["$http", "$q", "$rootScope", "configService", "mapService",
         function ($http, $q, $rootScope, configService, mapService) {
            let service = {};
            service._loadGroups = function () {
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
                           let group = new Group();

                           Object.assign(group, {
                              name: key,
                              total: count.group[key] ? count.group[key] : 0,
                              definition: data[key].definition,
                              categories: Object.keys(data[key]).filter(key => !(key === 'name' || key === 'definition')).map(name => {
                                 let response = new Category();
                                 Object.assign(response, {
                                    name,
                                    total: count.category[name] ? count.category[name] : 0,
                                    definition: data[key][name].definition,
                                    parent: group,
                                    features: data[key][name].features.map(feature => {
                                       let container = new Feature();
                                       Object.assign(container, feature, {
                                          parent: response,
                                          total: count.feature[feature.name] ? count.feature[feature.name] : 0
                                       });
                                       return container;
                                    })
                                 });
                                 return response;
                              })
                           });

                           config.categories.push(...group.categories);
                           group.categories.forEach(category => {
                              config.features.push(...category.features);
                           });
                           return group;
                        });
                        // After thought: Why bother with any that have zero counts? Filter them out now.
                        config.authorities = config.authorities.filter(authority => authority.total);
                        config.groups = config.groups.filter(group => group.total);
                        config.categories = config.categories.filter(category => category.total);
                        config.features = config.features.filter(feature => feature.total);
                        window.larry = config.groups;
                        return config;
                     });
                  });
               });

               return service.promise;
            };

            service.getCategories = function () {
               return service._loadGroups().then(() => {
                  return service.config.categories;
               });
            };

            service.getAll = function () {
               return service._loadGroups().then(() => service.config);
            };

            service.getAuthorities = function () {
               return service._loadGroups().then(() => {
                  return service.config.authorities;
               });
            };

            service.getGroups = function () {
               return service._loadGroups().then(() => {
                  return service.config.groups;
               });
            };

            service.getFeatures = function () {
               return service._loadGroups().then(() => {
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