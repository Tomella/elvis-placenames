/**
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/

"use strict";

{
   angular.module("placenames.authorities", []).directive('placenamesAuthorities', ["groupsService", "searchService", function (groupsService, searchService) {
      return {
         restrict: 'EA',
         templateUrl: "authorities/authorities.html",
         link: function link(scope) {
            groupsService.getAuthorities().then(function (authorities) {
               return scope.authorities = authorities;
            });
            scope.change = function (item) {
               searchService.filtered();
            };
         }
      };
   }]);
}
"use strict";

{
   angular.module("placenames.categories", []).directive("placenamesCategories", ['groupsService', "searchService", function (groupsService, searchService) {
      return {
         templateUrl: "categories/categories.html",
         link: function link(scope) {
            groupsService.getCategories().then(function (categories) {
               return scope.categories = categories;
            });
            scope.change = function () {
               searchService.filtered();
            };
         }
      };
   }]).directive("placenamesCategoryChildren", [function () {
      return {
         templateUrl: "categories/features.html",
         scope: {
            features: "="
         }
      };
   }]);
}
'use strict';

{
   angular.module('placenames.autoscroll', []).directive('autoScroll', ['$timeout', '$rootScope', function ($timeout, $rootScope) {
      return {
         scope: {
            trigger: "@",
            y: "@",
            height: "@"
         },
         link: function link(scope, element, attrs) {
            var timeout = void 0,
                oldBottom = void 0,
                startHeight = void 0;

            if (scope.height) {
               startHeight = +scope.height;
            } else {
               startHeight = 100;
            }
            oldBottom = startHeight;

            element.on("scroll", function (event) {
               var scrollHeight = element.scrollTop(),
                   target = element.find(attrs.autoScroll),
                   totalHeight = target.height(),
                   scrollWindow = element.height(),
                   scrollBottom = void 0,
                   up = void 0;

               if (scrollWindow >= totalHeight) {
                  return;
               }
               scrollBottom = totalHeight - scrollHeight - scrollWindow;
               up = oldBottom < scrollBottom;
               oldBottom = scrollBottom;
               if (scrollBottom < startHeight && !up) {
                  // Add some debounce
                  if (timeout) {
                     $timeout.cancel(timeout);
                  }
                  timeout = $timeout(function () {
                     $rootScope.$broadcast(scope.trigger);
                  }, 30);
               }
            });
         }
      };
   }]);
}
"use strict";

{

   angular.module('placenames.contributors', []).directive("placenamesContributors", ["$interval", "contributorsService", function ($interval, contributorsService) {
      return {
         templateUrl: "contributors/contributors.html",
         scope: {},
         link: function link(scope, element) {
            var timer = void 0;

            scope.contributors = contributorsService.getState();

            scope.over = function () {
               $interval.cancel(timer);
               scope.contributors.ingroup = true;
            };

            scope.out = function () {
               timer = $interval(function () {
                  scope.contributors.ingroup = false;
               }, 1000);
            };

            scope.unstick = function () {
               scope.contributors.ingroup = scope.contributors.show = scope.contributors.stick = false;
               element.find("a").blur();
            };
         }
      };
   }]).directive("placenamesContributorsLink", ["$interval", "contributorsService", function ($interval, contributorsService) {
      return {
         restrict: "AE",
         templateUrl: "contributors/show.html",
         scope: {},
         link: function link(scope) {
            var timer = void 0;
            scope.contributors = contributorsService.getState();
            scope.over = function () {
               $interval.cancel(timer);
               scope.contributors.show = true;
            };

            scope.toggleStick = function () {
               scope.contributors.stick = !scope.contributors.stick;
               if (!scope.contributors.stick) {
                  scope.contributors.show = scope.contributors.ingroup = false;
               }
            };

            scope.out = function () {
               timer = $interval(function () {
                  scope.contributors.show = false;
               }, 700);
            };
         }
      };
   }]).factory("contributorsService", ContributorsService).filter("activeContributors", function () {
      return function (contributors) {
         if (!contributors) {
            return [];
         }
         return contributors.filter(function (contributor) {
            return contributor.enabled;
         });
      };
   });

   ContributorsService.$inject = ["$http"];
}

function ContributorsService($http) {
   var state = {
      show: false,
      ingroup: false,
      stick: false
   };

   $http.get("placenames/resources/config/contributors.json").then(function (response) {
      state.orgs = response.data;
   });

   return {
      getState: function getState() {
         return state;
      }
   };
}
"use strict";

{
   angular.module("placenames.feature", []).directive("placenamesFeatures", ['groupsService', "searchService", function (groupsService, searchService) {
      return {
         templateUrl: "features/features.html",
         link: function link(scope) {
            groupsService.getFeatures().then(function (features) {
               return scope.features = features;
            });
            scope.change = function () {
               searchService.filtered();
            };
         }
      };
   }]);
}
"use strict";

{
   angular.module("placenames.tree", []).directive("placenamesTree", ["groupsService", "searchService", function (groupsService, searchService) {
      return {
         templateUrl: "filters/tree.html",
         restrict: "AE",
         link: function link(scope) {
            groupsService.getGroups().then(function (groups) {
               return scope.groups = groups;
            });

            scope.change = function (group) {
               searchService.filtered();
               if (group.selected) {
                  group.expanded = true;
               }
            };
         }
      };
   }]).filter("withTotals", function () {
      return function (list) {
         if (list) {
            return list.filter(function (item) {
               return item.total;
            });
         }
      };
   });
}
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

{
   var Group = function () {
      function Group() {
         _classCallCheck(this, Group);

         this.label = "group";
         this.color = "#4286f4";
         this._selected = false;
      }

      _createClass(Group, [{
         key: "selections",
         value: function selections() {
            var response = [];
            if (this.selected) {
               this.categories.forEach(function (category) {
                  response.push.apply(response, _toConsumableArray(category.selections()));
               });
               if (!response.length) {
                  return [this];
               }
            }
            return response;
         }
      }, {
         key: "selected",
         get: function get() {
            return this._selected;
         },
         set: function set(val) {
            this._selected = val;
            if (!val && this.categories) {
               this.categories.forEach(function (category) {
                  return category.selected = false;
               });
            }
         }
      }, {
         key: "selectExpand",
         get: function get() {
            return this.selected;
         },
         set: function set(val) {
            this.selected = val;
            if (val) {
               this.expanded = val;
            }
         }
      }]);

      return Group;
   }();

   var Category = function () {
      function Category() {
         _classCallCheck(this, Category);

         this.label = "category";
         this.color = "#21a470";
         this._selected = false;
      }

      _createClass(Category, [{
         key: "selections",
         value: function selections() {
            var response = [];
            if (this.selected) {
               response = this.features.filter(function (feature) {
                  return feature._selected;
               });

               if (!response.length) {
                  return [this];
               }
            }
            return response;
         }
      }, {
         key: "selected",
         get: function get() {
            return this._selected;
         },
         set: function set(val) {
            this._selected = val;
            if (val) {
               this.parent.selected = true;
            } else if (this.features) {
               this.features.forEach(function (feature) {
                  return feature.selected = false;
               });
            }
         }
      }, {
         key: "selectExpand",
         get: function get() {
            return this.selected;
         },
         set: function set(val) {
            this.selected = val;
            if (val) {
               this.expanded = val;
            }
         }
      }]);

      return Category;
   }();

   var Feature = function () {
      function Feature() {
         _classCallCheck(this, Feature);

         this.label = "feature";
         this.color = "#d68a39";
         this._selected = false;
      }

      _createClass(Feature, [{
         key: "selections",
         value: function selections() {
            if (this.selected) {
               return [this];
            }
            return [];
         }
      }, {
         key: "selected",
         get: function get() {
            return this._selected;
         },
         set: function set(val) {
            this._selected = val;
            if (val) {
               this.parent.selected = true;
            }
         }
      }]);

      return Feature;
   }();

   var createCategories = function createCategories(target) {
      target.categories = Object.keys(target.groups);
   };

   angular.module("placenames.groups", ["placenames.feature", "placenames.categories"]).directive("placenamesGroups", ['groupsService', "searchService", function (groupsService, searchService) {
      return {
         templateUrl: "groups/groups.html",
         link: function link(scope) {
            groupsService._loadGroups().then(function (data) {
               scope.data = data;
            });

            scope.change = function () {
               console.log("Update groups");
               searchService.filtered();
            };
         }
      };
   }]).directive("placenamesGroupChildren", ['groupsService', function (groupsService) {
      return {
         templateUrl: "groups/category.html",
         scope: {
            category: "="
         }
      };
   }]).factory("groupsService", ["$http", "$q", "$rootScope", "configService", "mapService", function ($http, $q, $rootScope, configService, mapService) {
      var service = {};
      service._loadGroups = function () {
         if (service.config) {
            service.promise = null;
            return $q.when(service.config);
         }

         if (service.promise) {
            return service.promise;
         }

         service.promise = service.getCounts().then(function (count) {
            return configService.getConfig().then(function (all) {
               // Merge the groups
               var config = all.groups;
               service.config = config;

               return $http.get(config.referenceDataLocation).then(function (_ref) {
                  var data = _ref.data;

                  config.data = data;
                  config.categories = [];
                  config.features = [];
                  config.authorities = all.authorities;

                  config.authorities.forEach(function (authority) {
                     var total = count.authority[authority.code];
                     authority.total = total ? total : 0;
                  });

                  config.groups = Object.keys(data).filter(function (key) {
                     return !(key === 'name' || key === 'definition');
                  }).map(function (key) {
                     var _config$categories;

                     var group = new Group();

                     Object.assign(group, {
                        name: key,
                        total: count.group[key] ? count.group[key] : 0,
                        definition: data[key].definition,
                        categories: Object.keys(data[key]).filter(function (key) {
                           return !(key === 'name' || key === 'definition');
                        }).map(function (name) {
                           var response = new Category();
                           Object.assign(response, {
                              name: name,
                              total: count.category[name] ? count.category[name] : 0,
                              definition: data[key][name].definition,
                              parent: group,
                              features: data[key][name].features.map(function (feature) {
                                 var container = new Feature();
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

                     (_config$categories = config.categories).push.apply(_config$categories, _toConsumableArray(group.categories));
                     group.categories.forEach(function (category) {
                        var _config$features;

                        (_config$features = config.features).push.apply(_config$features, _toConsumableArray(category.features));
                     });
                     return group;
                  });
                  // After thought: Why bother with any that have zero counts? Filter them out now.
                  config.authorities = config.authorities.filter(function (authority) {
                     return authority.total;
                  });
                  config.groups = config.groups.filter(function (group) {
                     return group.total;
                  });
                  config.categories = config.categories.filter(function (category) {
                     return category.total;
                  });
                  config.features = config.features.filter(function (feature) {
                     return feature.total;
                  });
                  console.log(config);
                  window.larry = config.groups;
                  return config;
               });
            });
         });

         return service.promise;
      };

      service.getCategories = function () {
         return service._loadGroups().then(function () {
            return service.config.categories;
         });
      };

      service.getAll = function () {
         return service._loadGroups().then(function () {
            return service.config;
         });
      };

      service.getAuthorities = function () {
         return service._loadGroups().then(function () {
            return service.config.authorities;
         });
      };

      service.getGroups = function () {
         return service._loadGroups().then(function () {
            return service.config.groups;
         });
      };

      service.getFeatures = function () {
         return service._loadGroups().then(function () {
            return service.config.features;
         });
      };

      service.getCounts = function () {
         return configService.getConfig("groups").then(function (_ref2) {
            var referenceDataCountsUrl = _ref2.referenceDataCountsUrl;

            return $http.get(referenceDataCountsUrl).then(function (_ref3) {
               var data = _ref3.data;

               // There are now three object within counts group, category and feature
               var counts = data.facet_counts.facet_fields;
               var response = {
                  feature: {},
                  category: {},
                  group: {},
                  authority: {}
               };
               var lastElement = void 0;

               ["feature", "category", "group", "authority"].forEach(function (key) {

                  counts[key].forEach(function (value, index) {
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
'use strict';

{
   angular.module('placenames.header', []).controller('headerController', ['$scope', '$q', '$timeout', function ($scope, $q, $timeout) {

      var modifyConfigSource = function modifyConfigSource(headerConfig) {
         return headerConfig;
      };

      $scope.$on('headerUpdated', function (event, args) {
         $scope.headerConfig = modifyConfigSource(args);
      });
   }]).directive('placenamesHeader', [function () {
      var defaults = {
         current: "none",
         heading: "ICSM",
         headingtitle: "ICSM",
         helpurl: "help.html",
         helptitle: "Get help about ICSM",
         helpalttext: "Get help about ICSM",
         skiptocontenttitle: "Skip to content",
         skiptocontent: "Skip to content",
         quicklinksurl: "/search/api/quickLinks/json?lang=en-US"
      };
      return {
         transclude: true,
         restrict: 'EA',
         templateUrl: "header/header.html",
         scope: {
            current: "=",
            breadcrumbs: "=",
            heading: "=",
            headingtitle: "=",
            helpurl: "=",
            helptitle: "=",
            helpalttext: "=",
            skiptocontenttitle: "=",
            skiptocontent: "=",
            quicklinksurl: "="
         },
         link: function link(scope, element, attrs) {
            var data = angular.copy(defaults);
            angular.forEach(defaults, function (value, key) {
               if (!(key in scope)) {
                  scope[key] = value;
               }
            });
         }
      };
   }]);
}
'use strict';

{
   angular.module("placenames.pill", []).directive('placenamesPill', ['searchService', function (searchService) {
      return {
         restrict: 'EA',
         templateUrl: "pill/pill.html",
         scope: {
            item: "=",
            update: "&",
            name: "@?"
         },
         link: function link(scope) {
            if (scope.item.label) {
               scope.label = scope.item.label.charAt(0).toUpperCase() + scope.item.label.slice(1) + ": ";
            }

            if (!scope.name) {
               scope.name = "name";
            }
            scope.deselect = function () {
               scope.item.selected = false;
               searchService.filtered();
            };
         }
      };
   }]);
}
'use strict';

{
   angular.module('placenames.altthemes', ['placenames.storage'])

   /**
      *
      * Override the original mars user.
      *
        */
   .directive('altThemes', ['altthemesService', function (themesService) {
      return {
         restrict: 'AE',
         templateUrl: 'navigation/altthemes.html',
         scope: {
            current: "="
         },
         link: function link(scope) {
            themesService.getThemes().then(function (themes) {
               scope.themes = themes;
            });

            themesService.getCurrentTheme().then(function (theme) {
               scope.theme = theme;
            });

            scope.changeTheme = function (theme) {
               scope.theme = theme;
               themesService.setTheme(theme.key);
            };
         }
      };
   }]).controller('altthemesCtrl', ['altthemesService', function (altthemesService) {
      this.service = altthemesService;
   }]).filter('altthemesFilter', function () {
      return function (features, theme) {
         var response = [];
         // Give 'em all if they haven't set a theme.
         if (!theme) {
            return features;
         }

         if (features) {
            features.forEach(function (feature) {
               if (feature.themes) {
                  if (feature.themes.some(function (name) {
                     return name === theme.key;
                  })) {
                     response.push(feature);
                  }
               }
            });
         }
         return response;
      };
   }).factory('altthemesService', ['$q', '$http', 'storageService', function ($q, $http, storageService) {
      var THEME_PERSIST_KEY = 'placenames.current.theme';
      var THEMES_LOCATION = 'placenames/resources/config/themes.json';
      var DEFAULT_THEME = "All";
      var waiting = [];
      var self = this;

      this.themes = [];
      this.theme = null;

      storageService.getItem(THEME_PERSIST_KEY).then(function (value) {
         if (!value) {
            value = DEFAULT_THEME;
         }
         $http.get(THEMES_LOCATION, { cache: true }).then(function (response) {
            var themes = response.data.themes;

            self.themes = themes;
            self.theme = themes[value];
            // Decorate the key
            angular.forEach(themes, function (theme, key) {
               theme.key = key;
            });
            waiting.forEach(function (wait) {
               wait.resolve(self.theme);
            });
         });
      });

      this.getCurrentTheme = function () {
         if (this.theme) {
            return $q.when(self.theme);
         } else {
            var waiter = $q.defer();
            waiting.push(waiter);
            return waiter.promise;
         }
      };

      this.getThemes = function () {
         return $http.get(THEMES_LOCATION, { cache: true }).then(function (response) {
            return response.data.themes;
         });
      };

      this.setTheme = function (key) {
         this.theme = this.themes[key];
         storageService.setItem(THEME_PERSIST_KEY, key);
      };

      return this;
   }]).filter('altthemesEnabled', function () {
      return function (headers) {
         if (headers) {
            return headers.filter(function (value) {
               return !!value.enabled;
            });
         }
         return headers;
      };
   }).filter('altthemesMatchCurrent', function () {
      return function (headers, current) {
         if (headers) {
            return headers.filter(function (value) {
               return !!value.keys.find(function (key) {
                  return key === current;
               });
            });
         }
         return headers;
      };
   });
}
'use strict';

