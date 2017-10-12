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

/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */
{
	angular.module("placenames.bounds", []).directive('placenamesBounds', ['flashService', 'messageService', 'boundsService', function (flashService, messageService, boundsService) {
		var flasher = void 0;
		return {
			restrict: 'AE',
			link: function link() {
				boundsService.init().then(null, null, function notify(message) {
					flashService.remove(flasher);
					switch (message.type) {
						case "error":
						case "warn":
						case "info":
							messageService[message.type](message.text);
							break;
						default:
							flashService.remove(flasher);
							flasher = flashService.add(message.text, message.duration ? message.duration : 8000, message.type === "wait");
					}
				});
			}
		};
	}]).factory("boundsService", ['$http', '$q', '$rootScope', '$timeout', 'configService', 'flashService', function ($http, $q, $rootScope, $timeout, configService, flashService) {
		var clipTimeout = void 0,
		    notify = void 0;
		return {
			init: function init() {
				notify = $q.defer();
				$rootScope.$on('placenames.clip.drawn', function (event, clip) {
					send('Area drawn. Checking for data...');
					_checkSize(clip).then(function (message) {
						if (message.code === "success") {
							$rootScope.$broadcast('placenames.bounds.draw', [clip.xMin, clip.yMin, clip.xMax, clip.yMax]);
							getList(clip);
						} else {
							$rootScope.$broadcast('placenames.clip.draw', { message: "oversize" });
						}
					});
				});
				return notify.promise;
			},

			cancelDraw: function cancelDraw() {
				drawService.cancelDrawRectangle();
			},

			checkSize: function checkSize(clip) {
				return _checkSize(clip);
			}
		};

		function send(message, type, duration) {
			if (notify) {
				notify.notify({
					text: message,
					type: type,
					duration: duration
				});
			}
		}

		function _checkSize(clip) {
			var deferred = $q.defer();
			var result = drawn(clip);
			if (result && result.code) {
				switch (result.code) {
					case "oversize":
						$timeout(function () {
							send("", "clear");
							send("The selected area is too large to process. Please restrict to approximately " + "2 degrees square.", "error");
							deferred.resolve(result);
						});
						break;
					case "undersize":
						$timeout(function () {
							send("", "clear");
							send("X Min and Y Min should be smaller than X Max and Y Max, respectively. " + "Please update the drawn area.", "error");
							deferred.resolve(result);
						});
						break;
					default:
						return $q.when(result);
				}
			}
			return deferred.promise;
		}

		function underSizeLimit(clip) {
			var size = (clip.xMax - clip.xMin) * (clip.yMax - clip.yMin);
			return size < 0.00000000001 || clip.xMax < clip.xMin;
		}

		function overSizeLimit(clip) {
			// Shouldn't need abs but it doesn't hurt.
			var size = Math.abs((clip.xMax - clip.xMin) * (clip.yMax - clip.yMin));
			return size > 2000;
		}

		function forceNumbers(clip) {
			clip.xMax = clip.xMax === null ? null : +clip.xMax;
			clip.xMin = clip.xMin === null ? null : +clip.xMin;
			clip.yMax = clip.yMax === null ? null : +clip.yMax;
			clip.yMin = clip.yMin === null ? null : +clip.yMin;
		}

		function drawn(clip) {
			//geoprocessService.removeClip();
			forceNumbers(clip);

			if (overSizeLimit(clip)) {
				return { code: "oversize" };
			}

			if (underSizeLimit(clip)) {
				return { code: "undersize" };
			}

			if (clip.xMax === null) {
				return { code: "incomplete" };
			}

			if (validClip(clip)) {
				return { code: "success" };
			}
			return { code: "invalid" };
		}

		// The input validator takes care of order and min/max constraints. We just check valid existance.
		function validClip(clip) {
			return clip && angular.isNumber(clip.xMax) && angular.isNumber(clip.xMin) && angular.isNumber(clip.yMax) && angular.isNumber(clip.yMin) && !overSizeLimit(clip) && !underSizeLimit(clip);
		}

		function getList(clip) {
			configService.getConfig("processing").then(function (conf) {
				var url = conf.intersectsUrl;
				if (url) {
					// Order matches the $watch signature so be careful
					var urlWithParms = url.replace("{maxx}", clip.xMax).replace("{minx}", clip.xMin).replace("{maxy}", clip.yMax).replace("{miny}", clip.yMin);

					send("Checking there is data in your selected area...", "wait", 180000);
					$http.get(urlWithParms).then(function (response) {
						if (response.data && response.data.available_data) {
							var message = "There is no data held in your selected area. Please try another area.";
							send("", "clear");
							if (response.data.available_data) {
								response.data.available_data.forEach(function (group) {
									if (group.downloadables) {
										message = "There is intersecting data. Select downloads from the list.";
									}
								});
							}
							send(message, null, 4000);
							$rootScope.$broadcast('site.selection', response.data);
						}
					}, function (err) {
						// If it falls over we don't want to crash.
						send("The service that provides the list of datasets is currently unavailable. " + "Please try again later.", "error");
					});
				}
			});
		}
	}]);
}
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

