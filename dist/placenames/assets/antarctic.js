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

   angular.module("AntarcticApp", ['antarctic.maps', 'antarctic.templates', 'explorer.config', 'explorer.confirm', 'explorer.enter', 'explorer.flasher', 'explorer.googleanalytics', 'explorer.info', 'explorer.message', 'explorer.modal', 'explorer.persist', 'explorer.version', 'placenames.contributors', 'placenames.header', 'placenames.navigation', 'exp.ui.templates', 'explorer.map.templates', 'ui.bootstrap', 'ngAutocomplete', 'ngSanitize', 'page.footer'])

   // Set up all the service providers here.
   .config(['configServiceProvider', 'persistServiceProvider', 'projectsServiceProvider', 'versionServiceProvider', function (configServiceProvider, persistServiceProvider, projectsServiceProvider, versionServiceProvider) {
      configServiceProvider.location("placenames/resources/config/config.json?v=4");
      configServiceProvider.dynamicLocation("placenames/resources/config/configclient.json?");
      versionServiceProvider.url("placenames/assets/package.json");
      persistServiceProvider.handler("local");
      projectsServiceProvider.setProject("placenames");
   }]).run(["mapService", function (mapService) {
      window.map = mapService.map;
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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

{
   var MapService = function MapService() {
      _classCallCheck(this, MapService);

      var EPSG3031 = new L.Proj.CRS("EPSG:3031", "+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 +x_0=0 +y_0=0 " + "+ellps=WGS84 +datum=WGS84 +units=m +no_defs", {
         origin: [-4194304, 4194304],
         resolutions: [8192.0, 4096.0, 2048.0, 1024.0, 512.0, 256.0],
         bounds: [[-4194304, -4194304], [4194304, 4194304]]
      });

      var map = this.map = L.map("mappo", {
         center: [-90, 0],
         zoom: 0,
         maxZoom: 5,
         crs: EPSG3031
      });

      var template = "//map1{s}.vis.earthdata.nasa.gov/wmts-antarctic/" + "{layer}/default/{time}/{tileMatrixSet}/{z}/{y}/{x}.jpg";

      var layer = this.layer = L.tileLayer(template, {
         layer: "MODIS_Aqua_CorrectedReflectance_TrueColor",
         tileMatrixSet: "EPSG3031_250m",
         format: "image%2Fjpeg",
         time: "2013-12-01",
         tileSize: 512,
         subdomains: "abc",
         noWrap: true,
         continuousWorld: true,
         attribution: "<a href='https://wiki.earthdata.nasa.gov/display/GIBS'>" + "NASA EOSDIS GIBS</a>"
      });

      // HACK: BEGIN
      // Leaflet does not yet handle these kind of projections nicely. Monkey
      // patch the getTileUrl function to ensure requests are within
      // tile matrix set boundaries.
      var superGetTileUrl = layer.getTileUrl;

      layer.getTileUrl = function (coords) {
         var max = Math.pow(2, layer._getZoomForUrl() + 1);
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
      for (var i = -180; i < 181; i += 10) {
         L.marker([-81 + i / 20, i]).addTo(map);
      }

      L.marker([-90, 0]).addTo(map);
      L.marker([-88, 0]).addTo(map);

      L.marker([-80, 0]).addTo(map);
      L.marker([-78, 0]).addTo(map);

      L.marker([-70, 0]).addTo(map);
      L.marker([-68, 0]).addTo(map);

      L.marker([-90, -90]).addTo(map);
      L.marker([-88, -88]).addTo(map);

      L.marker([-80, -90]).addTo(map);
      L.marker([-78, -88]).addTo(map);

      L.marker([-70, -90]).addTo(map);
      L.marker([-68, -88]).addTo(map);
   };

   angular.module("antarctic.maps", []).service("mapService", [function () {
      var service = new MapService();
   }]);
}
angular.module("antarctic.templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("contributors/contributors.html","<span class=\"contributors\" ng-mouseenter=\"over()\" ng-mouseleave=\"out()\" style=\"z-index:1500\"\r\n      ng-class=\"(contributors.show || contributors.ingroup || contributors.stick) ? \'transitioned-down\' : \'transitioned-up\'\">\r\n   <button class=\"undecorated contributors-unstick\" ng-click=\"unstick()\" style=\"float:right\">X</button>\r\n   <div ng-repeat=\"contributor in contributors.orgs | activeContributors\" style=\"text-align:cnter\">\r\n      <a ng-href=\"{{contributor.href}}\" name=\"contributors{{$index}}\" title=\"{{contributor.title}}\" target=\"_blank\">\r\n         <img ng-src=\"{{contributor.image}}\" alt=\"{{contributor.title}}\" class=\"elvis-logo\" ng-class=\"contributor.class\"></img>\r\n      </a>\r\n   </div>\r\n</span>");
$templateCache.put("contributors/show.html","<a ng-mouseenter=\"over()\" ng-mouseleave=\"out()\" class=\"contributors-link\" title=\"Click to lock/unlock contributors list.\"\r\n      ng-click=\"toggleStick()\" href=\"#contributors0\">Contributors</a>");
$templateCache.put("navigation/altthemes.html","<span class=\"altthemes-container\">\r\n	<span ng-repeat=\"item in themes | altthemesMatchCurrent : current\">\r\n       <a title=\"{{item.label}}\" ng-href=\"{{item.url}}\" class=\"altthemesItemCompact\" target=\"_blank\">\r\n         <span class=\"altthemes-icon\" ng-class=\"item.className\"></span>\r\n       </a>\r\n    </li>\r\n</span>");
$templateCache.put("header/header.html","<div class=\"container-full common-header\" style=\"padding-right:10px; padding-left:10px\">\r\n   <div class=\"navbar-header\">\r\n\r\n      <button type=\"button\" class=\"navbar-toggle\" data-toggle=\"collapse\" data-target=\".ga-header-collapse\">\r\n         <span class=\"sr-only\">Toggle navigation</span>\r\n         <span class=\"icon-bar\"></span>\r\n         <span class=\"icon-bar\"></span>\r\n         <span class=\"icon-bar\"></span>\r\n      </button>\r\n\r\n      <a href=\"/\" class=\"appTitle visible-xs\">\r\n         <h1 style=\"font-size:120%\">{{heading}}</h1>\r\n      </a>\r\n   </div>\r\n   <div class=\"navbar-collapse collapse ga-header-collapse\">\r\n      <ul class=\"nav navbar-nav\">\r\n         <li class=\"hidden-xs\">\r\n            <a href=\"/\">\r\n               <h1 class=\"applicationTitle\">{{heading}}</h1>\r\n            </a>\r\n         </li>\r\n      </ul>\r\n      <ul class=\"nav navbar-nav navbar-right nav-icons\">\r\n         <li role=\"menuitem\" style=\"padding-right:10px;position: relative;top: -3px;\">\r\n            <span class=\"altthemes-container\">\r\n               <span>\r\n                  <a title=\"Location INformation Knowledge platform (LINK)\" href=\"http://fsdf.org.au/\" target=\"_blank\">\r\n                     <img alt=\"FSDF\" src=\"placenames/resources/img/FSDFimagev4.0.png\" style=\"height: 66px\">\r\n                  </a>\r\n               </span>\r\n            </span>\r\n         </li>\r\n         <li placenames-navigation role=\"menuitem\" current=\"current\" style=\"padding-right:10px\"></li>\r\n         <li mars-version-display role=\"menuitem\"></li>\r\n         <li style=\"width:10px\"></li>\r\n      </ul>\r\n   </div>\r\n   <!--/.nav-collapse -->\r\n</div>\r\n<div class=\"contributorsLink\" style=\"position: absolute; right:7px; bottom:15px\">\r\n   <placenames-contributors-link></placenames-contributors-link>\r\n</div>\r\n<!-- Strap -->\r\n<div class=\"row\">\r\n   <div class=\"col-md-12\">\r\n      <div class=\"strap-blue\">\r\n      </div>\r\n      <div class=\"strap-white\">\r\n      </div>\r\n      <div class=\"strap-red\">\r\n      </div>\r\n   </div>\r\n</div>");}]);