{
   angular.module('placenames.navigation', ['placenames.altthemes'])
   /**
    *
    * Override the original mars user.
    *
    */
   .directive('placenamesNavigation', [function () {
      return {
         restrict: 'AE',
         template: "<alt-themes current='current'></alt-themes>",
         scope: {
            current: "=?"
         },
         link: function link(scope) {
            scope.username = "Anonymous";
            if (!scope.current) {
               scope.current = "none";
            }
         }
      };
   }]).factory('navigationService', [function () {
      return {};
   }]);
}
'use strict';

{
   angular.module("placenames.quicksearch", ['placenames.pill']).directive('placenamesQuicksearch', [function () {
      return {
         link: function link(scope) {},
         templateUrl: "quicksearch/quicksearch.html"
      };
   }]).directive('placenamesFilteredSummary', ["searchService", function (searchService) {
      return {
         scope: {
            state: "="
         },
         templateUrl: "quicksearch/filteredsummary.html",
         link: function link(scope) {
            scope.summary = searchService.summary;
         }
      };
   }]).filter("quicksummary", [function () {
      return function (items, key) {
         return items.map(function (item) {
            return item[key] + "(" + item.count + ")";
         }).join(", ");
      };
   }]);
}
'use strict';

{
   angular.module('placenames.reset', []).directive('resetPage', function ($window) {
      return {
         restrict: 'AE',
         scope: {},
         templateUrl: 'reset/reset.html',
         controller: ['$scope', function ($scope) {
            $scope.reset = function () {
               $window.location.reload();
            };
         }]
      };
   });
}
'use strict';

