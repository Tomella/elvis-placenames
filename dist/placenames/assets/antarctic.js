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
'use strict';

(function (angular) {

   'use strict';

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
   }]).factory('headerService', ['$http', function () {}]);
})(angular);
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
   }]).directive('placenamesFilteredSummary', ["placenamesSearchService", function (placenamesSearchService) {
      return {
         scope: {
            state: "="
         },
         templateUrl: "quicksearch/filteredsummary.html",
         link: function link(scope) {
            scope.summary = placenamesSearchService.summary;
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

   angular.module("AntarcticApp", ['antarctic.australia', 'antarctic.maps', 'antarctic.panes', 'antarctic.templates', 'antarctic.toolbar', 'explorer.config', 'explorer.confirm', 'explorer.enter', 'explorer.flasher', 'explorer.googleanalytics', 'explorer.info', 'explorer.message', 'explorer.modal', 'explorer.persist', 'explorer.version', 'placenames.contributors', 'placenames.header', 'placenames.navigation', 'placenames.reset', 'placenames.side-panel', 'exp.ui.templates', 'ui.bootstrap', 'ngAutocomplete', 'ngSanitize', 'page.footer'])

   // Set up all the service providers here.
   .config(['configServiceProvider', 'persistServiceProvider', 'projectsServiceProvider', 'versionServiceProvider', function (configServiceProvider, persistServiceProvider, projectsServiceProvider, versionServiceProvider) {
      configServiceProvider.location("placenames/resources/config/config.json?v=4");
      configServiceProvider.dynamicLocation("placenames/resources/config/configclient.json?");
      versionServiceProvider.url("placenames/assets/package.json");
      persistServiceProvider.handler("local");
      projectsServiceProvider.setProject("placenames");
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
   var MapService = function () {
      function MapService() {
         _classCallCheck(this, MapService);
      }

      _createClass(MapService, [{
         key: 'init',
         value: function init(div) {
            // Map resolutions that NASA GIBS specify
            var resolutions = [67733.46880027094, 33866.73440013547, 16933.367200067736, 8466.683600033868, 4233.341800016934, 2116.670900008467, 1058.3354500042335];

            var bounds = L.bounds([-24925916.518499706, -11159088.984844638], [24925916.518499706, 11159088.984844638]);

            // The polar projection
            var EPSG3031 = new L.Proj.CRS('EPSG:3031', '+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs', {
               resolutions: resolutions,
               origin: [-30636100, 30636100],
               bounds: bounds
            });

            EPSG3031.projection.bounds = bounds;

            var map = this.map = L.map(div, {
               center: [-90, 0],
               zoom: 2,
               maxZoom: 8,
               minZoom: 1,
               crs: EPSG3031
            });

            /*
            // NASA data. It includes cloud and snow so looks bit yuck.
            let template =
               "//map1{s}.vis.earthdata.nasa.gov/wmts-antarctic/" +
               "{layer}/default/{time}/{tileMatrixSet}/{z}/{y}/{x}.jpg";
              let options = {
               layer: "MODIS_Aqua_CorrectedReflectance_TrueColor",
               tileMatrixSet: "EPSG3031_250m",
               format: "image%2Fjpeg",
               time: "2013-12-01",
               tileSize: 512,
               subdomains: "abc",
               noWrap: true,
               continuousWorld: true,
               attribution:
               "<a href='https://wiki.earthdata.nasa.gov/display/GIBS'>" +
               "NASA EOSDIS GIBS</a>"
            };
            */

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

            layer.getTileUrl = function (coords) {
               if (coords.z === 2) {
                  if ((coords.y === 6 || coords.y === 7) && (coords.x === 5 || coords.x === 4 || coords.x === 9)) return "";
               }
               var max = Math.pow(2, layer._getZoomForUrl() + 2);
               if (coords.x < 0) {
                  return "";
               }
               if (coords.y < 0) {
                  return "";
               }
               if (coords.x >= max) {
                  return "";
               }
               if (coords.y >= max) {
                  return "";
               }
               return superGetTileUrl.call(layer, coords);
            };
            // HACK: END


            map.addLayer(layer);

            // Module which adds graticule (lat/lng lines)
            // L.graticule().addTo(map);

            L.control.scale({ imperial: false }).addTo(map);
            /*
            L.control.mousePosition({
               position: "bottomright",
               emptyString: "",
               seperator: " ",
               latFormatter: function (lat) {
                  return "Lat " + L.Util.formatNum(lat, 5) + "°";
               },
               lngFormatter: function (lng) {
                  return "Lng " + L.Util.formatNum(lng % 180, 5) + "°";
               }
            }).addTo(map);
            */

            /*
            for (let i = -180; i < 181; i += 10) {
               L.marker([-81 + (i / 20), i]).addTo(map);
            }
            */

            L.marker([-90, 90]).addTo(map);
            L.marker([-88, 88]).addTo(map);

            L.marker([-80, 90]).addTo(map);
            L.marker([-78, 88]).addTo(map);

            L.marker([-70, 90]).addTo(map);
            L.marker([-68, 88]).addTo(map);
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
   }]).service("mapService", [function () {
      var service = new MapService();
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
         lng = this.options.lngFormatter ? this.options.lngFormatter(w.lng) : L.Util.formatNum(w.lng, this.options.numDigits);
         lat = this.options.latFormatter ? this.options.latFormatter(w.lat) : L.Util.formatNum(w.lat, this.options.numDigits);
         this._latLngValue = this.options.lngFirst ? lng + this.options.separator + lat : lat + this.options.separator + lng;
         if (this.options.elevGetter) {
            if (this._hoverInfo) window.clearTimeout(this._hoverInfo.timeout);
            this._hoverInfo = {
               lat: w.lat,
               lng: w.lng,
               timeout: window.setTimeout(this._onMouseHover.bind(this), 400)
            };
         }
         this._container.innerHTML = this.options.prefix + ' ' + this._latLngValue;
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
$templateCache.put("header/header.html","<div class=\"container-full common-header\" style=\"padding-right:10px; padding-left:10px\">\r\n   <div class=\"navbar-header\">\r\n\r\n      <button type=\"button\" class=\"navbar-toggle\" data-toggle=\"collapse\" data-target=\".ga-header-collapse\">\r\n         <span class=\"sr-only\">Toggle navigation</span>\r\n         <span class=\"icon-bar\"></span>\r\n         <span class=\"icon-bar\"></span>\r\n         <span class=\"icon-bar\"></span>\r\n      </button>\r\n\r\n      <a href=\"/\" class=\"appTitle visible-xs\">\r\n         <h1 style=\"font-size:120%\">{{heading}}</h1>\r\n      </a>\r\n   </div>\r\n   <div class=\"navbar-collapse collapse ga-header-collapse\">\r\n      <ul class=\"nav navbar-nav\">\r\n         <li class=\"hidden-xs\">\r\n            <a href=\"/\">\r\n               <h1 class=\"applicationTitle\">{{heading}}</h1>\r\n            </a>\r\n         </li>\r\n      </ul>\r\n      <ul class=\"nav navbar-nav navbar-right nav-icons\">\r\n         <li role=\"menuitem\" style=\"padding-right:10px;position: relative;top: -3px;\">\r\n            <span class=\"altthemes-container\">\r\n               <span>\r\n                  <a title=\"Location INformation Knowledge platform (LINK)\" href=\"http://fsdf.org.au/\" target=\"_blank\">\r\n                     <img alt=\"FSDF\" src=\"placenames/resources/img/FSDFimagev4.0.png\" style=\"height: 66px\">\r\n                  </a>\r\n               </span>\r\n            </span>\r\n         </li>\r\n         <li placenames-navigation role=\"menuitem\" current=\"current\" style=\"padding-right:10px\"></li>\r\n         <li mars-version-display role=\"menuitem\"></li>\r\n         <li style=\"width:10px\"></li>\r\n      </ul>\r\n   </div>\r\n   <!--/.nav-collapse -->\r\n</div>\r\n<div class=\"contributorsLink\" style=\"position: absolute; right:7px; bottom:15px\">\r\n   <placenames-contributors-link></placenames-contributors-link>\r\n</div>\r\n<!-- Strap -->\r\n<div class=\"row\">\r\n   <div class=\"col-md-12\">\r\n      <div class=\"strap-blue\">\r\n      </div>\r\n      <div class=\"strap-white\">\r\n      </div>\r\n      <div class=\"strap-red\">\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("contributors/contributors.html","<span class=\"contributors\" ng-mouseenter=\"over()\" ng-mouseleave=\"out()\" style=\"z-index:1500\"\r\n      ng-class=\"(contributors.show || contributors.ingroup || contributors.stick) ? \'transitioned-down\' : \'transitioned-up\'\">\r\n   <button class=\"undecorated contributors-unstick\" ng-click=\"unstick()\" style=\"float:right\">X</button>\r\n   <div ng-repeat=\"contributor in contributors.orgs | activeContributors\" style=\"text-align:cnter\">\r\n      <a ng-href=\"{{contributor.href}}\" name=\"contributors{{$index}}\" title=\"{{contributor.title}}\" target=\"_blank\">\r\n         <img ng-src=\"{{contributor.image}}\" alt=\"{{contributor.title}}\" class=\"elvis-logo\" ng-class=\"contributor.class\"></img>\r\n      </a>\r\n   </div>\r\n</span>");
$templateCache.put("contributors/show.html","<a ng-mouseenter=\"over()\" ng-mouseleave=\"out()\" class=\"contributors-link\" title=\"Click to lock/unlock contributors list.\"\r\n      ng-click=\"toggleStick()\" href=\"#contributors0\">Contributors</a>");
$templateCache.put("navigation/altthemes.html","<span class=\"altthemes-container\">\r\n	<span ng-repeat=\"item in themes | altthemesMatchCurrent : current\">\r\n       <a title=\"{{item.label}}\" ng-href=\"{{item.url}}\" class=\"altthemesItemCompact\" target=\"_blank\">\r\n         <span class=\"altthemes-icon\" ng-class=\"item.className\"></span>\r\n       </a>\r\n    </li>\r\n</span>");
$templateCache.put("quicksearch/filteredsummary.html","<span class=\"placenames-filtered-summary-child\">\r\n   <span style=\"font-weight:bold; margin:5px;\">\r\n      Matched {{state.persist.data.response.numFound | number}}\r\n   </span>\r\n   <span ng-if=\"summary.authorities.length\">\r\n      <span style=\"font-weight:bold\">| For authorities:</span>\r\n      <placenames-pill ng-repeat=\"item in summary.authorities\" name=\"code\" item=\"item\" update=\"update()\"></placenames-pill>\r\n   </span>\r\n   <span ng-if=\"summary.current.length\">\r\n      <span style=\"font-weight:bold\"> | Filtered by {{summary.filterBy}}:</span>\r\n      <placenames-pill ng-repeat=\"item in summary.current\" item=\"item\" update=\"update()\"></placenames-pill>\r\n   </span>\r\n</span>");
$templateCache.put("quicksearch/quicksearch.html","<div class=\"quickSearch\" placenames-quick-search style=\"opacity:0.9\"></div>\r\n");
$templateCache.put("reset/reset.html","<button type=\"button\" class=\"map-tool-toggle-btn\" ng-click=\"reset()\" title=\"Reset page\">\r\n   <span class=\"hidden-sm\">Reset</span>\r\n   <i class=\"fa fa-lg fa-refresh\"></i>\r\n</button>");
$templateCache.put("side-panel/trigger.html","<button ng-click=\"toggle()\" type=\"button\" class=\"map-tool-toggle-btn\">\r\n   <span class=\"hidden-sm\">{{name}}</span>\r\n   <ng-transclude></ng-transclude>\r\n   <i class=\"fa fa-lg\" ng-class=\"iconClass\"></i>\r\n</button>");}]);