{
   var RootCtrl = function RootCtrl(configService, mapService) {
      var _this = this;

      _classCallCheck(this, RootCtrl);

      mapService.getMap().then(function (map) {
         _this.map = map;
      });
      configService.getConfig().then(function (data) {
         _this.data = data;
      });
   };

   RootCtrl.$invoke = ['configService', 'mapService'];

   angular.module("PlacenamesApp", ['explorer.config', 'explorer.confirm', 'explorer.enter', 'explorer.flasher', 'explorer.googleanalytics', 'explorer.info', 'explorer.message', 'explorer.modal', 'explorer.persist', 'explorer.projects', 'explorer.version', 'exp.ui.templates', 'explorer.map.templates', 'ui.bootstrap', 'ngAutocomplete', 'ngRoute', 'ngSanitize', 'page.footer', 'geo.baselayer.control', 'geo.draw', 'geo.map', 'geo.maphelper', 'geo.measure', 'placenames.about', 'placenames.bounds', 'placenames.classifications', 'placenames.clusters', 'placenames.extent', 'placenames.header', 'placenames.maps', 'placenames.navigation', 'placenames.panes', 'placenames.popover', 'placenames.proxy', 'placenames.reset', "placenames.results", "placenames.search", "placenames.side-panel", 'placenames.splash', 'placenames.templates', 'placenames.toolbar', 'placenames.utils'])

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
            var T;
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
            var kValue;
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
   angular.module('placenames.autoscroll', []).directive('autoScroll', ['$timeout', '$rootScope', function ($timeout, $rootScope) {
      return {
         scope: {
            trigger: "@",
            y: "@",
            height: "@"
         },
         link: function link(scope, element, attrs) {
            var timeout, oldBottom, startHeight;

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
                   scrollBottom,
                   up;

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
   AboutService.$inject = ["configService"];

   angular.module('placenames.about', []).directive("placenamesAbout", ["$interval", "aboutService", function ($interval, aboutService) {
      return {
         templateUrl: "placenames/about/about.html",
         scope: {},
         link: function link(scope, element) {
            var timer = void 0;

            scope.about = aboutService.getState();

            scope.over = function () {
               $interval.cancel(timer);
               scope.about.ingroup = true;
            };

            scope.out = function () {
               timer = $interval(function () {
                  scope.about.ingroup = false;
               }, 1000);
            };

            scope.unstick = function () {
               scope.about.ingroup = scope.about.show = scope.about.stick = false;
               element.find("a").blur();
            };
         }
      };
   }]).directive("placenamesAboutLink", ["$interval", "aboutService", function ($interval, aboutService) {
      return {
         restrict: "AE",
         templateUrl: "placenames/about/button.html",
         scope: {},
         link: function link(scope) {
            var timer = void 0;
            scope.about = aboutService.getState();
            scope.over = function () {
               $interval.cancel(timer);
               scope.about.show = true;
            };

            scope.toggleStick = function () {
               scope.about.stick = !scope.about.stick;
               if (!scope.about.stick) {
                  scope.about.show = scope.about.ingroup = false;
               }
            };

            scope.out = function () {
               timer = $interval(function () {
                  scope.about.show = false;
               }, 700);
            };
         }
      };
   }]).factory("aboutService", AboutService);
}

function AboutService(configService) {
   var state = {
      show: false,
      ingroup: false,
      stick: false
   };

   configService.getConfig("about").then(function (response) {
      state.items = response;
   });

   return {
      getState: function getState() {
         return state;
      }
   };
}
'use strict';

{

   angular.module("placenames.authorities", []).directive('placenamesAuthorities', [function () {
      return {
         restrict: 'EA',
         templateUrl: "placenames/authorities/authorities.html",
         bindToController: {
            authorities: "=",
            update: "&"
         },
         controller: function controller() {
            console.log(this.authorities);
         },
         controllerAs: "pa"
      };
   }]).directive('placenamesAuthoritiesPills', [function () {
      return {
         restrict: 'EA',
         template: '<span class="pn-authorities-pills" placenames-pills pills="pap.authorities" class="pn-feature-pills" update="pap.update()"></span>',
         bindToController: {
            authorities: "=",
            update: "&"
         },
         controller: function controller() {},
         controllerAs: "pap"
      };
   }]).filter('pnUnselectedFacets', [function () {
      return function (facets) {
         return !facets ? [] : facets.filter(function (facet) {
            return !facet.selected;
         });
      };
   }]);
}
'use strict';

{
   angular.module("placenames.classifications", []).directive('placenamesClassifications', [function () {
      return {
         restrict: 'EA',
         templateUrl: "placenames/classifications/classifications.html",
         bindToController: {
            classifications: "=",
            update: "&"
         },
         controller: function controller() {
            console.log(this.classifications);
         },
         controllerAs: "pc"
      };
   }]).directive('placenamesClassificationsPills', [function () {
      return {
         restrict: 'EA',
         template: '<span placenames-pills class="pn-classifications-pills" pills="pcp.classifications" class="pn-feature-pills" update="pcp.update()"></span>',
         bindToController: {
            classifications: "=",
            update: "&"
         },
         controller: function controller() {},
         controllerAs: "pcp"
      };
   }]);
}
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SolrTransformer = function () {
   function SolrTransformer(data) {
      var _this = this;

      _classCallCheck(this, SolrTransformer);

      if (data) {
         var response = {};

         var lastField = null;
         data.forEach(function (element, idx) {
            if (idx % 2) {
               response[lastField] = element;
            } else {
               lastField = element;
            }
         });

         this.data = response;
         this.dx = (response.maxX - response.minX) / response.columns;
         this.dy = (response.maxY - response.minY) / response.rows;

         this.cells = [];
         response.counts_ints2D.forEach(function (row, rowIndex) {
            if (row) {
               row.forEach(function (count, columnIndex) {
                  if (!count) {
                     return;
                  }

                  var cell = {
                     type: "Feature",
                     properties: {},
                     geometry: {
                        type: "Point",
                        coordinates: []
                     }
                  },
                      properties = cell.properties,
                      geometry = cell.geometry;

                  properties.count = count;

                  geometry.coordinates[0] = _this.data.minX + _this.dx * (columnIndex + 0.5);
                  geometry.coordinates[1] = _this.data.maxY - _this.dy * (rowIndex + 0.5);

                  _this.cells.push(cell);
               });
            }
         });
      }
   }

   _createClass(SolrTransformer, [{
      key: "getGeoJson",
      value: function getGeoJson() {
         return {
            type: "FeatureCollection",
            features: this.cells
         };
      }
   }]);

   return SolrTransformer;
}();

{
   angular.module("placenames.clusters", []).directive("placenamesClusters", ["placenamesClusterService", function (placenamesClusterService) {
      return {
         link: function link() {
            placenamesClusterService.init();
         }
      };
   }]).factory("placenamesClusterService", ["$http", "$rootScope", "configService", "mapService", function ($http, $rootScope, configService, mapService) {
      var service = {
         showClusters: true,
         sequence: 0,
         layer: null
      };

      service.init = function () {
         var _this2 = this;

         configService.getConfig("clusters").then(function (config) {
            mapService.getMap().then(function (map) {
               console.log("Now we have the map", map);
               _this2.map = map;
               _this2.config = config;

               console.log(mapService.getGroup("clusters"));
               var self = _this2;
               $rootScope.$on('pn.search.complete', movePan);

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
         var _this3 = this;

         var geojsonMarkerOptions = {
            radius: 8,
            fillColor: "#ff0000",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
         };

         var count = response.response.numFound;

         if (this.layer) {
            this.map.removeLayer(this.layer);
         }

         if (count > 2000) {
            this.layer = L.markerClusterGroup({
               showCoverageOnHover: false,
               zoomToBoundsOnClick: false,
               singleMarkerMode: true
            });

            var data = response.facet_counts.facet_heatmaps[this.config.countField];
            var worker = new SolrTransformer(data);
            var result = worker.getGeoJson();

            var maxCount = d3.max(result.features, function (item) {
               return item.properties.count;
            });

            worker.cells.forEach(function (cell) {
               var count = cell.properties.count;
               for (var i = 0; i < count; i++) {
                  _this3.layer.addLayer(L.marker([cell.geometry.coordinates[1], cell.geometry.coordinates[0]]));
               }
            });
         } else {
            this.layer = L.markerClusterGroup({
               disableClusteringAtZoom: 15
            });
            var params = Object.assign({}, response.responseHeader.params);
            params.rows = count;

            var url = "select?fl=location,name&" + Object.keys(params).filter(function (key) {
               return key.indexOf("facet") !== 0;
            }).map(function (key) {
               return key + "=" + params[key];
            }).join("&");
            $http.get(url).then(function (result) {
               var docs = result.data.response.docs;
               docs.forEach(function (doc) {
                  var coords = doc.location.split(" ");
                  doc.title = doc.name;
                  _this3.layer.addLayer(L.marker([+coords[1], +coords[0]], doc));
               });
            });
         }

         this.layer.addTo(this.map);
      };

      return service;
   }]);
}
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

{

   angular.module("placenames.facets", []).factory('placenamesFacetsService', ['$http', '$q', '$rootScope', 'configService', 'proxy', function ($http, $q, $rootScope, configService, proxy) {
      var options = { cache: true };
      var featureCode = null;
      var authorities = [];
      var classifications = [];
      var featureCodes = [];

      var service = {
         getFeatureCodes: function getFeatureCodes() {
            if (!featureCodes.length) {
               getFeaturesTable().then(function (table) {
                  getFacets().then(function (fields) {
                     featureCodes.push.apply(featureCodes, _toConsumableArray(convertToEntries(fields.featureCode).map(function (entry) {
                        entry.name = table[entry.code];
                        return entry;
                     })));
                  });
               });
            }
            return $q.when(featureCodes);
         },
         getAuthorities: function getAuthorities() {
            if (!authorities.length) {
               getAuthoritiesTable().then(function (table) {
                  getFacets().then(function (fields) {
                     authorities.push.apply(authorities, _toConsumableArray(convertToEntries(fields.authority).map(function (entry) {
                        entry.name = table[entry.code].name;
                        entry.jurisdiction = table[entry.code].jurisdiction;
                        return entry;
                     })));
                  });
               });
            }
            return $q.when(authorities);
         },
         getClassifications: function getClassifications() {
            if (!classifications.length) {
               getFacets().then(function (fields) {
                  classifications.push.apply(classifications, _toConsumableArray(convertToEntries(fields.classification)));
               });
            }
            return $q.when(classifications);
         }
      };

      $rootScope.$on("pn.facets.changed", handleCounts);

      return service;

      function handleCounts(event, data) {
         service.getAuthorities().then(function () {
            updateCounts(authorities, data.authority);
         });
         service.getFeatureCodes().then(function () {
            updateCounts(featureCodes, data.featureCode);
         });
         service.getClassifications().then(function () {
            updateCounts(classifications, data.classification);
         });
      }

      function getFeaturesTable() {
         return configService.getConfig('featureCodes');
      }

      function getAuthoritiesTable() {
         return configService.getConfig('authorities');
      }

      function getFacets() {
         return configService.getConfig('facetsQuery').then(function (url) {
            return $http.get(url, options).then(function (response) {
               return response.data.facet_counts.facet_fields;
            });
         });
      }

      function updateCounts(data, counts) {
         var map = {},
             code;

         counts.forEach(function (value, index) {
            if (index % 2 === 0) {
               code = value;
            } else {
               map[code] = value;
            }
         });
         data.forEach(function (item) {
            var count = map[item.code];
            item.count = count ? count : 0;
         });
      }

      function convertToEntries(data) {
         var response = [],
             entry,
             code;

         data.forEach(function (item, index) {
            if (index % 2) {
               response.push({
                  code: code,
                  name: code,
                  total: item
               });
            } else {
               code = item;
            }
         });
         return response;
      }
   }]);
}
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

{
   var ExtentService = function ExtentService(mapService, searchService) {
      _classCallCheck(this, ExtentService);

      var bbox = searchService.getSearchCriteria().bbox;

      if (bbox.fromMap) {
         enableMapListeners();
      }

      return {
         getParameters: function getParameters() {
            return bbox;
         }
      };

      function enableMapListeners() {
         mapService.getMap().then(function (map) {
            map.on("moveend", execute);
            map.on("zoomend", execute);
            execute();
         });
      }

      function disableMapListeners() {
         return mapService.getMap().then(function (map) {
            map.off("moveend", execute);
            map.off("zoomend", execute);
            return map;
         });
      }

      function execute() {
         mapService.getMap().then(function (map) {
            var bounds = map.getBounds();
            bbox.yMin = bounds.getSouth();
            bbox.xMin = bounds.getWest();
            bbox.yMax = bounds.getNorth();
            bbox.xMax = bounds.getEast();
            searchService.refresh();
         });
      }
   };

   ExtentService.$inject = ['mapService', 'searchService'];

   angular.module("placenames.extent", ["explorer.switch"]).directive("placenamesExtent", ['extentService', function (extentService) {
      return {
         restrict: "AE",
         templateUrl: "placenames/extent/extent.html",
         controller: ['$scope', function ($scope) {
            $scope.parameters = extentService.getParameters();
         }],
         link: function link(scope, element, attrs) {}
      };
   }]).factory("extentService", ExtentService);
}
'use strict';

{
   angular.module("placenames.featuretypes", ['placenames.pills']).directive('placenamesFeaturetypes', [function () {
      return {
         restrict: 'EA',
         templateUrl: "placenames/featuretypes/featuretypes.html",
         bindToController: {
            types: "=",
            update: "&"
         },
         controller: function controller() {
            console.log(this.types);
         },
         controllerAs: "vm"
      };
   }]).directive('placenamesFeaturetypesPills', [function () {
      return {
         restrict: 'EA',
         template: '<placenames-pills pills="pfp.features" class="pn-feature-pills" update="pfp.update()"></placenames-pills>',
         bindToController: {
            features: "=",
            update: "&"
         },
         controller: function controller() {},
         controllerAs: "pfp"
      };
   }]).filter("placenamesHasName", function () {
      return function (list) {
         return (list ? list : []).filter(function (item) {
            return !!item.name;
         });
      };
   });
}
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

{
   var MapsCtrl = function MapsCtrl($rootScope, mapService, selectService, downloadService) {
      _classCallCheck(this, MapsCtrl);

      // We use the dummy layer group if
      var dummyLayerGroup = L.layerGroup([]),
          groups = {
         download: downloadService.getLayerGroup(),
         select: selectService.getLayerGroup()
      };
   };

   MapsCtrl.$inject = ['$rootScope', 'mapService', 'selectService', 'downloadService'];

   angular.module("placenames.groups", []).factory("GroupsCtrl", MapsCtrl);
}
'use strict';

{
	angular.module('placenames.header', ['placenames.themes']).controller('headerController', ['$scope', '$q', '$timeout', function ($scope, $q, $timeout) {

		var modifyConfigSource = function modifyConfigSource(headerConfig) {
			return headerConfig;
		};

		$scope.$on('headerUpdated', function (event, args) {
			$scope.headerConfig = modifyConfigSource(args);
		});
	}]).directive('placenamesHeader', [function () {
		var defaults = {
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
			templateUrl: "placenames/header/header.html",
			scope: {
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
}
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

{
   var MapsCtrl = function () {
      function MapsCtrl(mapsService) {
         _classCallCheck(this, MapsCtrl);

         this.mapService = mapService;
      }

      _createClass(MapsCtrl, [{
         key: 'toggleLayer',
         value: function toggleLayer(data) {
            this.mapsService.toggleShow(data);
         }
      }]);

      return MapsCtrl;
   }();

   MapsCtrl.$inject = ['mapsService'];

   var MapsService = function () {
      function MapsService(configService, mapService) {
         _classCallCheck(this, MapsService);

         this.CONFIG_KEY = "layersTab";
         this.configService = configService;
         this.mapService = mapService;
         this.configService = configService;
      }

      _createClass(MapsService, [{
         key: 'getConfig',
         value: function getConfig() {
            return this.configService.getConfig(this.CONFIG_KEY);
         }
      }, {
         key: 'toggleShow',
         value: function toggleShow(item, groupName) {
            var _this = this;

            this.configService.getConfig(this.CONFIG_KEY).then(function (config) {
               if (item.layer) {
                  item.displayed = false;
                  _this.mapService.removeFromGroup(item, config.group);
               } else {
                  _this.mapService.addToGroup(item, config.group);
                  item.displayed = true;
               }
            });
         }
      }]);

      return MapsService;
   }();

   MapsService.$inject = ['configService', 'mapService'];

   angular.module("placenames.maps", ["explorer.layer.slider"]).directive("placenamesMaps", ["mapsService", function (mapsService) {
      return {
         templateUrl: "placenames/maps/maps.html",
         link: function link(scope) {
            mapsService.getConfig().then(function (data) {
               scope.layersTab = data;
            });
         }
      };
   }]).controller("MapsCtrl", MapsCtrl).service("mapsService", MapsService);
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
         templateUrl: 'placenames/navigation/altthemes.html',
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
"use strict";

{
   angular.module("placenames.panes", []).directive("placenamesPanes", ['$rootScope', '$timeout', 'mapService', function ($rootScope, $timeout, mapService) {
      return {
         templateUrl: "placenames/panes/panes.html",
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
'use strict';

(function (angular) {
   'use strict';

   angular.module("placenames.pills", []).directive('placenamesPills', [function () {
      return {
         restrict: 'EA',
         templateUrl: "placenames/pills/pills.html",
         bindToController: {
            pills: "=",
            update: "&"
         },
         controller: function controller() {
            this.clear = function (item) {
               item.selected = false;
               this.update();
            };
         },
         controllerAs: "pp"
      };
   }]);
})(angular);
'use strict';

{
	angular.module('placenames.popover', []).directive('placenamesPopover', [function () {
		return {
			templateUrl: "placenames/popover/popover.html",
			restrict: 'A',
			transclude: true,
			scope: {
				closeOnEscape: "@",
				show: "=",
				containerClass: "=",
				direction: "@"
			},
			link: function link(scope, element) {
				if (!scope.direction) {
					scope.direction = "bottom";
				}

				if (scope.closeOnEscape && (scope.closeOnEscape === true || scope.closeOnEscape === "true")) {
					element.on('keyup', keyupHandler);
				}

				function keyupHandler(keyEvent) {
					if (keyEvent.which === 27) {
						keyEvent.stopPropagation();
						keyEvent.preventDefault();
						scope.$apply(function () {
							scope.show = false;
						});
					}
				}
			}

		};
	}]);
}
"use strict";

{
   angular.module("placenames.proxy", []).provider("proxy", function () {

      this.$get = ['$http', '$q', function ($http, $q) {
         var base = "proxy/";

         this.setProxyBase = function (newBase) {
            base = newBase;
         };

         return {
            get: function get(url, options) {
               return this._method("get", url, options);
            },

            post: function post(url, options) {
               return this._method("post", url, options);
            },

            put: function put(url, options) {
               return this._method("put", url, options);
            },

            _method: function _method(method, url, options) {
               return $http[method](base + url, options).then(function (response) {
                  return response.data;
               });
            }
         };
      }];
   });
}
"use strict";

{

   angular.module("placenames.plot", []).directive("placenamesPlot", ['$log', function ($log) {
      return {
         restrict: "AE",
         scope: {
            line: "="
         },
         link: function link(scope, element, attrs, ctrl) {
            scope.$watch("line", function (newValue, oldValue) {
               $log.info(newValue);
            });
         }
      };
   }]);
}
'use strict';

{
   angular.module('placenames.reset', []).directive('resetPage', function ($window) {
      return {
         restrict: 'AE',
         scope: {},
         templateUrl: 'placenames/reset/reset.html',
         controller: ['$scope', function ($scope) {
            $scope.reset = function () {
               $window.location.reload();
            };
         }]
      };
   });
}
"use strict";

(function (angular) {

   'use strict';

   angular.module("placenames.results.item", []).directive("placenamesResultsItem", ['placenamesItemService', 'placenamesResultsService', function (placenamesItemService, placenamesResultsService) {

      return {
         templateUrl: "placenames/results/item.html",
         bindToController: {
            item: "="
         },
         controller: function controller() {
            var _this = this;

            console.log("Creating an item scope");
            this.showPan = function (feature) {
               placenamesResultsService.showPan(feature);
            };

            this.download = function (type) {
               placenamesItemService[type](this);
            };

            placenamesResultsService.load(this.item.recordId).then(function (data) {
               _this.feature = data.features[0];
            });
         },
         controllerAs: "vm"
      };
   }]).factory('placenamesItemService', ['$http', 'configService', function ($http, configService) {
      var service = {
         esri: function esri(vm) {
            var blob = new Blob([JSON.stringify(vm.feature, null, 3)], { type: "application/json;charset=utf-8" });
            saveAs(blob, "gazetteer-esri-feature-" + vm.item.recordId + ".json");
         },
         wfs: function wfs(vm) {
            configService.getConfig("results").then(function (_ref) {
               var wfsTemplate = _ref.wfsTemplate;

               $http.get(wfsTemplate.replace("${id}", vm.item.recordId)).then(function (response) {
                  var blob = new Blob([response.data], { type: "application/json;charset=utf-8" });
                  saveAs(blob, "gazetteer-wfs-feature-" + vm.item.recordId + ".xml");
               });
            });
         }
      };
      return service;
   }]).filter("itemLongitude", function () {
      return function (location) {
         return location.split(" ")[0];
      };
   }).filter("itemLatitude", function () {
      return function (location) {
         return location.split(" ")[1];
      };
   });
})(angular);
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

{
   angular.module("placenames.results", ['placenames.results.item', 'placenames.scroll']).directive("placenamesResults", ['placenamesResultsService', function (placenamesResultsService) {
      return {
         templateUrl: 'placenames/results/results.html',
         restrict: "AE",
         bindToController: {
            data: "="
         },
         controller: function controller() {
            this.clear = function (data) {
               this.data.searched = null;
            };

            this.more = function () {
               placenamesResultsService.moreDocs(this.data.persist);
            };

            this.download = function () {
               placenamesResultsService.download(this.data.persist.data.response.docs.map(function (doc) {
                  return doc.id;
               }));
            };
         },
         controllerAs: "pr",
         link: function link(scope) {
            scope.$destroy = function () {
               placenamesResultsService.hide();
            };
            placenamesResultsService.moreDocs(scope.pr.data.persist);
         }
      };
   }]).factory("placenamesResultsService", ResultsService).filter("resultsHasSomeData", function () {
      return function (list) {
         return list.some(function (item) {
            return item;
         });
      };
   });

   ResultsService.$inject = ['proxy', '$http', '$rootScope', '$timeout', 'configService', 'mapService', 'placenamesSearchService'];
}

function ResultsService(proxy, $http, $rootScope, $timeout, configService, mapService, placenamesSearchService) {
   var ZOOM_IN = 7;
   var marker;

   var service = {
      showPan: function showPan(what) {
         return this.show(what).then(function (details) {
            var map = details.map;
            map.panTo(details.location, { animate: true });
            if (map.getZoom() < ZOOM_IN) {
               map.setZoom(ZOOM_IN, { animate: true });
            }
            return details;
         });
      },
      show: function show(what) {
         return this.hide().then(function (map) {
            var location = what.location.split(" ").reverse().map(function (str) {
               return +str;
            });
            // split lng/lat string seperated by space, reverse to lat/lng, cooerce to numbers
            marker = L.popup().setLatLng(location).setContent(what.name + "<br/>Lat/Lng: " + location[0] + "&deg;" + location[1] + "&deg;").openOn(map);

            return {
               location: location,
               map: map,
               marker: marker
            };
         });
      },
      downloadOld: function downloadOld(ids) {
         this.config.then(function (config) {
            proxy.get(config.esriTemplate.replace("${id}", ids.join(","))).then(function (data) {
               var blob = new Blob([JSON.stringify(data, null, 3)], { type: "application/json;charset=utf-8" });
               saveAs(blob, "gazetteer-esri-features-" + Date.now() + ".json");
            });
         });
      },
      download: function download(ids) {
         this.config.then(function (config) {
            proxy.get(config.esriTemplate.replace("${id}", ids.join(","))).then(function (data) {
               var blob = new Blob([JSON.stringify(data, null, 3)], { type: "application/json;charset=utf-8" });
               saveAs(blob, "gazetteer-esri-features-" + Date.now() + ".json");
            });
         });
      },
      hide: function hide(what) {
         return mapService.getMap().then(function (map) {
            if (marker) {
               map.removeLayer(marker);
            }
            return map;
         });
      },


      get config() {
         return configService.getConfig().then(function (config) {
            return config.results;
         });
      },

      load: function load(id) {
         return this.config.then(function (_ref) {
            var esriTemplate = _ref.esriTemplate;

            return $http.get(esriTemplate.replace("${id}", id), { cache: true }).then(function (response) {
               console.log("argghhh1! " + response.status);
               return response.data;
            }, function () {
               // No data is a valid response.
               return {
                  features: [{
                     noData: true
                  }]
               };
            });
         });
      },
      moreDocs: function moreDocs(persist) {
         var response = persist.data.response;
         var start = response.docs.length;
         if (start >= response.numFound) {
            return;
         }

         var params = persist.params;
         params.start = start;

         placenamesSearchService.request(params).then(function (data) {
            var _response$docs;

            (_response$docs = response.docs).push.apply(_response$docs, _toConsumableArray(data.response.docs));
         });
      }
   };

   return service;
}
"use strict";

{

   angular.module("placenames.scroll", []).directive("commonScroller", ['$timeout', function ($timeout) {
      return {
         scope: {
            more: "&",
            buffer: "=?"
         },
         link: function link(scope, element, attrs) {
            var fetching;
            if (!scope.buffer) scope.buffer = 100;

            element.on("scroll", function (event) {
               var target = event.currentTarget;
               $timeout.cancel(fetching);
               fetching = $timeout(bouncer, 120);

               function bouncer() {
                  if (scope.more && target.scrollHeight - target.scrollTop <= target.clientHeight + scope.buffer) {
                     scope.more();
                  }
               }
            });
         }
      };
   }]);
}
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

{
   angular.module("placenames.search", ['placenames.facets', 'placenames.featuretypes', 'placenames.authorities']).directive('placenamesClear', ['placenamesSearchService', function (placenamesSearchService) {
      return {
         link: function link(scope, element) {
            placenamesSearchService.onMapUpdate(listening);
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
   }]).directive('placenamesOptions', ['placenamesSearchService', function (placenamesSearchService) {
      return {
         link: function link(scope) {
            scope.leave = function () {
               placenamesSearchService.hide();
            };

            scope.enter = function () {
               placenamesSearchService.show(scope.match.model);
            };

            scope.$destroy = function () {
               placenamesSearchService.hide();
            };
         }
      };
   }]).directive("placenamesSearch", ['$timeout', 'placenamesFacetsService', 'placenamesSearchService', function ($timeout, placenamesFacetsService, placenamesSearchService) {
      return {
         templateUrl: 'placenames/search/search.html',
         restrict: 'AE',
         link: function link(scope) {
            scope.state = placenamesSearchService.data;
            scope.status = { classOpen: false };

            scope.$watch("state.searched", function (newVal, oldVal) {
               if (!newVal && oldVal) {
                  placenamesSearchService.filtered();
               }
            });

            placenamesSearchService.filtered();
            scope.update = function () {
               placenamesSearchService.filtered();
            };

            scope.loadOnEmpty = function () {
               if (!scope.state.filter) {
                  placenamesSearchService.filtered();
               }
            };

            scope.search = function search(item) {
               placenamesSearchService.search(item);
            };

            scope.select = function (item) {
               scope.search(item);
            };

            scope.deselect = function (facet) {
               facet.selected = false;
               placenamesSearchService.filtered();
            };

            scope.loadDocs = function () {
               return placenamesSearchService.filtered().then(function (fetched) {
                  return fetched.response.docs;
               });
            };

            scope.$watch("status.classOpen", function (load) {
               if (load && !scope.classifications) {
                  scope.classifications = true;
                  placenamesFacetsService.getClassifications().then(function (classifications) {
                     scope.state.classifications = classifications;
                  });
               }
            });

            scope.$watch("status.open", function (load) {
               if (load && !scope.featureCodes) {
                  scope.featureCodes = true;
                  placenamesFacetsService.getFeatureCodes().then(function (featureCodes) {
                     scope.state.featureCodes = featureCodes;
                  });
               }
            });

            scope.$watch("status.authOpen", function (load) {
               if (load && !scope.authorities) {
                  scope.authorities = true;
                  placenamesFacetsService.getAuthorities().then(function (authorities) {
                     scope.state.authorities = authorities;
                  });
               }
            });
         }
      };
   }]).filter('placenamesDocName', [function () {
      return function (docs) {
         return docs ? docs.map(function (doc) {
            return doc.name + " (" + doc.recordId + ")";
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
         buffer += "Lat " + model.location.split(" ").reverse().join("&deg; Lng ") + "&deg;<br/>Classification: " + model.classification + "</div>";

         return buffer;
      };
   }]).factory('placenamesSearchService', SearchService);

   SearchService.$inject = ['$http', '$rootScope', '$timeout', 'configService', 'mapService'];
}

function SearchService($http, $rootScope, $timeout, configService, mapService) {
   var data = {
      searched: null, // Search results
      featureCodes: [],
      classifications: [],
      authorities: []
   };
   var mapListeners = [];

   var results;
   var marker;

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

      filtered: function filtered() {
         return _filtered().then(function (response) {
            data.filtered = response;
            return response;
         });
      },
      request: function request(params) {
         return _request(params);
      },
      search: function search(item) {
         if (item) {
            data.persist.item = item;
         }
         this.searched();
      },
      persist: function persist(params, response) {
         data.persist = {
            params: params,
            data: response
         };
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
      var timeout;
      var facets = {
         facet: true,
         "facet.field": "featureCode"
      };

      map.on('resize moveend viewreset', function () {
         $timeout.cancel(timeout);
         if (!data.searched) {
            timeout = $timeout(function () {
               service.filtered();
            }, 200);
            mapListeners.forEach(function (listener) {
               listener();
            });
         }
      });
   });

   function _filtered() {
      return createParams().then(function (params) {
         return run(params).then(function (data) {
            service.persist(params, data);
            $rootScope.$broadcast('pn.search.complete', data);
            return data;
         });
      });
   }

   function createParams() {
      return mapService.getMap().then(function (map) {
         var types = data.featureCodes;
         var features = types.filter(function (type) {
            return type.selected;
         });
         var classes = data.classifications.filter(function (item) {
            return item.selected;
         });
         var params = baseParameters();
         var filterIsObject = _typeof(data.filter) === "object";
         var q = filterIsObject ? data.filter.name : data.filter;

         params.fq = getBounds(map);
         params["facet.heatmap.geom"] = getHeatmapBounds(map);
         params.sort = getSort(map);
         params.q = q ? '"' + q.toLowerCase() + '"' : "*:*";

         var qs = [];
         features.forEach(function (feature) {
            qs.push("featureCode:" + feature.code);
         });
         classes.forEach(function (clazz) {
            qs.push('classification:"' + clazz.name + '"');
         });

         data.authorities.filter(function (auth) {
            return auth.selected;
         }).forEach(function (auth) {
            qs.push('authority:' + auth.code);
         });

         if (qs.length) {
            params.q += ' AND (' + qs.join(" ") + ')';
         }

         return params;
      });
   }

   function run(params) {
      return _request(params).then(function (data) {
         var code;
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

   function getSort(map) {
      var bounds = map.getBounds();
      var dx = (bounds.getEast() - bounds.getWest()) / 2;
      var dy = (bounds.getNorth() - bounds.getSouth()) / 2;
      return "geodist(ll," + (bounds.getSouth() + dy) + "," + (bounds.getWest() + dx) + ") asc";
   }

   function getBounds(map) {
      var bounds = map.getBounds();
      return "location:[" + Math.max(bounds.getSouth(), -90) + "," + Math.max(bounds.getWest(), -180) + " TO " + Math.min(bounds.getNorth(), 90) + "," + Math.min(bounds.getEast(), 180) + "]";
   }

   function getHeatmapBounds(map) {
      var bounds = map.getBounds();
      return "[" + Math.max(bounds.getSouth(), -90) + "," + Math.max(bounds.getWest(), -180) + " TO " + Math.min(bounds.getNorth(), 90) + "," + Math.min(bounds.getEast(), 180) + "]";
   }

   function baseParameters() {
      return {
         "facet.heatmap.format": "ints2D",
         "facet.heatmap": "location",
         facet: true,
         "facet.field": ["featureCode", "classification", "authority"],
         rows: 50,
         wt: "json"
      };
   }

   function baseFacetParameters() {
      var params = baseParameters();
      params.rows = 0;
   }

   return service;
}
"use strict";

{

   angular.module("placenames.splash", ["ui.bootstrap.modal"]).directive('placenamesSplash', ['$rootScope', '$uibModal', '$log', 'splashService', function ($rootScope, $uibModal, $log, splashService) {
      return {
         controller: ['$scope', 'splashService', function ($scope, splashService) {
            $scope.acceptedTerms = true;

            splashService.getReleaseNotes().then(function (messages) {
               $scope.releaseMessages = messages;
               $scope.acceptedTerms = splashService.hasViewedSplash();
            });
         }],
         link: function link(scope, element) {
            var modalInstance;

            scope.$watch("acceptedTerms", function (value) {
               if (value === false) {
                  modalInstance = $uibModal.open({
                     templateUrl: 'placenames/splash/splash.html',
                     size: "lg",
                     backdrop: "static",
                     keyboard: false,
                     controller: ['$scope', 'acceptedTerms', 'messages', function ($scope, acceptedTerms, messages) {
                        $scope.acceptedTerms = acceptedTerms;
                        $scope.messages = messages;
                        $scope.accept = function () {
                           modalInstance.close(true);
                        };
                     }],
                     resolve: {
                        acceptedTerms: function acceptedTerms() {
                           return scope.acceptedTerms;
                        },
                        messages: function messages() {
                           return scope.releaseMessages;
                        }
                     }
                  });
                  modalInstance.result.then(function (acceptedTerms) {
                     $log.info("Accepted terms");
                     scope.acceptedTerms = acceptedTerms;
                     splashService.setHasViewedSplash(acceptedTerms);
                  }, function () {
                     $log.info('Modal dismissed at: ' + new Date());
                  });
               }
            });

            $rootScope.$on("logoutRequest", function () {
               userService.setAcceptedTerms(false);
            });
         }
      };
   }]).factory("splashService", ['$http', function ($http) {
      var VIEWED_SPLASH_KEY = "placenames.accepted.terms",
          releaseNotesUrl = "placenames/resources/config/releasenotes.json";

      return {
         getReleaseNotes: function getReleaseNotes() {
            return $http({
               method: "GET",
               url: releaseNotesUrl + "?t=" + Date.now()
            }).then(function (result) {
               return result.data;
            });
         },
         hasViewedSplash: hasViewedSplash,
         setHasViewedSplash: setHasViewedSplash
      };

      function setHasViewedSplash(value) {
         if (value) {
            sessionStorage.setItem(VIEWED_SPLASH_KEY, true);
         } else {
            sessionStorage.removeItem(VIEWED_SPLASH_KEY);
         }
      }

      function hasViewedSplash() {
         return !!sessionStorage.getItem(VIEWED_SPLASH_KEY);
      }
   }]).filter("priorityColor", [function () {
      var map = {
         IMPORTANT: "red",
         HIGH: "blue",
         MEDIUM: "orange",
         LOW: "gray"
      };

      return function (priority) {
         if (priority in map) {
            return map[priority];
         }
         return "black";
      };
   }]).filter("wordLowerCamel", function () {
      return function (priority) {
         return priority.charAt(0) + priority.substr(1).toLowerCase();
      };
   }).filter("sortNotes", [function () {
      return function (messages) {
         if (!messages) {
            return;
         }
         var response = messages.slice(0).sort(function (prev, next) {
            if (prev.priority == next.priority) {
               return prev.lastUpdate == next.lastUpdate ? 0 : next.lastUpdate - prev.lastUpdate;
            } else {
               return prev.priority == "IMPORTANT" ? -11 : 1;
            }
         });
         return response;
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
         templateUrl: 'placenames/side-panel/side-panel-right.html',
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
         templateUrl: 'placenames/side-panel/trigger.html',
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
   }]).directive('sidePanelLeft', ['panelSideFactory', function (panelSideFactory) {
      return {
         restrict: 'E',
         transclude: true,
         templateUrl: 'placenames/side-panel/side-panel-left.html',
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
   angular.module('placenames.themes', []).directive('placenamesThemes', ['placenamesService', function (themesService) {
      return {
         restrict: 'AE',
         templateUrl: 'placenames/themes/themes.html',
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
   }]).controller('themesCtrl', ['themesService', function (themesService) {
      this.service = themesService;
   }]).filter('themesFilter', function () {
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
                     return name == theme.key;
                  })) {
                     response.push(feature);
                  }
               }
            });
         }
         return response;
      };
   }).factory('themesService', ['$q', 'configService', 'storageService', function ($q, configService, storageService) {
      var THEME_PERSIST_KEY = 'placenames.current.theme';
      var DEFAULT_THEME = "All";
      var waiting = [];
      var self = this;

      this.themes = [];
      this.theme = null;

      storageService.getItem(THEME_PERSIST_KEY).then(function (value) {
         if (!value) {
            value = DEFAULT_THEME;
         }
         configService.getConfig('themes').then(function (themes) {
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
         return configService.getConfig('themes');
      };

      this.setTheme = function (key) {
         this.theme = this.themes[key];
         storageService.setItem(THEME_PERSIST_KEY, key);
      };

      return this;
   }]);
}
"use strict";

{

   angular.module("placenames.toolbar", []).directive("placenamesToolbar", [function () {
      return {
         templateUrl: "placenames/toolbar/toolbar.html",
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
"use strict";

{

   angular.module("placenames.restrict.pan", []).directive("restrictPan", ['mapService', function (mapService) {
      return {
         restrict: "AE",
         scope: {
            bounds: "="
         },
         link: function link(scope) {
            mapService.getMap().then(function (map) {

               // We expect ll and ur in bounds
               var bounds = scope.bounds,
                   ll = bounds[0],
                   ur = bounds[1],
                   southWest = L.latLng(ll[0], ll[1]),
                   northEast = L.latLng(ur[0], ur[1]),
                   restrict = L.latLngBounds(southWest, northEast);

               map.setMaxBounds(restrict);
               map.on('drag', function () {
                  map.panInsideBounds(restrict, { animate: false });
               });
            });
         }
      };
   }]);
}
"use strict";

{

   angular.module("placenames.utils", []).filter("placenamesSplitBar", function () {
      return function () {
         var val = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";

         var buffer = "";
         val.split("|").forEach(function (name, index, variants) {
            buffer += (index && index < variants.length - 1 ? "," : "") + " ";
            if (index && index === variants.length - 1) {
               buffer += "or ";
            }
            buffer += name;
         });
         return buffer;
      };
   }).filter('placenamesFeature', ['configService', function (configService) {
      var features;
      configService.getConfig("featureCodes").then(function (featureCodes) {
         features = featureCodes;
      });
      return function (str) {
         var response = features ? features[str] : str;
         return response ? response : str;
      };
   }]).filter("placenamesGoogleLink", function () {
      var template = "https://www.google.com.au/maps/place/${name}/@${lat},${lng},14z";
      return function (what) {
         if (!what) return "";
         var location = what.location.split(" ");

         return template.replace("${name}", what.name).replace("${lng}", location[0]).replace("${lat}", location[1]);
      };
   }).factory('placenamesUtilsService', ['configService', function (configService) {
      var service = {};

      return service;
   }]);
}
angular.module("placenames.templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("placenames/about/about.html","<span class=\"about\" ng-mouseenter=\"over()\" ng-mouseleave=\"out()\"\r\n      ng-class=\"(about.show || about.ingroup || about.stick) ? \'transitioned-down\' : \'transitioned-up\'\">\r\n   <button class=\"undecorated about-unstick\" ng-click=\"unstick()\" style=\"float:right\">X</button>\r\n   <div class=\"aboutHeading\">About Place Names</div>\r\n   <div ng-repeat=\"item in about.items\">\r\n      <a ng-href=\"{{item.link}}\" name=\"about{{$index}}\" title=\"{{item.heading}}\" target=\"_blank\">\r\n         {{item.heading}}\r\n      </a>\r\n   </div>\r\n</span>");
$templateCache.put("placenames/about/button.html","<button ng-mouseenter=\"over()\" ng-mouseleave=\"out()\"\r\n      ng-click=\"toggleStick()\" tooltip-placement=\"left\" uib-tooltip=\"About Place Names\"\r\n      class=\"btn btn-primary btn-default\">About</button>");
$templateCache.put("placenames/authorities/authorities.html","<div ng-repeat=\"item in pa.authorities | pnUnselectedFacets\" class=\"row\">\r\n   <div class=\"col-md-12 ellipsis\" title=\'Jurisdiction: {{item.jurisdiction}}\'>\r\n      <button type=\"checkbox\" class=\"btn btn-primary btn-sm\" ng-click=\"item.selected = -1;pa.update()\"\r\n            ng-model=\"item.selected\" style=\"padding:0px 4px; margin: 1px;background-color: red;\">Add</button>\r\n      <span>\r\n         <a target=\"_blank\" href=\"http://www.google.com/search?q={{item.name}}\">{{item.name}}</a>\r\n         ({{(item.count | number) + (item.count || item.count == 0?\' of \':\'\')}}{{item.total | number}})\r\n      </span>\r\n   </div>\r\n</div>");
$templateCache.put("placenames/classifications/classifications.html","<div ng-repeat=\"item in pc.classifications | placenamesUnselectedFacets\" class=\"row\">\r\n   <div class=\"col-md-12 ellipsis\" title=\'Across all authorities there are a total of {{item.total | number}} features classed as \"{{item.name}}\"\'>\r\n      <button type=\"checkbox\" class=\"btn btn-primary btn-sm\" ng-click=\"item.selected = -1;pc.update()\"\r\n         ng-model=\"item.selected\" style=\"padding:0px 4px; margin: 1px;background-color: green;\">Add</button>\r\n      <span>\r\n         <a target=\"_blank\" href=\"http://www.google.com/search?q={{key}}\">{{item.name}}</a>\r\n         ({{(item.count | number) + (item.count || item.count == 0?\' of \':\'\')}}{{item.total | number}})\r\n      </span>\r\n   </div>\r\n</div>");
$templateCache.put("placenames/extent/extent.html","<div class=\"row\" style=\"border-top: 1px solid gray; padding-top:5px\">\r\n	<div class=\"col-md-5\">\r\n		<div class=\"form-inline\">\r\n			<label>\r\n				<input id=\"extentEnable\" type=\"checkbox\" ng-model=\"parameters.fromMap\" ng-click=\"change()\"></input> \r\n				Restrict area to map\r\n			</label>\r\n		</div>\r\n	</div>\r\n	 \r\n	<div class=\"col-md-7\" ng-show=\"parameters.fromMap\">\r\n		<div class=\"container-fluid\">\r\n			<div class=\"row\">\r\n				<div class=\"col-md-offset-3 col-md-8\">\r\n					<strong>Y Max:</strong> \r\n					<span>{{parameters.yMax | number : 4}}</span> \r\n				</div>\r\n			</div>\r\n			<div class=\"row\">\r\n				<div class=\"col-md-6\">\r\n					<strong>X Min:</strong>\r\n					<span>{{parameters.xMin | number : 4}}</span> \r\n				</div>\r\n				<div class=\"col-md-6\">\r\n					<strong>X Max:</strong>\r\n					<span>{{parameters.xMax | number : 4}}</span> \r\n				</div>\r\n			</div>\r\n			<div class=\"row\">\r\n				<div class=\"col-md-offset-3 col-md-8\">\r\n					<strong>Y Min:</strong>\r\n					<span>{{parameters.yMin | number : 4}}</span> \r\n				</div>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("placenames/featuretypes/featuretypes.html","<div ng-repeat=\"facet in vm.types | placenamesHasName | placenamesUnselectedFacets | orderBy:\'name\'\" class=\"row\">\r\n   <div class=\"col-md-12 ellipsis\">\r\n      <button type=\"checkbox\" class=\"btn btn-primary btn-sm\" ng-click=\"facet.selected = -1;vm.update()\"\r\n            ng-model=\"facet.selected\" style=\"padding:0px 4px; margin: 1px\">Add</button>\r\n      <span tooltip-append-to-body=\"true\" tooltip-placement=\"top-left\" uib-tooltip=\"{{facet.name}}\">\r\n         <a target=\"_blank\" href=\"http://www.google.com/search?q={{facet.name | placenamesClean}}\">{{facet.name}}</a>\r\n         ({{(facet.count | number) + (facet.count || facet.count == 0?\' of \':\'\')}}{{facet.total | number}})\r\n      </span>\r\n   </div>\r\n</div>");
$templateCache.put("placenames/header/header.html","<div class=\"container-full common-header\" style=\"padding-right:10px; padding-left:10px\">\r\n    <div class=\"navbar-header\">\r\n\r\n        <button type=\"button\" class=\"navbar-toggle\" data-toggle=\"collapse\" data-target=\".ga-header-collapse\">\r\n            <span class=\"sr-only\">Toggle navigation</span>\r\n            <span class=\"icon-bar\"></span>\r\n            <span class=\"icon-bar\"></span>\r\n            <span class=\"icon-bar\"></span>\r\n        </button>\r\n\r\n        <a href=\"http://www.ga.gov.au\" class=\"hidden-xs\"><img src=\"data:image/png;base64,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\" alt=\"Australian Government - Geoscience Australia\" class=\"logo\"></img></a>\r\n        <a href=\"http://www.ga.gov.au\" class=\"visible-xs\"><img src=\"data:image/png;base64,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\" alt=\"Australian Government - Geoscience Australia\" class=\"logo-stacked\"></img></a>\r\n        <a href=\"/\" class=\"appTitle visible-xs\">\r\n            <h1 style=\"font-size:120%\">{{heading}}</h1>\r\n        </a>\r\n    </div>\r\n    <div class=\"navbar-collapse collapse ga-header-collapse\">\r\n        <ul class=\"nav navbar-nav\">\r\n            <li class=\"hidden-xs\"><a href=\"/\"><h1 class=\"applicationTitle\">{{heading}}</h1></a></li>\r\n        </ul>\r\n        <ul class=\"nav navbar-nav navbar-right nav-icons\">\r\n         <li placenames-navigation role=\"menuitem\" current=\"current\" style=\"padding-right:10px\"></li>\r\n			<li mars-version-display role=\"menuitem\" style=\"padding-top: 19px;\"></li>\r\n			<li style=\"width:10px\"></li>\r\n        </ul>\r\n    </div><!--/.nav-collapse -->\r\n</div>\r\n\r\n<!-- Strap -->\r\n<div class=\"row\">\r\n    <div class=\"col-md-12\">\r\n        <div class=\"strap-blue\">\r\n        </div>\r\n        <div class=\"strap-white\">\r\n        </div>\r\n        <div class=\"strap-red\">\r\n        </div>\r\n    </div>\r\n</div>");
$templateCache.put("placenames/maps/maps.html","<div  ng-controller=\"MapsCtrl as maps\">\r\n	<div style=\"position:relative;padding:5px;padding-left:10px;\" >\r\n		<div class=\"panel panel-default\" style=\"padding:5px;\" >\r\n			<div class=\"panel-heading\">\r\n				<h3 class=\"panel-title\">Layers</h3>\r\n			</div>\r\n			<div class=\"panel-body\">\r\n				<div class=\"container-fluid\">\r\n					<div class=\"row\" ng-repeat=\"layer in layersTab.layers\" \r\n							style=\"padding:7px;padding-left:10px;position:relative\" ng-class-even=\"\'even\'\" ng-class-odd=\"\'odd\'\">\r\n						<div style=\"position:relative;left:6px;\">\r\n							<a href=\"{{layer.metadata}}\" target=\"_blank\" \r\n									class=\"featureLink\" title=\'View metadata related to \"{{layer.name}}\". (Opens new window.)\'>\r\n								{{layer.name}}\r\n							</a>\r\n							<div class=\"pull-right\" style=\"width:270px;\" tooltip=\"Show on map. {{layer.help}}\">\r\n								<span style=\"padding-left:10px;width:240px;\" class=\"pull-left\"><explorer-layer-slider layer=\"layer.layer\"></explorer-layer-slider></span>\r\n								<button style=\"padding:2px 8px 2px 2px;\" type=\"button\" class=\"undecorated featureLink pull-right\" href=\"javascript:;\" \r\n										ng-click=\"maps.toggleLayer(layer)\" >\r\n									<i class=\"fa\" ng-class=\"{\'fa-eye-slash\':(!layer.displayed), \'fa-eye active\':layer.displayed}\"></i>\r\n								</button>\r\n							</div>						\r\n						</div>\r\n					</div>\r\n				</div>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("placenames/navigation/altthemes.html","<span class=\"altthemes-container\">\r\n	<span ng-repeat=\"item in themes | altthemesMatchCurrent : current\">\r\n       <a title=\"{{item.label}}\" ng-href=\"{{item.url}}\" class=\"altthemesItemCompact\" target=\"_blank\">\r\n         <span class=\"altthemes-icon\" ng-class=\"item.className\"></span>\r\n       </a>\r\n    </li>\r\n</span>");
$templateCache.put("placenames/panes/panes.html","<div class=\"mapContainer\" class=\"col-md-12\" style=\"padding-right:0\">\r\n	<div class=\"panesMapContainer\" geo-map configuration=\"data.map\"></div>\r\n   <div class=\"base-layer-controller\">\r\n    	<div geo-draw data=\"data.map.drawOptions\" line-event=\"elevation.plot.data\" rectangle-event=\"bounds.drawn\"></div>\r\n   </div>\r\n   <restrict-pan bounds=\"data.map.position.bounds\"></restrict-pan>\r\n</div>");
$templateCache.put("placenames/pills/pills.html","<span class=\"btn btn-primary btn-xs pn-pill\" ng-repeat=\"type in pp.pills | placenamesSelectedFacets\" tooltip-append-to-body=\"true\" tooltip-placement=\"left\" uib-tooltip=\"{{type.name}}\">\r\n   <span style=\"max-width:100px;display:inline-block;\" class=\"ellipsis\">{{type.name}}</span>\r\n   <span style=\"max-width:100px;display:inline-block;\" class=\"ellipsis\"> ({{type.count?type.count:0 | number}})\r\n      <a ng-click=\"pp.clear(type)\" href=\"javascript:void(0)\">\r\n         <i class=\"fa fa-close fa-xs\" style=\"color: white\"></i>\r\n      </a>\r\n   </span>\r\n</span>");
$templateCache.put("placenames/popover/popover.html","<div class=\"placenames-popover {{direction}}\" ng-class=\"containerClass\" ng-show=\"show\">\r\n  <div class=\"arrow\"></div>\r\n  <div class=\"placenames-popover-inner\" ng-transclude></div>\r\n</div>");
$templateCache.put("placenames/reset/reset.html","<button type=\"button\" class=\"map-tool-toggle-btn\" ng-click=\"reset()\" title=\"Reset page\">\r\n   <span class=\"hidden-sm\">Reset</span>\r\n   <i class=\"fa fa-lg fa-refresh\"></i>\r\n</button>");
$templateCache.put("placenames/results/item.html","<div>\r\n<div class=\"container-fluid\">\r\n   <div class=\"row\">\r\n      <div class=\"col-md-12 pn-header\" >\r\n         <button type=\"button\" class=\"undecorated\" ng-click=\"vm.showPan(vm.item)\"\r\n                tooltip-append-to-body=\"true\" title=\"Zoom to location and mark.\" tooltip-placement=\"left\" uib-tooltip=\"Zoom to location and mark\">\r\n            <i class=\"fa fa-lg fa-flag-o\"></i>\r\n         </button>\r\n         <span><a ng-href=\"{{vm.item | placenamesGoogleLink}}\" target=\"_google\"\r\n            title=\"View in Google maps. While the location will always be correct, Google will do a best guess at matching the Gazetteer name to its data.\">{{vm.item.name}}</a></span>\r\n         <span class=\"pull-right\">Record ID: {{vm.item.recordId}}</span>\r\n      </div>\r\n   </div>\r\n</div>\r\n<div ng-if=\"!vm.feature\" style=\"padding:20px 10px 130px;\">\r\n   <i class=\"fa-spinner fa-spin fa fa-lf\"></i>Loading full data&hellip;\r\n</div>\r\n<div class=\"container-fluid\" ng-if=\"vm.feature\">\r\n   <div class=\"row\" ng-if=\"vm.feature.attributes.Variant_Name\">\r\n      <div class=\"col-md-4\">Variant Name</div>\r\n      <div class=\"col-md-8\">{{vm.feature.attributes.Variant_Name | placenamesSplitBar}}</div>\r\n   </div>\r\n   <div class=\"row\" ng-if=\"vm.feature.attributes\">\r\n      <div class=\"col-md-4\">State</div>\r\n      <div class=\"col-md-8\">{{vm.feature.attributes.State}}</div>\r\n   </div>\r\n   <div class=\"row\">\r\n      <div class=\"col-md-4\">Feature Type</div>\r\n      <div class=\"col-md-8\">{{vm.item.featureCode | placenamesFeature}}</div>\r\n   </div>\r\n   <div class=\"row\">\r\n      <div class=\"col-md-4\">Classification</div>\r\n      <div class=\"col-md-8\">{{vm.item.classification}}</div>\r\n   </div>\r\n   <div class=\"row\" ng-if=\"vm.feature.attributes\">\r\n      <div class=\"col-md-4\">CGDN</div>\r\n      <div class=\"col-md-8\">{{vm.feature.attributes.CGDN}}</div>\r\n   </div>\r\n   <div class=\"row\" ng-if=\"vm.feature.attributes\">\r\n      <div class=\"col-md-4\">Concise Gazetteer</div>\r\n      <div class=\"col-md-8\">{{vm.feature.attributes.Concise_gaz}}</div>\r\n   </div>\r\n   <div class=\"row\" ng-if=\"vm.feature.attributes.Map_100K\">\r\n      <div class=\"col-md-4\">1:100K Map Index</div>\r\n      <div class=\"col-md-8\"><span class=\"pn-numeric\">{{vm.feature.attributes.Map_100K}}</span></div>\r\n   </div>\r\n   <div class=\"row\">\r\n      <div class=\"col-md-4\">Authority</div>\r\n      <div class=\"col-md-8\">{{vm.item.authority}}</div>\r\n   </div>\r\n   <div class=\"row\" ng-if=\"vm.feature.attributes\">\r\n      <div class=\"col-md-4\">Status Description</div>\r\n      <div class=\"col-md-8\">{{vm.feature.attributes.Status_desc}}</div>\r\n   </div>\r\n   <div class=\"row\" ng-if=\"vm.feature.attributes.Lat_minutes\">\r\n      <div class=\"col-md-4\">Latitude</div>\r\n      <div class=\"col-md-4\">\r\n         <span class=\"pn-numeric\">\r\n            {{vm.feature.attributes.Lat_degrees}}&deg;\r\n            {{vm.feature.attributes.Lat_minutes}}&prime;\r\n            {{vm.feature.attributes.Lat_seconds}}&Prime;\r\n         </span>\r\n      </div>\r\n      <div class=\"col-md-4\">\r\n         <span class=\"pn-numeric\">\r\n            {{vm.feature.attributes.Latitude}}&deg;\r\n         </span>\r\n      </div>\r\n   </div>\r\n\r\n   <div class=\"row\" ng-if=\"!vm.feature.noData && !vm.feature.attributes.Lat_minutes\">\r\n      <div class=\"col-md-4\">Latitude</div>\r\n      <div class=\"col-md-8\">\r\n         <span class=\"pn-numeric\">\r\n            {{vm.feature.attributes.Latitude}}&deg;\r\n         </span>\r\n      </div>\r\n   </div>\r\n\r\n   <div class=\"row\" ng-if=\"vm.feature.noData \">\r\n      <div class=\"col-md-4\">Latitude</div>\r\n      <div class=\"col-md-8\">\r\n         <span class=\"pn-numeric\">\r\n            {{vm.item.location | itemLongitude}}&deg;\r\n         </span>\r\n      </div>\r\n   </div>\r\n\r\n   <div class=\"row\" ng-if=\"vm.feature.noData \">\r\n      <div class=\"col-md-4\">Latitude</div>\r\n      <div class=\"col-md-8\">\r\n         <span class=\"pn-numeric\">\r\n            {{vm.item.location | itemLatitude}}&deg;\r\n         </span>\r\n      </div>\r\n   </div>\r\n\r\n   <div class=\"row\" ng-if=\"vm.feature.attributes.Long_minutes\">\r\n      <div class=\"col-md-4\">Longitude</div>\r\n      <div class=\"col-md-4\"><span class=\"pn-numeric\">\r\n         {{vm.feature.attributes.Long_degrees}}&deg;\r\n         {{vm.feature.attributes.Long_minutes}}&prime;\r\n         {{vm.feature.attributes.Long_seconds}}&Prime;\r\n         </span>\r\n      </div>\r\n      <div class=\"col-md-4\">\r\n         <span class=\"pn-numeric\">\r\n         {{vm.feature.attributes.Longitude}}&deg;</span></div>\r\n   </div>\r\n\r\n   <div class=\"row\" ng-if=\"!vm.feature.noData && !vm.feature.attributes.Long_minutes\">\r\n      <div class=\"col-md-4\">Longitude</div>\r\n      <div class=\"col-md-8\">\r\n         <span class=\"pn-numeric\">\r\n         {{vm.feature.attributes.Longitude}}&deg;</span></div>\r\n   </div>\r\n   <div class=\"row pn-item-footer\" ng-if=\"vm.feature.attributes\">\r\n      <div class=\"col-md-12\">Download as:\r\n         <span class=\"pull-right\">\r\n            [<a href\"javascript:void()\" ng-click=\"vm.download(\'wfs\')\">WFS Get Feature</a>]\r\n         </span>\r\n      </div>\r\n   </div>\r\n   <div class=\"row pn-item-footer\" ng-if=\"vm.feature.noData\">\r\n      <i class=\"fa fa-exclamation-circle\" aria-hidden=\"true\"></i>\r\n      We found no further metadata for this dataset. At a future time further metadata may be available.\r\n   </div>\r\n</div>");
$templateCache.put("placenames/results/results.html","<div class=\"panel panel-default pn-container\" ng-if=\"pr.data.searched\" common-scroller more=\"pr.more()\" ng-if=\"pr.data.searched\">\r\n   <div class=\"panel-heading\" style=\"min-height:25px\">\r\n      <span ng-if=\"pr.data.searched.item\">\r\n         Showing selected feature\r\n      </span>\r\n      <span ng-if=\"!pr.data.searched.item\">\r\n         Matched {{pr.data.searched.data.response.numFound | number}} features, showing {{pr.data.searched.data.response.docs.length | number}} features\r\n         <a href\"javascript:void()\" ng-click=\"pr.download()\" ng-show=\"pr.data.searched.data.response.docs.length\" uib-tooltip=\"Download listed features in ESRI JSON format\" tooltip-placement=\"bottom\">\r\n            <i class=\"fa fa-download\"></i>\r\n         </a>\r\n      </span>\r\n      <span class=\"pull-right\">\r\n         <a href\"javascript:void()\" ng-if=\"!pr.data.searched.item\" ng-click=\"pr.more()\" tooltip-placement=\"top\"\r\n               uib-tooltip=\"Scroll to the bottom of results or click here to load more matching features\">\r\n            [Load more...]\r\n         </a>\r\n         <a href=\"#\" ng-click=\"pr.clear()\" uib-tooltip=\"Clear results and return to search\" tooltip-placement=\"left\">\r\n            <i class=\"fa fa-times-rectangle-o fa-lg\" aria-hidden=\"true\"></i>\r\n         </a>\r\n      </span>\r\n   </div>\r\n   <div class=\"panel-heading\">\r\n      <placenames-results-item ng-if=\"pr.data.searched.item\" item=\"pr.data.searched.item\"></placenames-results-item>\r\n      <div class=\"pn-results-list\" ng-if=\"!pr.data.searched.item\" ng-repeat=\"doc in pr.data.searched.data.response.docs\">\r\n         <placenames-results-item item=\"doc\"></placenames-results-item>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("placenames/search/search.html","<div class=\"pn-search-container\">\r\n   <placenames-results ng-if=\"state.searched\" data=\"state\"></placenames-results>\r\n   <div style=\"float:clear\" ng-show=\"!state.searched\">\r\n      <h4 style=\"font-size:12\">Search by map location, partial name match or feature type</h4>\r\n      <div class=\"search-text\">\r\n         <div class=\"input-group input-group-sm\">\r\n            <span class=\"input-group-addon\" id=\"names1\">Filter:</span>\r\n\r\n            <input type=\"text\" ng-model=\"state.filter\" placeholder=\"Match by feature name...\" ng-model-options=\"{ debounce: 300}\"\r\n                  typeahead-on-select=\"select($item, $model, $label)\" typeahead-template-url=\"placenames/search/typeahead.html\"\r\n                  class=\"form-control\" typeahead-min-length=\"0\" uib-typeahead=\"doc as doc.name for doc in loadDocs(state.filter)\"\r\n                  typeahead-loading=\"loadingLocations\" typeahead-no-results=\"noResults\" placenames-clear>\r\n\r\n            <span class=\"input-group-btn\">\r\n            <button class=\"btn btn-primary\" type=\"button\" ng-click=\"search()\" ng-disabled=\"!state.persist.data || !state.filtered.response.numFound\">Search</button>\r\n         </span>\r\n         </div>\r\n      </div>\r\n      <div class=\"clearfix\">\r\n         <div>\r\n            <strong style=\"float:right\">Found {{state.filtered.response.numFound | number:0}} features</strong>\r\n            <placenames-featuretypes-pills ng-if=\"state.featureCodes.length\" features=\"state.featureCodes\" update=\"update()\"></placenames-featuretypes-pills>\r\n            <placenames-classifications-pills ng-if=\"state.classifications.length\" classifications=\"state.classifications\" update=\"update()\"></placenames-classifications-pills>\r\n            <placenames-authorities-pills ng-if=\"state.authorities.length\" authorities=\"state.authorities\" update=\"update()\"></placenames-authorities-pills>\r\n         </div>\r\n      </div>\r\n      <uib-accordion close-others=\"oneAtATime\">\r\n         <div uib-accordion-group class=\"panel-default\" is-open=\"status.open\">\r\n            <uib-accordion-heading>\r\n               <span class=\"pn-featuretypes-swathe\"></span>\r\n               Filter by feature type...\r\n               <i class=\"pull-right glyphicon\" ng-class=\"{\'glyphicon-chevron-down\': status.open, \'glyphicon-chevron-right\': !status.open}\"></i>\r\n            </uib-accordion-heading>\r\n            <placenames-featuretypes ng-if=\"status.open\" types=\"state.featureCodes\" update=\"update()\"></placenames-featuretypes>\r\n         </div>\r\n         <div uib-accordion-group class=\"panel-default\" is-open=\"status.classOpen\">\r\n            <uib-accordion-heading>\r\n               <span class=\"pn-classifications-swathe\"></span>\r\n               Filter by classification...\r\n               <i class=\"pull-right glyphicon\" ng-class=\"{\'glyphicon-chevron-down\': status.classOpen, \'glyphicon-chevron-right\': !status.classOpen}\"></i>\r\n            </uib-accordion-heading>\r\n            <placenames-classifications classifications=\"state.classifications\" update=\"update()\" ng-if=\"status.classOpen\"></placenames-classifications>\r\n         </div>\r\n         <div uib-accordion-group class=\"panel-default\" is-open=\"status.authOpen\">\r\n            <uib-accordion-heading>\r\n               <span class=\"pn-authorities-swathe\"></span>\r\n               Filter by authority...\r\n               <i class=\"pull-right glyphicon\" ng-class=\"{\'glyphicon-chevron-down\': status.authOpen, \'glyphicon-chevron-right\': !status.authOpen}\"></i>\r\n            </uib-accordion-heading>\r\n            <placenames-authorities authorities=\"state.authorities\" update=\"update()\" ng-if=\"status.authOpen\"></placenames-authorities>\r\n         </div>\r\n      </uib-accordion>\r\n   </div>\r\n</div>");
$templateCache.put("placenames/search/typeahead.html","<a placenames-options ng-mouseenter=\"enter()\" ng-mouseleave=\"leave()\"  tooltip-append-to-body=\"true\"\r\n               tooltip-placement=\"left\" uib-tooltip-html=\"match.model | placenamesTooltip\">\r\n   <span ng-bind-html=\"match.model.name | uibTypeaheadHighlight:query\"></span>\r\n   (<span ng-bind-html=\"match.model.recordId\"></span>)\r\n</a>");
$templateCache.put("placenames/splash/splash.html","<div class=\"modal-header\">\r\n   <h3 class=\"modal-title splash\">Place Names</h3>\r\n</div>\r\n<div class=\"modal-body\" id=\"accept\" ng-form exp-enter=\"accept()\" placenames-splash-modal style=\"width: 100%; margin-left: auto; margin-right: auto;\">\r\n	<div style=\"border-bottom:1px solid gray\">\r\n		<p>\r\n			Users can download the place names data over the Indian Ocean which is licensed under Creative Commons.\r\n		</p>\r\n		<p>\r\n			Data can be downloaded from the portal at <strong>no charge</strong> and there is no limit to how many requests you can place (please check the file size before you download your results).\r\n		</p>\r\n		<p>\r\n			If you need datasets in full, please contact <a href=\"clientservices@ga.gov.au\">clientservices@ga.gov.au</a>.\r\n		</p>\r\n		<p>\r\n			<a href=\"http://opentopo.sdsc.edu/gridsphere/gridsphere?cid=contributeframeportlet&gs_action=listTools\" target=\"_blank\">Click here for Free GIS Tools.</a>\r\n		</p>\r\n\r\n		<div style=\"padding:30px; padding-top:0; padding-bottom:40px; width:100%\">\r\n			<div class=\"pull-right\">\r\n			  	<button type=\"button\" class=\"btn btn-primary\" ng-model=\"seenSplash\" ng-focus ng-click=\"accept()\">Continue</button>\r\n			</div>\r\n		</div>\r\n	</div>\r\n	<div ng-show=\"messages.length > 0\" class=\"container\" style=\"width:100%; max-height:250px; overflow-y:auto\">\r\n		<div class=\"row\" ng-class-even=\"\'grayline\'\" style=\"font-weight:bold\">\r\n			<div class=\"col-sm-12\" ><h3>News</h3></div>\r\n		</div>\r\n\r\n		<div class=\"row\"ng-class-even=\"\'grayline\'\" style=\"max-height:400px;overflow:auto\" ng-repeat=\"message in messages | sortNotes\">\r\n			<div class=\"col-sm-12\">\r\n				<h4>{{message.title}} <span class=\"pull-right\" style=\"font-size:70%\">Created: {{message.creationDate | date : \"dd/MM/yyyy\"}}</span></h4>\r\n				<div ng-bind-html=\"message.description\"></div>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("placenames/side-panel/side-panel-left.html","<div class=\"cbp-spmenu cbp-spmenu-vertical cbp-spmenu-left\" style=\"width: {{left.width}}px;\" ng-class=\"{\'cbp-spmenu-open\': left.active}\">\r\n    <a href=\"\" title=\"Close panel\" ng-click=\"closeLeft()\" style=\"z-index: 1200\">\r\n        <span class=\"glyphicon glyphicon-chevron-left pull-right\"></span>\r\n    </a>\r\n    <div ng-show=\"left.active === \'legend\'\" class=\"left-side-menu-container\">\r\n        <legend url=\"\'img/AustralianTopogaphyLegend.png\'\" title=\"\'Map Legend\'\"></legend>\r\n    </div>\r\n</div>");
$templateCache.put("placenames/side-panel/side-panel-right.html","<div class=\"cbp-spmenu cbp-spmenu-vertical cbp-spmenu-right noPrint\" ng-attr-style=\"width:{{right.width}}\" ng-class=\"{\'cbp-spmenu-open\': right.active}\">\r\n    <a href=\"\" title=\"Close panel\" ng-click=\"closePanel()\" style=\"z-index: 1200\">\r\n        <span class=\"glyphicon glyphicon-chevron-right pull-left\"></span>\r\n    </a>\r\n    <div ng-show=\"right.active === \'search\'\" class=\"right-side-menu-container\">\r\n        <div class=\"panesTabContentItem\" placenames-search ></div>\r\n    </div>\r\n    <div ng-if=\"right.active === \'glossary\'\" class=\"right-side-menu-container\">\r\n        <div class=\"panesTabContentItem\" placenames-glossary></div>\r\n    </div>\r\n    <div ng-show=\"right.active === \'help\'\" class=\"right-side-menu-container\">\r\n        <div class=\"panesTabContentItem\" placenames-help></div>\r\n    </div>\r\n</div>\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n");
$templateCache.put("placenames/side-panel/trigger.html","<button ng-click=\"toggle()\" type=\"button\" class=\"map-tool-toggle-btn\">\r\n   <span class=\"hidden-sm\">{{name}}</span>\r\n   <i class=\"fa fa-lg\" ng-class=\"iconClass\"></i>\r\n</button>");
$templateCache.put("placenames/themes/themes.html","<div class=\"dropdown themesdropdown\">\r\n   <button class=\"btn btn-default dropdown-toggle themescurrent\" type=\"button\" id=\"dropdownMenu1\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">\r\n     Theme\r\n     <span class=\"caret\"></span>\r\n   </button>\r\n   <ul class=\"dropdown-menu\" aria-labelledby=\"dropdownMenu1\">\r\n     <li ng-repeat=\"item in themes\">\r\n        <a href=\"#\" title=\"{{item.title}}\" ng-href=\"{{item.url}}\" class=\"themesItemCompact\">\r\n          <span class=\"icsm-icon\" ng-class=\"item.className\"></span>\r\n          <strong style=\"vertical-align:top;font-size:110%\">{{item.label}}</strong>\r\n        </a>\r\n     </li>\r\n   </ul>\r\n </div>");
$templateCache.put("placenames/toolbar/toolbar.html","<div class=\"placenames-toolbar noPrint\">\r\n    <div class=\"toolBarContainer\">\r\n        <div>\r\n            <ul class=\"left-toolbar-items\"></ul>\r\n            <ul class=\"right-toolbar-items\">\r\n                <li>\r\n                    <panel-trigger panel-id=\"search\" panel-width=\"540px\" name=\"Search\" icon-class=\"fa-search\" default=\"true\"></panel-trigger>\r\n                </li>\r\n                <li reset-page></li>\r\n            </ul>\r\n        </div>\r\n    </div>\r\n</div>");}]);