{
   angular.module("placenames.search", ['placenames.authorities', 'placenames.groups']).directive('placenamesClear', ['searchService', function (searchService) {
      return {
         link: function link(scope, element) {
            searchService.onMapUpdate(listening);
            function listening() {
               if (element.is(":focus")) {
                  var e = $.Event("keydown");
                  e.which = 27; // # Some key code value
                  element.trigger(e);
                  element.blur();
               }
            }
         }
      };
   }]).directive('placenamesSearchFilters', ["groupsService", "searchService", function (groupsService, searchService) {
      var groupMatch = {
         group: "groups",
         category: "categories",
         feature: "features"
      };

      return {
         templateUrl: "search/searchfilters.html",
         link: function link(scope) {
            scope.summary = searchService.summary;
            scope.data = searchService.data;
         }
      };
   }]).directive('placenamesOptions', ['searchService', function (searchService) {
      return {
         link: function link(scope) {
            scope.leave = function () {
               searchService.hide();
            };

            scope.enter = function () {
               searchService.show(scope.match.model);
            };

            scope.$destroy = function () {
               searchService.hide();
            };
         }
      };
   }]).directive("placenamesQuickSearch", ['$rootScope', '$timeout', 'groupsService', 'searchService', function ($rootScope, $timeout, groupsService, searchService) {
      return {
         templateUrl: 'search/quicksearch.html',
         restrict: 'AE',
         link: function link(scope) {
            scope.state = searchService.data;

            scope.loadDocs = function () {
               return searchService.filtered().then(function (fetched) {
                  return fetched.response.docs;
               });
            };

            scope.clear = function () {
               scope.state.searched = null;
               $timeout(function () {
                  $rootScope.$broadcast("clear.button.fired");
               }, 10);
            };

            scope.search = function search(item) {
               scope.showFilters = false;
               searchService.search(item);
               $timeout(function () {
                  $rootScope.$broadcast("search.button.fired");
               }, 100);
            };
         }
      };
   }]).directive("placenamesSearch", ['$timeout', 'groupsService', 'searchService', function ($timeout, groupsService, searchService) {
      return {
         templateUrl: 'search/search.html',
         restrict: 'AE',
         link: function link(scope) {
            scope.state = searchService.data;
            scope.status = {};

            scope.$watch("state.searched", function (newVal, oldVal) {
               if (!newVal && oldVal) {
                  searchService.filtered();
               }
            });

            searchService.filtered();
            scope.update = function () {
               searchService.filtered();
            };

            scope.loadOnEmpty = function () {
               if (!scope.state.filter) {
                  searchService.filtered();
               }
            };

            scope.select = function (item) {
               scope.search(item);
            };

            scope.deselect = function (facet) {
               facet.selected = false;
               searchService.filtered();
            };
         }
      };
   }]).filter('placenamesDocName', [function () {
      return function (docs) {
         return docs ? docs.map(function (doc) {
            return doc.name + " (" + doc.authorityId + ")";
         }) : [];
      };
   }]).filter('placenamesSomeSelected', [function () {
      return function (facets) {
         return facets ? Object.keys(facets).some(function (key) {
            return facets[key].selected;
         }) : false;
      };
   }]).filter('placenamesUnselectedFacets', [function () {
      return function (facets) {
         return !facets ? [] : facets.filter(function (facet) {
            return !facet.selected;
         });
      };
   }]).filter('placenamesSelectedFacets', [function () {
      return function (facets) {
         return !facets ? [] : facets.filter(function (facet) {
            return facet.selected;
         });
      };
   }]).filter('placenamesClean', [function () {
      return function (str) {
         return str.replace(/\s?[, ]\s?/g, " ");
      };
   }]).filter('placenamesTooltip', [function () {
      return function (model) {
         var buffer = "<div style='text-align:left'>";
         if (model.variant) {
            var variants = model.variant.split("|");
            variants.forEach(function (name, index) {
               buffer += index ? "" : "Also known as";
               buffer += (index && index < variants.length - 1 ? "," : "") + " ";
               if (index && index === variants.length - 1) {
                  buffer += "or ";
               }
               buffer += name;
            });
            buffer += "<br/>";
         }
         buffer += "Lat " + model.location.split(" ").reverse().join("&deg; Lng ") + "&deg;<br/>Feature type: " + model.feature + "</div>";

         return buffer;
      };
   }]);
}
'use strict';

{
   angular.module("placenames.side-panel", []).factory('panelSideFactory', ['$rootScope', '$timeout', function ($rootScope, $timeout) {
      var state = {
         left: {
            active: null,
            width: 0
         },

         right: {
            active: null,
            width: 0
         }
      };

      function setSide(state, value) {
         var response = state.active;

         if (response === value) {
            state.active = null;
            state.width = 0;
         } else {
            state.active = value;
         }
         return !response;
      }

      return {
         state: state,
         setLeft: function setLeft(value) {
            var result = setSide(state.left, value);
            if (result) {
               state.left.width = 320; // We have a hard coded width at the moment we will probably refactor to parameterize it.
            }
            return result;
         },

         setRight: function setRight(data) {
            state.right.width = data.width;
            var response = setSide(state.right, data.name);
            $rootScope.$broadcast('side.panel.change', {
               side: "right",
               data: state.right,
               width: data.width
            });
            return response;
         }
      };
   }]).directive('sidePanelRightOppose', ["panelSideFactory", function (panelSideFactory) {
      return {
         restrict: 'E',
         transclude: true,
         template: '<div class="contentContainer" ng-attr-style="right:{{right.width}}">' + '<ng-transclude></ng-transclude>' + '</div>',
         link: function link(scope) {
            scope.right = panelSideFactory.state.right;
         }
      };
   }]).directive('sidePanelRight', ["panelSideFactory", function (panelSideFactory) {
      return {
         restrict: 'E',
         transclude: true,
         templateUrl: 'side-panel/side-panel-right.html',
         link: function link(scope) {
            scope.right = panelSideFactory.state.right;

            scope.closePanel = function () {
               panelSideFactory.setRight({ name: null, width: 0 });
            };
         }
      };
   }]).directive('panelTrigger', ["panelSideFactory", function (panelSideFactory) {
      return {
         restrict: 'E',
         transclude: true,
         templateUrl: 'side-panel/trigger.html',
         scope: {
            default: "@?",
            panelWidth: "@",
            name: "@",
            iconClass: "@",
            panelId: "@"
         },
         link: function link(scope) {
            scope.toggle = function () {
               panelSideFactory.setRight({
                  width: scope.panelWidth,
                  name: scope.panelId
               });
            };
            if (scope.default) {
               panelSideFactory.setRight({
                  width: scope.panelWidth,
                  name: scope.panelId
               });
            }
         }
      };
   }]).directive('panelOpenOnEvent', ["$rootScope", "panelSideFactory", function ($rootScope, panelSideFactory) {
      return {
         restrict: 'E',
         scope: {
            panelWidth: "@",
            eventName: "@",
            panelId: "@",
            side: "@?"
         },
         link: function link(scope) {
            if (!scope.side) {
               scope.side = "right";
            }
            $rootScope.$on(scope.eventName, function (event, data) {
               var state = panelSideFactory.state[scope.side];
               if (state && !state.active) {
                  var params = {
                     width: scope.panelWidth,
                     name: scope.panelId
                  };

                  if (scope.side === "right") {
                     panelSideFactory.setRight(params);
                  } else {
                     panelSideFactory.setLeft(params);
                  }
               }
            });
         }
      };
   }]).directive('panelCloseOnEvent', ["$rootScope", "panelSideFactory", function ($rootScope, panelSideFactory) {
      return {
         restrict: 'E',
         scope: {
            eventName: "@",
            side: "@?"
         },
         link: function link(scope) {
            if (!scope.side) {
               scope.side = "right";
            }
            $rootScope.$on(scope.eventName, function (event, data) {
               var state = panelSideFactory.state[scope.side];
               if (state && state.active) {
                  var params = {
                     name: null
                  };

                  if (scope.side === "right") {
                     panelSideFactory.setRight(params);
                  } else {
                     panelSideFactory.setLeft(params);
                  }
               }
            });
         }
      };
   }]).directive('sidePanelLeft', ['panelSideFactory', function (panelSideFactory) {
      return {
         restrict: 'E',
         transclude: true,
         templateUrl: 'side-panel/side-panel-left.html',
         link: function link(scope) {
            scope.left = panelSideFactory.state.left;

            scope.closeLeft = function () {
               panelSideFactory.setLeft(null);
            };
         }
      };
   }]);
}
"use strict";

{

   angular.module("placenames.storage", []).factory("storageService", ['$log', '$q', function ($log, $q) {
      var project = "elvis.placenames";
      return {
         setGlobalItem: function setGlobalItem(key, value) {
            this._setItem("_system", key, value);
         },

         setItem: function setItem(key, value) {
            this._setItem(project, key, value);
         },

         _setItem: function _setItem(project, key, value) {
            $log.debug("Fetching state for key locally" + key);
            localStorage.setItem(project + "." + key, JSON.stringify(value));
         },

         getGlobalItem: function getGlobalItem(key) {
            return this._getItem("_system", key);
         },

         getItem: function getItem(key) {
            var deferred = $q.defer();
            this._getItem(project, key).then(function (response) {
               deferred.resolve(response);
            });
            return deferred.promise;
         },

         _getItem: function _getItem(project, key) {
            $log.debug("Fetching state locally for key " + key);
            var item = localStorage.getItem(project + "." + key);
            if (item) {
               try {
                  item = JSON.parse(item);
               } catch (e) {
                  // Do nothing as it will be a string
               }
            }
            return $q.when(item);
         }
      };
   }]);
}
'use strict';

{
   angular.module("placenames.zone", []).factory('zoneService', ['$http', '$q', 'configService', function ($http, $q, configService) {
      return {
         counts: function counts(searched) {
            var _this = this;

            return configService.getConfig("download").then(function (_ref) {
               var outCoordSys = _ref.outCoordSys;

               return _this.intersections(searched).then(function (results) {
                  var map = {};
                  results.forEach(function (container) {
                     map[container.zone.code] = container.intersections.response.numFound;
                  });

                  outCoordSys.forEach(function (sys) {
                     if (sys.extent) {
                        sys.intersects = map[sys.code] ? map[sys.code] : 0;
                     }
                  });
                  return outCoordSys.filter(function (sys) {
                     return !sys.extent || sys.intersects;
                  });
               });
            });
         },
         intersections: function intersections(searched) {
            return configService.getConfig().then(function (config) {
               var outCoordSys = config.download.outCoordSys;

               var zones = outCoordSys.filter(function (sys) {
                  return sys.extent;
               });
               var bounds = searched.bounds;
               var q = searched.params.q;
               var xMin = bounds.getWest();
               var xMax = bounds.getEast();
               var yMin = bounds.getSouth();
               var yMax = bounds.getNorth();

               var responses = zones.filter(function (zone) {
                  return xMin <= zone.extent.xMax && xMax >= zone.extent.xMin && yMin <= zone.extent.yMax && yMax >= zone.extent.yMin;
               }).map(function (zone) {
                  return {
                     zone: zone,
                     get bounds() {
                        return {
                           xMin: xMin > zone.extent.xMin ? xMin : zone.extent.xMin,
                           xMax: xMax < zone.extent.xMax ? xMax : zone.extent.xMax,
                           yMin: yMin > zone.extent.yMin ? yMin : zone.extent.yMin,
                           yMax: yMax < zone.extent.yMax ? yMax : zone.extent.yMax
                        };
                     },

                     get location() {
                        var bounds = this.bounds;
                        return "location:[" + bounds.yMin + "," + bounds.xMin + " TO " + bounds.yMax + "," + bounds.xMax + "]";
                     }
                  };
               });

               var template = config.zoneQueryTemplate + "&q=" + q;

               return $q.all(responses.map(function (response) {
                  return $http.get(template + "&fq=" + response.location).then(function (_ref2) {
                     var data = _ref2.data;

                     response.intersections = data;
                     return response;
                  });
               }));
            });
         }
      };
   }]);
}
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

{
   var RootCtrl = function RootCtrl(configService, mapService) {
      var _this = this;

      _classCallCheck(this, RootCtrl);

      this.map = mapService.map;
      configService.getConfig().then(function (data) {
         _this.data = data;
      });
   };

   RootCtrl.$invoke = ['configService', 'mapService'];

   angular.module("AntarcticApp", ['antarctic.australia', 'antarctic.clusters', 'antarctic.maps', 'antarctic.panes', "antarctic.search", 'antarctic.templates', 'antarctic.toolbar', 'explorer.config', 'explorer.confirm', 'explorer.enter', 'explorer.flasher', 'explorer.googleanalytics', 'explorer.info', 'explorer.message', 'explorer.modal', 'explorer.persist', 'explorer.version', 'placenames.contributors', 'placenames.groups', 'placenames.header', 'placenames.navigation', 'placenames.quicksearch', 'placenames.reset', 'placenames.search', 'placenames.side-panel', 'placenames.tree', 'exp.ui.templates', 'ui.bootstrap', 'ngAutocomplete', 'ngSanitize', 'page.footer'])

   // Set up all the service providers here.
   .config(['configServiceProvider', 'persistServiceProvider', 'projectsServiceProvider', 'versionServiceProvider', function (configServiceProvider, persistServiceProvider, projectsServiceProvider, versionServiceProvider) {
      configServiceProvider.location("placenames/resources/config/antarctic.json?v=4");
      configServiceProvider.dynamicLocation("placenames/resources/config/configclient.json?");
      versionServiceProvider.url("placenames/assets/package.json");
      persistServiceProvider.handler("local");
      projectsServiceProvider.setProject("placenames");
   }]).run(["searchService", function (searchService) {
      searchService.filtered();
   }]).controller("RootCtrl", RootCtrl).filter('bytes', function () {
      return function (bytes, precision) {
         if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
         if (typeof precision === 'undefined') precision = 0;
         var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
             number = Math.floor(Math.log(bytes) / Math.log(1024));
         return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) + ' ' + units[number];
      };
   }).factory("userService", [function () {
      return {
         login: noop,
         hasAcceptedTerms: noop,
         setAcceptedTerms: noop,
         getUsername: function getUsername() {
            return "anon";
         }
      };
      function noop() {
         return true;
      }
   }]);

   // A couple of polyfills for ie11
   if (!('every' in Array.prototype)) {
      Array.prototype.every = function (tester, that /*opt*/) {
         for (var i = 0, n = this.length; i < n; i++) {
            if (i in this && !tester.call(that, this[i], i, this)) return false;
         }return true;
      };
   }

   if (!Array.from) {
      Array.from = function () {
         var toStr = Object.prototype.toString;
         var isCallable = function isCallable(fn) {
            return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
         };
         var toInteger = function toInteger(value) {
            var number = Number(value);
            if (isNaN(number)) {
               return 0;
            }
            if (number === 0 || !isFinite(number)) {
               return number;
            }
            return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
         };
         var maxSafeInteger = Math.pow(2, 53) - 1;
         var toLength = function toLength(value) {
            var len = toInteger(value);
            return Math.min(Math.max(len, 0), maxSafeInteger);
         };

         // The length property of the from method is 1.
         return function from(arrayLike /*, mapFn, thisArg */) {
            // 1. Let C be the this value.
            var C = this;

            // 2. Let items be ToObject(arrayLike).
            var items = Object(arrayLike);

            // 3. ReturnIfAbrupt(items).
            if (arrayLike === null) {
               throw new TypeError('Array.from requires an array-like object - not null or undefined');
            }

            // 4. If mapfn is undefined, then let mapping be false.
            var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
            var T = void 0;
            if (typeof mapFn !== 'undefined') {
               // 5. else
               // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
               if (!isCallable(mapFn)) {
                  throw new TypeError('Array.from: when provided, the second argument must be a function');
               }

               // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
               if (arguments.length > 2) {
                  T = arguments[2];
               }
            }

            // 10. Let lenValue be Get(items, "length").
            // 11. Let len be ToLength(lenValue).
            var len = toLength(items.length);

            // 13. If IsConstructor(C) is true, then
            // 13. a. Let A be the result of calling the [[Construct]] internal method
            // of C with an argument list containing the single item len.
            // 14. a. Else, Let A be ArrayCreate(len).
            var A = isCallable(C) ? Object(new C(len)) : new Array(len);

            // 16. Let k be 0.
            var k = 0;
            // 17. Repeat, while k < len… (also steps a - h)
            var kValue = void 0;
            while (k < len) {
               kValue = items[k];
               if (mapFn) {
                  A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
               } else {
                  A[k] = kValue;
               }
               k += 1;
            }
            // 18. Let putStatus be Put(A, "length", len, true).
            A.length = len;
            // 20. Return A.
            return A;
         };
      }();
   }
}
'use strict';

{
   angular.module('antarctic.australia', []).directive('australiaView', function () {
      return {
         restrict: 'AE',
         scope: {},
         templateUrl: 'australia/australia.html',
         controller: ['$scope', function ($scope) {
            $scope.go = function () {
               window.location = "index.html";
            };
         }]
      };
   });
}
"use strict";

{
   angular.module("antarctic.clusters", []).directive("antarcticClusters", ["clusterService", function (clusterService) {
      return {
         link: function link() {
            clusterService.init();
         }
      };
   }]).factory("clusterService", ["$http", "$rootScope", "configService", "flashService", "mapService", function ($http, $rootScope, configService, flashService, mapService) {
      var service = {
         showClusters: true,
         sequence: 0,
         layer: null
      };

      service.init = function () {
         var _this = this;

         configService.getConfig("clusters").then(function (config) {
            mapService.getMap().then(function (map) {
               _this.map = map;
               _this.config = config;

               var self = _this;
               $rootScope.$on('pn.search.complete', movePan);
               $rootScope.$on('pn.search.start', hideClusters);

               function hideClusters() {
                  if (self.layer) {
                     self.flasher = flashService.add("Loading clusters", null, true);
                     self.map.removeLayer(self.layer);
                     self.layer = null;
                  }
               }

               function movePan(event, data) {
                  if (!self.showClusters) {
                     return;
                  }
                  self._refreshClusters(data);
               }
            });
         });
      };

      service._refreshClusters = function (response) {

         var geojsonMarkerOptions = {
            radius: 8,
            fillColor: "#ff0000",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
         };
         var options = {
            showCoverageOnHover: false,
            zoomToBoundsOnClick: false,
            singleMarkerMode: true,
            animate: false
         };

         var count = response.response.numFound;

         if (this.layer) {
            this.map.removeLayer(this.layer);
         }

         var layer = this.layer = L.layerGroup();
         var params = Object.assign({}, response.responseHeader.params);
         params.rows = count;

         var url = "select?" + Object.keys(params).filter(function (key) {
            return key.indexOf("facet") !== 0;
         }).map(function (key) {
            var obj = params[key];
            return (Array.isArray(obj) ? obj : [obj]).map(function (item) {
               return key + "=" + item;
            }).join("&");
         }).join("&");
         $http.get(url).then(function (result) {
            var docs = result.data.response.docs;
            docs.forEach(function (doc) {
               var coords = doc.location.split(" ");
               var date = new Date(doc.supplyDate);
               var dateStr = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();

               doc.title = '"' + doc.name + "\"is a " + doc.feature + " feature in the " + doc.category + "\ncategory which is in the " + doc.group + " group." + "\nThe authority is " + doc.authority + " and the data was supplied on " + dateStr + "\nLat / Lng: " + coords[1] + "° / " + coords[0] + "°";

               doc.zIndexOffset = 500;

               var marker = L.marker([+coords[1], +coords[0]], doc);
               layer.addLayer(marker);
            });
         });

         if (this.flasher) {
            this.flasher.remove();
         }
         this.layer.addTo(this.map);
      };

      return service;
   }]);
}
"use strict";

{
   angular.module("antarctic.panes", []).directive("antarcticPanes", ['$rootScope', '$timeout', 'mapService', function ($rootScope, $timeout, mapService) {
      return {
         templateUrl: "panes/panes.html",
         scope: {
            defaultItem: "@",
            data: "="
         },
         controller: ['$scope', function ($scope) {
            var changeSize = false;

            $scope.view = $scope.defaultItem;

            $rootScope.$on('side.panel.change', function (event) {
               emitter();
               $timeout(emitter, 100);
               $timeout(emitter, 200);
               $timeout(emitter, 300);
               $timeout(emitter, 500);
               function emitter() {
                  var evt = document.createEvent("HTMLEvents");
                  evt.initEvent("resize", false, true);
                  window.dispatchEvent(evt);
               }
            });

            $scope.setView = function (what) {
               var oldView = $scope.view;
               var delay = 0;

               if ($scope.view === what) {
                  if (what) {
                     changeSize = true;
                     delay = 1000;
                  }
                  $scope.view = "";
               } else {
                  if (!what) {
                     changeSize = true;
                  }
                  $scope.view = what;
               }

               $rootScope.$broadcast("view.changed", $scope.view, oldView);

               if (changeSize) {
                  mapService.getMap().then(function (map) {
                     map._onResize();
                  });
               }
            };
            $timeout(function () {
               $rootScope.$broadcast("view.changed", $scope.view, null);
            }, 50);
         }]
      };
   }]);
}
"use strict";

{
   /*
   Graticule plugin for Leaflet powered maps.
   */
   L.Graticule = L.GeoJSON.extend({

      options: {
         style: {
            color: '#333',
            weight: 1
         },
         interval: 20
      },

      initialize: function initialize(options) {
         L.Util.setOptions(this, options);
         this._layers = {};

         if (this.options.sphere) {
            this.addData(this._getFrame());
         } else {
            this.addData(this._getGraticule());
         }
      },

      _getFrame: function _getFrame() {
         return {
            "type": "Polygon",
            "coordinates": [this._getMeridian(-180).concat(this._getMeridian(180).reverse())]
         };
      },

      _getGraticule: function _getGraticule() {
         var features = [],
             interval = this.options.interval;

         // Meridians
         for (var lng = 0; lng <= 180; lng = lng + interval) {
            features.push(this._getFeature(this._getMeridian(lng), {
               "name": lng ? lng.toString() + "° E" : "Prime meridian"
            }));
            if (lng !== 0) {
               features.push(this._getFeature(this._getMeridian(-lng), {
                  "name": lng.toString() + "° W"
               }));
            }
         }

         // Parallels
         for (var lat = 0; lat <= 90; lat = lat + interval) {
            features.push(this._getFeature(this._getParallel(lat), {
               "name": lat ? lat.toString() + "° N" : "Equator"
            }));
            if (lat !== 0) {
               features.push(this._getFeature(this._getParallel(-lat), {
                  "name": lat.toString() + "° S"
               }));
            }
         }

         return {
            "type": "FeatureCollection",
            "features": features
         };
      },

      _getMeridian: function _getMeridian(lng) {
         lng = this._lngFix(lng);
         var coords = [];
         for (var lat = -90; lat <= 90; lat++) {
            coords.push([lng, lat]);
         }
         return coords;
      },

      _getParallel: function _getParallel(lat) {
         var coords = [];
         for (var lng = -180; lng <= 180; lng++) {
            coords.push([this._lngFix(lng), lat]);
         }
         return coords;
      },

      _getFeature: function _getFeature(coords, prop) {
         return {
            "type": "Feature",
            "geometry": {
               "type": "LineString",
               "coordinates": coords
            },
            "properties": prop
         };
      },

      _lngFix: function _lngFix(lng) {
         if (lng >= 180) return 179.999999;
         if (lng <= -180) return -179.999999;
         return lng;
      }

   });

   L.graticule = function (options) {
      return new L.Graticule(options);
   };
}
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

{
   var constrainMapToBounds = function constrainMapToBounds(map, crs, point) {
      map.on('move', function (e) {
         // Unproject the point for the current zoom level
         var maxPxPoint = map.project(crs.projection.unproject(point));

         // Get the current pixel bounds
         var b = map.getPixelBounds();

         // Do we break any of the pixel bounds constraints
         if (b.min.x < 0 || b.min.y < 0 || b.max.x > maxPxPoint.x || b.max.y > maxPxPoint.y) {
            var x, y;

            // The bounds of the map container
            var elB = document.querySelector('#mappo').getBoundingClientRect();

            if (maxPxPoint.x < elB.width) {
               // Map is smaller than container width
               x = maxPxPoint.x / 2;
            } else if (b.min.x < 0) {
               // Less than min
               x = elB.width / 2;
            } else if (b.max.x > maxPxPoint.x) {
               // Greater than max
               x = maxPxPoint.x - elB.width / 2;
            } else {
               // Get current
               x = map.project(map.getCenter()).x;
            }

            if (maxPxPoint.y < elB.height) {
               // Map is smaller than container height
               y = maxPxPoint.y / 2;
            } else if (b.min.y < 0) {
               // Less than min
               y = elB.height / 2;
            } else if (b.max.y > maxPxPoint.y) {
               // Greater than max
               y = maxPxPoint.y - elB.height / 2;
            } else {
               // Get current
               y = map.project(map.getCenter()).y;
            }

            // Reset the map position
            var pos = map.unproject(L.point(x, y));
            map.setView(pos, map.getZoom(), {
               // No animation because we are already scrolling
               animate: false
            });
         }
      });
   };

   var MapService = function () {
      function MapService(p) {
         _classCallCheck(this, MapService);

         this._promise = p;
         this._promises = [];
      }

      _createClass(MapService, [{
         key: 'getMap',
         value: function getMap() {
            if (this.map) {
               return this._promise.when(this.map);
            }

            var promise = this._promise.defer();
            this._promises.push(promise);
            return promise.promise;
         }
      }, {
         key: 'init',
         value: function init(div) {
            // Map resolutions that NASA GIBS specify
            var resolutions = [67733.46880027094, 33866.73440013547, 16933.367200067736, 8466.683600033868, 4233.341800016934, 2116.670900008467, 1058.3354500042335];

            var bounds = L.bounds([-24925916.518499706, -11159088.984844638], [24925916.518499706, 11159088.984844638]);

            // The polar projection
            var crs = new L.Proj.CRS('EPSG:3031', '+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs', {
               resolutions: resolutions,
               origin: [-30636100, 30636100],
               bounds: bounds
            });
            crs.distance = L.CRS.Earth.distance;
            crs.R = 6378137;
            crs.projection.bounds = bounds;

            var map = this.map = L.map(div, {
               center: [-90, 0],
               zoom: 2,
               maxZoom: 6,
               minZoom: 1,
               crs: crs
            });

            // Initialise bounds hack
            constrainMapToBounds(map, crs, L.point(4194304, -4194304));

            // This data is from the "Heroes of the Antarctic"
            // http://geoscience-au.maps.arcgis.com/apps/OnePane/storytelling_basic/index.html?appid=bb956e835f44421da9160b7557ba64a6
            var template = "https://tiles{s}.arcgis.com/tiles/wfNKYeHsOyaFyPw3/arcgis/rest/services/" + "Antarctic_Hillshade_and_Bathymetric_Base_Map_SSP/MapServer/tile/{z}/{y}/{x}";
            var options = {
               format: "image%2Fpng",
               tileSize: 256,
               subdomains: "1234",
               noWrap: true,
               continuousWorld: true,
               attribution: "<a href='http://www.ga.gov.au'>" + "Geoscience Australia</a>"
            };

            var layer = this.layer = L.tileLayer(template, options);

            // HACK: BEGIN
            // Leaflet does not yet handle these kind of projections nicely. Monkey
            // patch the getTileUrl function to ensure requests are within
            // tile matrix set boundaries.
            var superGetTileUrl = layer.getTileUrl;

            // From the metadata https://tiles.arcgis.com/tiles/wfNKYeHsOyaFyPw3/arcgis/rest/services/Antarctic_Hillshade_and_Bathymetric_Base_Map_SSP/MapServer
            var validTiles = {
               0: { min: 1, max: 2 },
               1: { min: 3, max: 4 },
               2: { min: 6, max: 8 },
               3: { min: 12, max: 16 },
               4: { min: 24, max: 32 },
               5: { min: 48, max: 64 },
               6: { min: 96, max: 129 },
               7: { min: 192, max: 259 },
               8: { min: 385, max: 519 }
            };
            layer.getTileUrl = function (coords) {
               var zoom = layer._getZoomForUrl();
               var max = validTiles[zoom].max;
               var min = validTiles[zoom].min;

               if (coords.x < min) {
                  return "";
               }
               if (coords.y < min) {
                  return "";
               }
               if (coords.x > max) {
                  return "";
               }
               if (coords.y > max) {
                  return "";
               }
               return superGetTileUrl.call(layer, coords);
            };
            // HACK: END


            map.addLayer(layer);
            window.map = map;

            // Module which adds graticule (lat/lng lines)
            // L.graticule().addTo(map);

            L.control.scale({ imperial: false }).addTo(map);

            L.control.mousePosition({
               position: "bottomright",
               emptyString: "",
               seperator: " ",
               latFormatter: function latFormatter(lat) {
                  return "Lat " + L.Util.formatNum(lat, 5) + "°";
               },
               lngFormatter: function lngFormatter(lng) {
                  return "Lng " + L.Util.formatNum(lng % 180, 5) + "°";
               }
            }).addTo(map);

            if (this._promises.length) {
               this._promises.forEach(function (promise) {
                  return promise.resolve(map);
               });
            }
            this._promises = [];
         }
      }]);

      return MapService;
   }();

   angular.module("antarctic.maps", []).directive("antarcticMaps", ["mapService", function (mapService) {
      return {
         restict: "AE",
         template: "<div id='mappo' style='height: 100%;'></div>",
         link: function link(scope) {
            scope.map = mapService.init("mappo");
         }
      };
   }]).service("mapService", ['$q', function ($q) {
      var service = new MapService($q);
      return service;
   }]);
}
'use strict';

{
   L.Control.MousePosition = L.Control.extend({
      options: {
         position: 'bottomleft',
         separator: ' : ',
         emptyString: 'Unavailable',
         lngFirst: false,
         numDigits: 5,
         elevGetter: undefined,
         lngFormatter: undefined,
         latFormatter: undefined,
         prefix: ""
      },

      onAdd: function onAdd(map) {
         this._container = L.DomUtil.create('div', 'leaflet-control-mouseposition');
         L.DomEvent.disableClickPropagation(this._container);
         map.on('mousemove', this._onMouseMove, this);
         this._container.innerHTML = this.options.emptyString;
         return this._container;
      },

      onRemove: function onRemove(map) {
         map.off('mousemove', this._onMouseMove);
      },

      _onMouseHover: function _onMouseHover() {
         var info = this._hoverInfo;
         this._hoverInfo = undefined;
         this.options.elevGetter(info).then(function (elevStr) {
            if (this._hoverInfo) return; // a new _hoverInfo was created => mouse has moved meanwhile
            this._container.innerHTML = this.options.prefix + ' ' + elevStr + ' ' + this._latLngValue;
         }.bind(this));
      },

      _onMouseMove: function _onMouseMove(e) {
         var w = e.latlng.wrap();
         var lng = this.options.lngFormatter ? this.options.lngFormatter(w.lng) : L.Util.formatNum(w.lng, this.options.numDigits);
         var lat = this.options.latFormatter ? this.options.latFormatter(w.lat) : L.Util.formatNum(w.lat, this.options.numDigits);

         var sw = proj4("EPSG:4326", "EPSG:3031", [w.lng, w.lat]);

         this._latLngValue = this.options.lngFirst ? lng + this.options.separator + lat : lat + this.options.separator + lng;
         if (this.options.elevGetter) {
            if (this._hoverInfo) window.clearTimeout(this._hoverInfo.timeout);
            this._hoverInfo = {
               lat: w.lat,
               lng: w.lng,
               timeout: window.setTimeout(this._onMouseHover.bind(this), 400)
            };
         }
         this._container.innerHTML = this.options.prefix + ' ' + this._latLngValue + " " + sw[1].toFixed(0) + "m, " + sw[0].toFixed(0) + "m";
      }

   });

   L.Map.mergeOptions({
      positionControl: false
   });

   L.Map.addInitHook(function () {
      if (this.options.positionControl) {
         this.positionControl = new L.Control.MousePosition();
         this.addControl(this.positionControl);
      }
   });

   L.control.mousePosition = function (options) {
      return new L.Control.MousePosition(options);
   };
}
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

{
   angular.module("antarctic.search", []).factory('searchService', SearchService);

   SearchService.$inject = ['$http', '$rootScope', '$timeout', 'configService', 'groupsService', 'mapService'];
}

function SearchService($http, $rootScope, $timeout, configService, groupsService, mapService) {
   var data = {
      searched: null // Search results
   };

   var countsMapping = {
      group: "groups",
      authority: "authorities",
      feature: "features",
      category: "categories"
   };

   var summary = {};
   var mapListeners = [];

   var results = void 0;
   var marker = void 0;

   var service = {
      onMapUpdate: function onMapUpdate(listener) {
         mapListeners.push(listener);
      },
      offMapUpdate: function offMapUpdate(listener) {
         delete mapListeners[listener];
      },


      get data() {
         return data;
      },

      get summary() {
         return summary;
      },

      filtered: function filtered() {
         return _filtered().then(function (response) {
            data.filtered = response;
            var params = response.responseHeader.params;
            filteredAuthorities(params);
            filteredCurrent(params);
            return response;
         });
      },
      request: function request(params) {
         return _request(params);
      },
      search: function search(item) {
         var _this = this;

         if (item) {
            select(item.recordId).then(function () {
               return _this.searched();
            });
         } else {
            this.searched();
         }
      },
      persist: function persist(params, response) {
         data.persist = {
            params: params,
            data: response
         };
         return mapService.getMap().then(function (map) {
            return data.persist.bounds = map.getBounds();
         });
      },
      searched: function searched() {
         data.searched = data.persist;
         this.hide();
      },
      show: function show(what) {
         this.hide().then(function (map) {
            // split lng/lat string seperated by space, reverse to lat/lng, cooerce to numbers
            var location = what.location.split(" ").reverse().map(function (str) {
               return +str;
            });
            marker = L.popup().setLatLng(location).setContent(what.name + "<br/>Lat/Lng: " + location[0] + "&deg;" + location[1] + "&deg;").openOn(map);
         });
      },
      hide: function hide(what) {
         return mapService.getMap().then(function (map) {
            if (marker) {
               map.removeLayer(marker);
            }
            return map;
         });
      }
   };

   mapService.getMap().then(function (map) {
      var timeout = void 0;
      var facets = {
         facet: true,
         "facet.field": "feature"
      };

      map.on('resize moveend viewreset', update);

      function update() {
         $rootScope.$broadcast('pn.search.start');
         $timeout.cancel(timeout);
         if (!data.searched) {
            timeout = $timeout(function () {
               service.filtered();
            }, 20);
            mapListeners.forEach(function (listener) {
               listener();
            });
         } else {
            $rootScope.$broadcast('pn.search.complete', data.searched.data);
         }
      }
   });

   // We replace the search parameters like filters with a unique record ID.
   function select(recordId) {
      return createParams().then(function (params) {
         params.q = "recordId:" + recordId;
         return run(params).then(function (response) {
            return service.persist(params, response).then(function () {
               decorateCounts(response.facet_counts.facet_fields);
               $rootScope.$broadcast('pn.search.complete', response);
               return response;
            });
         });
      });
   }

   function _filtered() {
      return createParams().then(function (params) {
         return run(params).then(function (response) {
            return service.persist(params, response).then(function () {
               decorateCounts(response.facet_counts.facet_fields);
               $rootScope.$broadcast('pn.search.complete', response);
               return response;
            });
         });
      });
   }

   function decorateCounts(facets) {
      groupsService.getAll().then(function (response) {

         summary.counts = arraysToMap(facets);

         response.authorities.forEach(function (auth) {
            auth.count = summary.counts.authorities[auth.code];
            auth.count = auth.count ? auth.count : 0;
         });

         ["groups", "features", "categories"].forEach(function (key) {
            response[key].forEach(function (item) {
               item.count = summary.counts[key][item.name];
               item.count = item.count ? item.count : 0;
            });
         });
         console.log("TODO apply counts", response);
      });
   }

   function arrayToMap(facets) {
      var lastElement = void 0;
      var counts = {};

      facets.forEach(function (value, index) {
         if (index % 2) {
            counts[lastElement] = value;
         } else {
            lastElement = value;
         }
      });
      return counts;
   }

   function arraysToMap(facets) {
      var lastElement = void 0;
      var counts = {};
      Object.values(countsMapping).forEach(function (value) {
         counts[value] = {};
      });

      Object.keys(facets).forEach(function (key) {
         facets[key].forEach(function (value, index) {
            if (index % 2) {
               counts[countsMapping[key]][lastElement] = value;
            } else {
               lastElement = value;
            }
         });
      });
      return counts;
   }

   function createSummary() {
      return mapService.getMap().then(function (map) {
         return groupsService.getAll().then(function (response) {
            var filterIsObject = _typeof(data.filter) === "object";
            var summary = service.summary;
            summary.filter = filterIsObject ? data.filter.name : data.filter;
            summary.bounds = map.getBounds();
            summary.authorities = response.authorities.filter(function (auth) {
               return auth.selected;
            });
            summary.current = [];
            response.groups.forEach(function (group) {
               return summary.current = summary.current.concat(group.selections());
            });
            return summary;
         });
      });
   }

   function createParams() {
      return createSummary().then(function (summary) {
         var params = baseParameters();
         var bounds = summary.bounds;

         params.fq = getBounds(bounds);
         params.sort = getSort(bounds);
         params.q = createQText(summary);

         var qs = createCurrentParams();
         var qas = createAuthorityParams();

         if (qas.length) {
            params.q += ' AND (' + qas.join(" ") + ')';
         }

         if (qs.length) {
            params.q += ' AND (' + qs.join(" ") + ')';
         }
         return params;
      });
   }

   function createQText(summary) {
      var q = summary.filter;
      return q ? '*' + q.toLowerCase() : "*:*";
   }

   function filteredAuthorities(params) {
      return groupsService.getAuthorities().then(function (authorities) {
         if (summary.authorities && summary.authorities.length) {
            // We need get the facets as though no authorities are selected Select against Solr
            var newParams = authBaseParameters();

            var qs = createCurrentParams();
            if (qs.length) {
               newParams.q += ' AND (' + qs.join(" ") + ')';
            }
            newParams.q = createQText(summary);
            newParams.fq = params.fq;

            return _request(newParams).then(function (data) {
               var countMap = arrayToMap(data.facet_counts.facet_fields.authority);
               authorities.forEach(function (auth) {
                  auth.allCount = countMap[auth.code];
               });

               data.facetCounts = {};
               console.log("auth counts", data, summary);
               return data;
            });
         } else {
            // Otherwise we can just use the normal counts to set the allCounts
            authorities.forEach(function (auth) {
               auth.allCount = summary.counts.authorities[auth.code];
            });
            return null;
         }
      });
   }

   function filteredCurrent(params) {
      if (summary.current && summary.current.length) {
         return groupsService.getGroups().then(function (groups) {

            // We need get the facets as though no filters are selected. Select against Solr
            var newParams = typeBaseParameters(["group", "category", "feature"]);
            newParams.q = createQText(summary);
            var qs = createAuthorityParams();
            if (qs.length) {
               newParams.q += ' AND (' + qs.join(" ") + ')';
            }
            newParams.fq = params.fq;

            return _request(newParams).then(function (data) {
               var groupMap = arrayToMap(data.facet_counts.facet_fields.group);
               var categoryMap = arrayToMap(data.facet_counts.facet_fields.category);
               var featureMap = arrayToMap(data.facet_counts.facet_fields.feature);
               groups.forEach(function (group) {
                  group.allCount = groupMap[group.name];
                  group.categories.forEach(function (category) {
                     category.allCount = categoryMap[category.name];
                     category.features.forEach(function (feature) {
                        feature.allCount = featureMap[feature.name];
                     });
                  });
               });

               data.facetCounts = {};
               console.log("oth counts", data, summary);
               return data;
            });
         });
      } else {
         // Otherwise we can just decorate the counts in from the bigger query to set the all counts
         if (summary.filterBy) {
            return groupsService[{ group: "getGroups", category: "getCategories", feature: "getFeatures" }[summary.filterBy]]().then(function (items) {
               items.forEach(function (item) {
                  item.allCount = summary.counts[{ group: "groups", category: "categories", feature: "features" }[summary.filterBy]][item.name];
               });
            });
         }
      }
   }

   // We assume summary is already made.
   function createAuthorityParams() {
      return summary.authorities.map(function (auth) {
         return 'authority:' + auth.code;
      });
   }

   // We assume
   // Current is one of group category or feature, which ever panel is open.
   function createCurrentParams() {
      return summary.current.map(function (item) {
         return item.label + ':"' + item.name + '"';
      });
   }

   function run(params) {
      return _request(params).then(function (data) {
         var code = void 0;
         data.facetCounts = {};
         $rootScope.$broadcast("pn.facets.changed", data.facet_counts.facet_fields);

         return data;
      });
   }

   function _request(params) {
      return $http({
         url: "/select?",
         method: "GET",
         params: params,
         cache: true
      }).then(function (response) {
         return response.data;
      });
   }

   function getSort(bounds) {
      return "";
   }

   function getBounds(bounds) {
      /*
      const MAX_LENGTH = 3700000; // 3,700km radius?
      let sw = proj4("EPSG:4326", "EPSG:3031", [bounds.getWest(), bounds.getSouth()]);
      let ne = proj4("EPSG:4326", "EPSG:3031", [bounds.getEast(), bounds.getNorth()]);
        // Lng
      let xLow = limitBetween(sw[0], MAX_LENGTH).toFixed(0);
      let xMax = limitBetween(ne[0], MAX_LENGTH).toFixed(0);
        // Lat
      let yLow = limitBetween(sw[1], MAX_LENGTH).toFixed(0);
      let yMax = limitBetween(ne[1], MAX_LENGTH).toFixed(0);
      */
      var bounds = map.getPixelBounds();

      var sw = map.unproject(bounds.getBottomLeft());
      var ne = map.unproject(bounds.getTopRight());

      var size = map.getSize();
      var ne_p = map.options.crs.project(ne);
      var sw_p = map.options.crs.project(sw);

      return ["xPolar:[" + sw_p.x + " TO " + ne_p.x + "]", // Long
      "yPolar:[" + sw_p.y + " TO " + ne_p.y + "]" // Lat
      ];

      function limitBetween(value, limit) {
         var sign = value < 0 ? -1 : 1;
         var acc = Math.abs(value);
         return sign * (acc < limit ? acc : limit);
      }
   }

   function authBaseParameters() {
      return {
         facet: true,
         "facet.field": ["authority"],
         rows: 0,
         wt: "json"
      };
   }

   function typeBaseParameters(types) {
      var response = {
         "facet.limit": -1,
         facet: true,
         rows: 0,
         wt: "json"
      };
      if (types) {
         response["facet.field"] = types;
      }
      return response;
   }

   function baseParameters() {
      return {
         "facet.limit": -1,
         facet: true,
         "facet.field": ["feature", "category", "authority", "group"],
         rows: 50,
         wt: "json"
      };
   }

   return service;
}
"use strict";

{

   angular.module("antarctic.toolbar", []).directive("antarcticToolbar", [function () {
      return {
         templateUrl: "toolbar/toolbar.html",
         controller: 'toolbarLinksCtrl',
         transclude: true
      };
   }]).controller("toolbarLinksCtrl", ["$scope", "configService", function ($scope, configService) {
      var self = this;
      configService.getConfig().then(function (config) {
         self.links = config.toolbarLinks;
      });

      $scope.item = "";
      $scope.toggleItem = function (item) {
         $scope.item = $scope.item === item ? "" : item;
      };
   }]);
}
angular.module("antarctic.templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("australia/australia.html","<button type=\"button\" class=\"map-tool-toggle-btn\" ng-click=\"go()\" title=\"Change to the view of greater Australia\">\r\n   <span>Australia View</span>\r\n</button>");
$templateCache.put("panes/panes.html","<div class=\"mapContainer\" class=\"col-md-12\" style=\"padding-right:0\">\r\n   <antarctic-maps></antarctic-maps>\r\n</div>");
$templateCache.put("side-panel/side-panel-left.html","<div class=\"cbp-spmenu cbp-spmenu-vertical cbp-spmenu-left\" style=\"width: {{left.width}}px;\" ng-class=\"{\'cbp-spmenu-open\': left.active}\">\r\n    <a href=\"\" title=\"Close panel\" ng-click=\"closeLeft()\" style=\"z-index: 1200\">\r\n        <span class=\"glyphicon glyphicon-chevron-left pull-right\"></span>\r\n    </a>\r\n    <div ng-show=\"left.active === \'legend\'\" class=\"left-side-menu-container\">\r\n        <legend url=\"\'img/AustralianTopogaphyLegend.png\'\" title=\"\'Map Legend\'\"></legend>\r\n    </div>\r\n</div>");
$templateCache.put("side-panel/side-panel-right.html","<div class=\"cbp-spmenu cbp-spmenu-vertical cbp-spmenu-right noPrint\" ng-attr-style=\"width:{{right.width}}\" ng-class=\"{\'cbp-spmenu-open\': right.active}\">\r\nHello worlds\r\n</div>\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n");
$templateCache.put("toolbar/toolbar.html","<div class=\"placenames-toolbar noPrint\">\r\n    <div class=\"toolBarContainer\">\r\n        <div>\r\n            <ul class=\"left-toolbar-items\">\r\n               <li>\r\n                  <australia-view></australia-view>\r\n               </li>\r\n            </ul>\r\n            <ul class=\"right-toolbar-items\">\r\n                <li>\r\n                    <panel-trigger panel-id=\"search\" panel-width=\"540px\" name=\"Search Results\" icon-class=\"fa-list\" title=\"When a search has completed this allows the showing and hiding of the results\">\r\n                        <placenames-results-summary state=\"state\"></placenames-results-summary>\r\n                    </panel-trigger>\r\n                </li>\r\n                <li reset-page></li>\r\n            </ul>\r\n        </div>\r\n    </div>\r\n</div>");
$templateCache.put("authorities/authorities.html","<div ng-repeat=\"item in authorities\" style=\"width:49%; display:inline-block\">\r\n   <div class=\"ellipsis\" title=\'Jurisdiction: {{item.jurisdiction}}, Authority name: {{item.name}}\'>\r\n      <input type=\"checkbox\" ng-click=\"update()\" ng-model=\"item.selected\" ng-change=\"change()\">\r\n      <span>\r\n         <a target=\"_blank\" href=\"http://www.google.com/search?q={{item.name}}\">{{item.code}}</a>\r\n         ({{(item.allCount | number) + (item.allCount || item.allCount == 0?\' of \':\'\')}}{{item.total | number}})\r\n      </span>\r\n   </div>\r\n</div>");
$templateCache.put("categories/categories.html","<div>\r\n   <div ng-repeat=\"category in categories | orderBy: \'name\'\" ng-attr-title=\"{{category.definition}}\">\r\n      <input type=\"checkbox\" ng-model=\"category.selected\" ng-change=\"change()\">\r\n      <span title=\"[Group: {{category.parent.name}}], {{category.definition}}\">\r\n         {{category.name}}\r\n         ({{(category.allCount | number) + (category.allCount || category.allCount == 0?\' of \':\'\')}}{{category.total}})\r\n      </span>\r\n      <button class=\"undecorated\" ng-click=\"category.showChildren = !category.showChildren\">\r\n         <i class=\"fa fa-lg\" ng-class=\"{\'fa-question-circle-o\':!category.showChildren, \'fa-minus-square-o\': category.showChildren}\"></i>\r\n      </button>\r\n      <div ng-show=\"category.showChildren\" style=\"padding-left: 8px; border-bottom: solid 1px lightgray\">\r\n         <div>[Group: {{category.parent.name}}]\r\n         <div ng-if=\"category.definition\">{{category.definition}}</div>\r\n         It includes the following feature types:\r\n         <placenames-category-children features=\"category.features\"></placenames-category-children>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("categories/features.html","<div>\n   <div ng-repeat=\"feature in features\" style=\"padding-left:10px\" title=\"{{feature.definition}}\">\n      - {{feature.name}} ({{feature.total}})\n   </div>\n</div>");
$templateCache.put("contributors/contributors.html","<span class=\"contributors\" ng-mouseenter=\"over()\" ng-mouseleave=\"out()\" style=\"z-index:1500\"\r\n      ng-class=\"(contributors.show || contributors.ingroup || contributors.stick) ? \'transitioned-down\' : \'transitioned-up\'\">\r\n   <button class=\"undecorated contributors-unstick\" ng-click=\"unstick()\" style=\"float:right\">X</button>\r\n   <div ng-repeat=\"contributor in contributors.orgs | activeContributors\" style=\"text-align:cnter\">\r\n      <a ng-href=\"{{contributor.href}}\" name=\"contributors{{$index}}\" title=\"{{contributor.title}}\" target=\"_blank\">\r\n         <img ng-src=\"{{contributor.image}}\" alt=\"{{contributor.title}}\" class=\"elvis-logo\" ng-class=\"contributor.class\"></img>\r\n      </a>\r\n   </div>\r\n</span>");
$templateCache.put("contributors/show.html","<a ng-mouseenter=\"over()\" ng-mouseleave=\"out()\" class=\"contributors-link\" title=\"Click to lock/unlock contributors list.\"\r\n      ng-click=\"toggleStick()\" href=\"#contributors0\">Contributors</a>");
$templateCache.put("features/features.html","<div>\r\n      <div ng-repeat=\"feature in features | orderBy: \'name\'\" title=\"{{feature.definition}}\">\r\n         <input type=\"checkbox\" ng-model=\"feature.selected\" ng-change=\"change()\">\r\n         <span title=\"[Group/category: {{feature.parent.parent.name}}/{{feature.parent.name}}], {{feature.definition}}\">\r\n            {{feature.name}} ({{(feature.allCount | number) + (feature.allCount || feature.allCount == 0?\' of \':\'\')}}{{feature.total}})\r\n         </span>\r\n         <button class=\"undecorated\" ng-click=\"feature.showChildren = !feature.showChildren\">\r\n            <i class=\"fa fa-lg\" ng-class=\"{\'fa-question-circle-o\':!feature.showChildren, \'fa-minus-square-o\': feature.showChildren}\"></i>\r\n         </button>\r\n         <div ng-show=\"feature.showChildren\" style=\"padding-left: 8px; border-bottom: solid 1px lightgray\">\r\n            <div ng-if=\"feature.definition\">{{feature.definition}}</div>\r\n            [Group/Category: {{feature.parent.parent.name}}/{{feature.parent.name}}]\r\n         </div>\r\n      </div>\r\n   </div>");
$templateCache.put("filters/tree.html","<div style=\"max-height:300px; overflow-y:auto;padding-left:10px\">\r\n   <div ng-repeat=\"group in groups | withTotals\">\r\n      <button class=\"undecorated\" ng-click=\"group.expanded = !group.expanded\" ng-style=\"{color:group.color}\">\r\n         <i class=\"fa\" ng-class=\"{\'fa-plus\':!group.expanded, \'fa-minus\':group.expanded}\"></i>\r\n      </button>\r\n      <input type=\"checkbox\" class=\"filters-check\" ng-model=\"group.selectExpand\" ng-change=\"change(group)\" ng-style=\"{color:group.color}\">\r\n      <span title=\"{{group.definition}}\">\r\n         {{group.name}} ({{(group.allCount | number) + (group.allCount || group.allCount == 0?\' of \':\'\')}}{{group.total | number}})\r\n      </span>\r\n      <div style=\"padding-left:10px\" ng-show=\"group.expanded\">\r\n         <div ng-repeat=\"category in group.categories | withTotals | orderBy: \'name\'\"  ng-attr-title=\"{{category.definition}}\">\r\n            <button class=\"undecorated\" ng-click=\"category.expanded = !category.expanded\" ng-style=\"{color:category.color}\">\r\n               <i class=\"fa\" ng-class=\"{\'fa-plus\':!category.expanded, \'fa-minus\':category.expanded}\"></i>\r\n            </button>\r\n            <input class=\"filters-check\" type=\"checkbox\" ng-model=\"category.selectExpand\" ng-change=\"change()\" ng-style=\"{color:category.color}\">\r\n            <span title=\"{{category.definition}}\">\r\n               {{category.name}}\r\n               ({{(category.allCount | number) + (category.allCount || category.allCount == 0?\' of \':\'\')}}{{category.total}})\r\n            </span>\r\n            <div ng-show=\"category.expanded\" style=\"padding-left:20px\">\r\n               <div ng-repeat=\"feature in category.features | withTotals | orderBy: \'name\'\"  ng-attr-title=\"{{feature.definition}}\">\r\n                  <i class=\"fa fa-hand-o-right\" aria-hidden=\"true\" ng-style=\"{color:feature.color}\"></i>\r\n                  <input class=\"filters-check\" type=\"checkbox\" ng-model=\"feature.selected\" ng-change=\"change()\" ng-style=\"{color:feature.color}\">\r\n                  <span>\r\n                     {{feature.name}}\r\n                     ({{(feature.allCount | number) + (feature.allCount || feature.allCount == 0?\' of \':\'\')}}{{feature.total}})\r\n                  </span>\r\n               </div>\r\n            </div>\r\n         </div>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("groups/category.html","\r\n<div style=\"padding-left:10px\">\r\n   - <span ng-attr-title=\"{{category.definition}}\">{{category.name}}</span>\r\n   <div ng-repeat=\"feature in category.features | orderBy:\'name\'\" style=\"padding-left:10px\">\r\n      - <span ng-attr-title=\"{{feature.definition}}\">{{feature.name}}</span>\r\n   </div>\r\n</div>\r\n");
$templateCache.put("groups/groups.html","<div>\r\n   <div ng-repeat=\"group in data.groups\">\r\n      <input type=\"checkbox\" ng-model=\"group.selected\" ng-change=\"change()\"><span title=\"{{group.definition}}\">\r\n         {{group.name}} ({{(group.allCount | number) + (group.allCount || group.allCount == 0?\' of \':\'\')}}{{group.total | number}})\r\n      <button class=\"undecorated\" ng-click=\"group.showChildren = !group.showChildren\">\r\n         <i class=\"fa fa-lg\" ng-class=\"{\'fa-question-circle-o\':!group.showChildren, \'fa-minus-square-o\': group.showChildren}\"></i>\r\n      </button>\r\n      <div ng-show=\"group.showChildren\" style=\"padding-left:8px\">\r\n         {{group.definition}}<br/><br/>\r\n         This group is made up of the following categories and feature types:\r\n         <div ng-repeat=\"category in group.categories\" style=\"padding-left:8px\">\r\n            <placenames-group-children category=\"category\"></placenames-group-children>\r\n         </div>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("header/header.html","<div class=\"container-full common-header\" style=\"padding-right:10px; padding-left:10px\">\r\n   <div class=\"navbar-header\">\r\n\r\n      <button type=\"button\" class=\"navbar-toggle\" data-toggle=\"collapse\" data-target=\".ga-header-collapse\">\r\n         <span class=\"sr-only\">Toggle navigation</span>\r\n         <span class=\"icon-bar\"></span>\r\n         <span class=\"icon-bar\"></span>\r\n         <span class=\"icon-bar\"></span>\r\n      </button>\r\n\r\n      <a href=\"/\" class=\"appTitle visible-xs\">\r\n         <h1 style=\"font-size:120%\">{{heading}}</h1>\r\n      </a>\r\n   </div>\r\n   <div class=\"navbar-collapse collapse ga-header-collapse\">\r\n      <ul class=\"nav navbar-nav\">\r\n         <li class=\"hidden-xs\">\r\n            <a href=\"/\">\r\n               <h1 class=\"applicationTitle\">{{heading}}</h1>\r\n            </a>\r\n         </li>\r\n      </ul>\r\n      <ul class=\"nav navbar-nav navbar-right nav-icons\">\r\n         <li role=\"menuitem\" style=\"padding-right:10px;position: relative;top: -3px;\">\r\n            <span class=\"altthemes-container\">\r\n               <span>\r\n                  <a title=\"Location INformation Knowledge platform (LINK)\" href=\"http://fsdf.org.au/\" target=\"_blank\">\r\n                     <img alt=\"FSDF\" src=\"placenames/resources/img/FSDFimagev4.0.png\" style=\"height: 66px\">\r\n                  </a>\r\n               </span>\r\n            </span>\r\n         </li>\r\n         <li placenames-navigation role=\"menuitem\" current=\"current\" style=\"padding-right:10px\"></li>\r\n         <li mars-version-display role=\"menuitem\"></li>\r\n         <li style=\"width:10px\"></li>\r\n      </ul>\r\n   </div>\r\n   <!--/.nav-collapse -->\r\n</div>\r\n<div class=\"contributorsLink\" style=\"position: absolute; right:7px; bottom:15px\">\r\n   <placenames-contributors-link></placenames-contributors-link>\r\n</div>\r\n<!-- Strap -->\r\n<div class=\"row\">\r\n   <div class=\"col-md-12\">\r\n      <div class=\"strap-blue\">\r\n      </div>\r\n      <div class=\"strap-white\">\r\n      </div>\r\n      <div class=\"strap-red\">\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("pill/pill.html","<span class=\"btn btn-primary pn-pill\" ng-style=\"item.color?{\'background-color\':item.color, \'padding-top\': \'3px\'}: {\'padding-top\': \'3px\'}\">\r\n   <span style=\"max-width:100px;display:inline-block\" title=\"{{label + item[name]}}\" class=\"ellipsis\">{{item[name]}}</span>\r\n   <span class=\"ellipsis\" style=\"max-width:100px;display:inline-block\">\r\n      ({{item.count?item.count:0 | number}})\r\n      <a ng-click=\"deselect()\" href=\"javascript:void(0)\" title=\"Remove from filters\">\r\n         <i class=\"fa fa-close fa-xs\" style=\"color: white\"></i>\r\n      </a>\r\n   </span>\r\n</span>");
$templateCache.put("navigation/altthemes.html","<span class=\"altthemes-container\">\r\n	<span ng-repeat=\"item in themes | altthemesMatchCurrent : current\">\r\n       <a title=\"{{item.label}}\" ng-href=\"{{item.url}}\" class=\"altthemesItemCompact\" target=\"_blank\">\r\n         <span class=\"altthemes-icon\" ng-class=\"item.className\"></span>\r\n       </a>\r\n    </li>\r\n</span>");
$templateCache.put("quicksearch/filteredsummary.html","<span class=\"placenames-filtered-summary-child\">\r\n   <span style=\"font-weight:bold; margin:5px;\">\r\n      Matched {{state.persist.data.response.numFound | number}}\r\n   </span>\r\n   <span ng-if=\"summary.authorities.length\">\r\n      <span style=\"font-weight:bold\">| For authorities:</span>\r\n      <placenames-pill ng-repeat=\"item in summary.authorities\" name=\"code\" item=\"item\" update=\"update()\"></placenames-pill>\r\n   </span>\r\n   <span ng-if=\"summary.current.length\">\r\n      <span style=\"font-weight:bold\"> | Filtered by {{summary.filterBy}}:</span>\r\n      <placenames-pill ng-repeat=\"item in summary.current\" item=\"item\" update=\"update()\"></placenames-pill>\r\n   </span>\r\n</span>");
$templateCache.put("quicksearch/quicksearch.html","<div class=\"quickSearch\" placenames-quick-search style=\"opacity:0.9\"></div>\r\n");
$templateCache.put("reset/reset.html","<button type=\"button\" class=\"map-tool-toggle-btn\" ng-click=\"reset()\" title=\"Reset page\">\r\n   <span class=\"hidden-sm\">Reset</span>\r\n   <i class=\"fa fa-lg fa-refresh\"></i>\r\n</button>");
$templateCache.put("search/quicksearch.html","<div class=\"search-text\">\r\n   <div class=\"input-group input-group-sm\">\r\n      <input type=\"text\" ng-model=\"state.filter\" placeholder=\"Match by feature name...\" ng-model-options=\"{ debounce: 300}\" typeahead-on-select=\"select($item, $model, $label)\"\r\n         ng-disabled=\"state.searched\" typeahead-template-url=\"search/typeahead.html\" class=\"form-control\" typeahead-min-length=\"0\"\r\n         uib-typeahead=\"doc as doc.name for doc in loadDocs(state.filter)\" typeahead-loading=\"loadingLocations\" typeahead-no-results=\"noResults\"\r\n         placenames-clear>\r\n\r\n      <span class=\"input-group-btn\">\r\n         <button class=\"btn btn-primary\" type=\"button\" ng-click=\"showFilters = !showFilters\" ng-hide=\"state.searched\" title=\"SHow/hide filters such as authority, group, category and feature type\">Filters...</button>\r\n         <button class=\"btn btn-primary\" title=\"Clear the current search and enable discovery\" type=\"button\" ng-click=\"clear()\" ng-show=\"state.searched\">Clear Search Results</button>\r\n         <button class=\"btn btn-primary\" type=\"button\" ng-click=\"search()\" title=\"Search for all features matching your search criteria\"\r\n         ng-hide=\"state.searched\">Search</button>\r\n      </span>\r\n   </div>\r\n</div>\r\n<div class=\"filters\" ng-show=\"showFilters\" style=\"background-color: white; opacity:0.9\">\r\n   <div class=\"panel panel-default\" style=\"margin-bottom:5px\">\r\n      <div class=\"panel-heading\">\r\n         <h4 class=\"panel-title\">\r\n            Filter\r\n            <span ng-if=\"summary.current.length\">ing</span> by groups/categorie/features...\r\n         </h4>\r\n      </div>\r\n   </div>\r\n   <placenames-tree></placenames-tree>\r\n   <div class=\"panel panel-default\" style=\"margin-bottom:5px\">\r\n      <div class=\"panel-heading\">\r\n         <h4 class=\"panel-title\">\r\n            Filter\r\n            <span ng-if=\"summary.authorities.length\">ing</span> by authority...\r\n         </h4>\r\n      </div>\r\n      <div style=\"max-height: 200px; overflow-y: auto; padding:5px\">\r\n         <placenames-authorities update=\"update()\"></placenames-authorities>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("search/search.html","<placenames-results data=\"state\"></placenames-results>\r\n");
$templateCache.put("search/searchfilters.html","<div style=\"padding-top:5px; padding-bottom:5px\">\r\n   <span ng-if=\"data.filter && !data.filter.location\">Matching names like \"{{summary.filter}}\"</span>\r\n   <span ng-if=\"summary.current.length\">Filtered by: {{summary.current | quicksummary : \"name\" }}</span>\r\n   <span ng-if=\"summary.authorities.length\">For authorities: {{summary.authorities | quicksummary : \"code\"}}</span>\r\n</div>");
$templateCache.put("search/typeahead.html","<a placenames-options ng-mouseenter=\"enter()\" ng-mouseleave=\"leave()\"  tooltip-append-to-body=\"true\"\r\n               tooltip-placement=\"bottom\" uib-tooltip-html=\"match.model | placenamesTooltip\">\r\n   <span ng-bind-html=\"match.model.name | uibTypeaheadHighlight:query\"></span>\r\n   (<span ng-bind-html=\"match.model.authorityId\"></span>)\r\n</a>");
$templateCache.put("side-panel/trigger.html","<button ng-click=\"toggle()\" type=\"button\" class=\"map-tool-toggle-btn\">\r\n   <span class=\"hidden-sm\">{{name}}</span>\r\n   <ng-transclude></ng-transclude>\r\n   <i class=\"fa fa-lg\" ng-class=\"iconClass\"></i>\r\n</button>");}]);