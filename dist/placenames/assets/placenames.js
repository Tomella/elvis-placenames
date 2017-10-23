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
   angular.module('placenames.antarctic', []).directive('antarcticView', function () {
      return {
         restrict: 'AE',
         scope: {},
         templateUrl: 'placenames/antarctic/antarctic.html',
         controller: ['$scope', function ($scope) {
            $scope.go = function () {
               window.location = "antarctic.html";
            };
         }]
      };
   });
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

   angular.module("PlacenamesApp", ['explorer.config', 'explorer.confirm', 'explorer.enter', 'explorer.flasher', 'explorer.googleanalytics', 'explorer.info', 'explorer.message', 'explorer.modal', 'explorer.persist', 'explorer.projects', 'explorer.version', 'exp.ui.templates', 'explorer.map.templates', 'ui.bootstrap', 'ngAutocomplete', 'ngRoute', 'ngSanitize', 'page.footer', 'geo.baselayer.control', 'geo.draw', 'geo.map', 'geo.maphelper', 'geo.measure', 'placenames.about', 'placenames.antarctic', 'placenames.bounds', 'placenames.clusters', 'placenames.contributors', 'placenames.download', 'placenames.extent', 'placenames.filters', 'placenames.header', 'placenames.maps', 'placenames.navigation', 'placenames.panes', 'placenames.popover', 'placenames.proxy', 'placenames.quicksearch', 'placenames.reset', "placenames.results", "placenames.search", "placenames.side-panel", 'placenames.splash', 'placenames.templates', 'placenames.toolbar', 'placenames.utils'])

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
"use strict";

{
   angular.module("placenames.authorities", []).directive('placenamesAuthorities', ["groupsService", "placenamesSearchService", function (groupsService, placenamesSearchService) {
      return {
         restrict: 'EA',
         templateUrl: "placenames/authorities/authorities.html",
         link: function link(scope) {
            groupsService.getAuthorities().then(function (authorities) {
               return scope.authorities = authorities;
            });
            scope.change = function (item) {
               placenamesSearchService.filtered();
            };
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
"use strict";

{
   angular.module("placenames.categories", []).directive("placenamesCategories", ['groupsService', "placenamesSearchService", function (groupsService, placenamesSearchService) {
      return {
         templateUrl: "placenames/categories/categories.html",
         link: function link(scope) {
            groupsService.getCategories().then(function (categories) {
               return scope.categories = categories;
            });
            scope.change = function () {
               placenamesSearchService.filtered();
            };
         }
      };
   }]).directive("placenamesCategoryChildren", [function () {
      return {
         templateUrl: "placenames/categories/features.html",
         scope: {
            features: "="
         }
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
                     properties: {
                        count: count
                     },
                     geometry: {
                        type: "Point",
                        coordinates: []
                     }
                  },
                      properties = cell.properties,
                      geometry = cell.geometry;

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
               var x = cell.geometry.coordinates[1];
               var y = cell.geometry.coordinates[0];
               for (var i = 0; i < count; i++) {
                  _this3.layer.addLayer(L.marker([x, y]));
               }
            });
         } else {
            this.layer = L.markerClusterGroup({
               disableClusteringAtZoom: count > 600 ? 12 : 4
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
"use strict";

{

   angular.module('placenames.contributors', []).directive("placenamesContributors", ["$interval", "contributorsService", function ($interval, contributorsService) {
      return {
         templateUrl: "placenames/contributors/contributors.html",
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
         templateUrl: "placenames/contributors/show.html",
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
   angular.module("placenames.download", []).directive("placenamesDownload", ["flashService", "messageService", "placenamesDownloadService", function (flashService, messageService, placenamesDownloadService) {
      return {
         templateUrl: "placenames/download/download.html",
         scope: {
            data: "="
         },
         link: function link(scope) {
            scope.processing = placenamesDownloadService.data;

            scope.$watch("processing.filename", testFilename);

            scope.submit = function () {
               var flasher = flashService.add("Submitting your job for processing", null, true);
               if (scope.processing.outFormat.restrictCoordSys) {
                  scope.processing.outCoordSys = scope.processing.config.outCoordSys.find(function (coord) {
                     return coord.code === scope.processing.outFormat.restrictCoordSys;
                  });
                  messageService.warn(scope.processing.outFormat.restrictMessage);
               }

               placenamesDownloadService.submit(scope.data.params).then(function (_ref) {
                  var data = _ref.data;

                  flasher.remove();
                  if (data.serviceResponse.statusInfo.status === "success") {
                     messageService.success("Your job has successfuly been queued for processing.");
                  } else {
                     messageService.warn("The request has failed. Please try again later and if problems persist please contact us");
                  }
               }).catch(function () {
                  flasher.remove();
                  messageService.warn("The request has failed. Please try again later and if problems persist please contact us");
               });
            };

            testFilename();

            function testFilename(value) {
               if (scope.processing.filename && scope.processing.filename.length > 16) {
                  scope.processing.filename = scope.processing.filename.substr(0, 16);
               }
               scope.processing.validFilename = !scope.processing.filename || scope.processing.filename.match(/^[a-zA-Z0-9\_\-]+$/);
            }
         }
      };
   }]).factory("placenamesDownloadService", ["$http", "configService", "storageService", function ($http, configService, storageService) {
      var EMAIL_KEY = "download_email";

      var service = {
         data: {
            show: false,
            email: null,
            validFilename: false,

            get valid() {
               return this.percentComplete === 100;
            },

            get validEmail() {
               return this.email;
            },

            get validProjection() {
               return this.outCoordSys;
            },

            get validFormat() {
               return this.outFormat;
            },

            get percentComplete() {
               return (this.validEmail ? 25 : 0) + (this.validFilename ? 25 : 0) + (this.validProjection ? 25 : 0) + (this.validFormat ? 25 : 0);
            }
         },

         submit: function submit(_ref2) {
            var fq = _ref2.fq,
                q = _ref2.q;

            var postData = {
               file_name: this.data.filename ? this.data.filename : "output_filename",
               file_format_vector: this.data.outFormat.code,
               coord_sys: this.data.outCoordSys.code,
               email_address: this.data.email,
               params: {
                  q: q,
                  fq: fq
               }
            };

            this.setEmail(this.data.email);
            if (this.data.fileName) {
               postData.file_name = this.data.fileName;
            }

            return $http({
               url: this.data.config.serviceUrl,
               method: 'POST',
               //assign content-type as undefined, the browser
               //will assign the correct boundary for us
               //prevents serializing payload.  don't do it.
               headers: {
                  "Content-Type": "application/json"
               },
               data: postData
            });
         },

         setEmail: function setEmail(email) {
            storageService.setItem(EMAIL_KEY, email);
         },

         getEmail: function getEmail() {
            return storageService.getItem(EMAIL_KEY).then(function (value) {
               service.data.email = value;
               return value;
            });
         }
      };

      configService.getConfig("download").then(function (config) {
         return service.data.config = config;
      });
      service.getEmail().then(function (email) {
         return service.data.email = email;
      });

      return service;
   }]).filter("productIntersect", function () {
      return function intersecting(collection, extent) {
         // The extent may have missing numbers so we don't restrict at that point.
         if (!extent || !collection) {
            return collection;
         }

         return collection.filter(function (item) {
            // We know these have valid numbers if it exists
            if (!item.extent) {
               return true;
            }

            var _item$extent = item.extent,
                xMax = _item$extent.xMax,
                xMin = _item$extent.xMin,
                yMax = _item$extent.yMax,
                yMin = _item$extent.yMin;

            return extent.intersects([[yMin, xMin], [yMax, xMax]]);
         });
      };
   });
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
"use strict";

{
   angular.module("placenames.feature", []).directive("placenamesFeatures", ['groupsService', "placenamesSearchService", function (groupsService, placenamesSearchService) {
      return {
         templateUrl: "placenames/features/features.html",
         link: function link(scope) {
            groupsService.getFeatures().then(function (features) {
               return scope.features = features;
            });
            scope.change = function () {
               placenamesSearchService.filtered();
            };
         }
      };
   }]);
}
'use strict';

{
   var options = { cache: true };
   var feature = null;
   var authorities = [];
   var groups = [];
   var categories = [];
   var featureCodes = [];

   angular.module('placenames.filters', ['placenames.groups']).directive('placenamesFilters', [function () {
      return {
         templateUrl: "placenames/filters/filters.html",
         scope: {
            status: "=",
            state: "="
         },
         link: function link(scope) {
            scope.$watch("status.groupOpen", function (value) {
               var status = scope.status;
            });
         }
      };
   }]);
}
"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

{
   var createCategories = function createCategories(target) {
      target.categories = Object.keys(target.groups);
   };

   angular.module("placenames.groups", ["placenames.feature", "placenames.categories"]).directive("placenamesGroups", ['groupsService', "placenamesSearchService", function (groupsService, placenamesSearchService) {
      return {
         templateUrl: "placenames/groups/groups.html",
         link: function link(scope) {
            groupsService.getGroups().then(function (data) {
               scope.data = data;
            });

            scope.change = function () {
               console.log("Update groups");
               placenamesSearchService.filtered();
            };
         }
      };
   }]).directive("placenamesGroupChildren", ['groupsService', function (groupsService) {
      return {
         templateUrl: "placenames/groups/category.html",
         scope: {
            category: "="
         }
      };
   }]).factory("groupsService", ["$http", "$q", "$rootScope", "configService", "mapService", function ($http, $q, $rootScope, configService, mapService) {

      var service = {};
      service.getGroups = function () {
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

                     var response = {
                        name: key,
                        total: count.group[key] ? count.group[key] : 0,
                        definition: data[key].definition,
                        categories: Object.keys(data[key]).filter(function (key) {
                           return !(key === 'name' || key === 'definition');
                        }).map(function (name) {
                           return {
                              name: name,
                              total: count.category[name] ? count.category[name] : 0,
                              definition: data[key][name].definition,
                              parent: data[key],
                              features: data[key][name].features
                           };
                        })
                     };

                     (_config$categories = config.categories).push.apply(_config$categories, _toConsumableArray(response.categories));
                     response.categories.forEach(function (category) {
                        var _config$features;

                        (_config$features = config.features).push.apply(_config$features, _toConsumableArray(category.features.map(function (feature) {
                           feature.parent = category;
                           feature.total = count.feature[feature.name] ? count.feature[feature.name] : 0;
                           return feature;
                        })));
                     });
                     return response;
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
                  return config;
               });
            });
         });

         return service.promise;
      };

      service.getCategories = function () {
         return service.getGroups().then(function () {
            return service.config.categories;
         });
      };

      service.getAll = function () {
         return service.getGroups().then(function () {
            return service.config;
         });
      };

      service.getAuthorities = function () {
         return service.getGroups().then(function () {
            return service.config.authorities;
         });
      };

      service.getFeatures = function () {
         return service.getGroups().then(function () {
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
         templateUrl: "placenames/header/header.html",
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
   angular.module("placenames.quicksearch", []).directive('placenamesQuicksearch', [function () {
      return {
         link: function link(scope) {},
         templateUrl: "placenames/quicksearch/quicksearch.html"
      };
   }]).directive('placenamesFilteredSummary', ["placenamesSearchService", function (placenamesSearchService) {
      return {
         scope: {
            state: "="
         },
         templateUrl: "placenames/quicksearch/filteredsummary.html",
         link: function link(scope) {
            scope.summary = placenamesSearchService.summary;
         }
      };
   }]).filter("quicksummary", [function () {
      return function (items, key) {
         return items.map(function (item) {
            return item[key];
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

   angular.module("placenames.results.item", []).directive("placenamesResultsItem", ['placenamesItemService', 'placenamesResultsService', 'placenamesSearchService', function (placenamesItemService, placenamesResultsService, placenamesSearchService) {

      return {
         templateUrl: "placenames/results/item.html",
         bindToController: {
            item: "="
         },
         controller: function controller() {
            console.log("Creating an item scope");
            this.showPan = function (feature) {
               placenamesResultsService.showPan(feature);
            };

            this.download = function (type) {
               placenamesItemService[type](this);
            };

            this.leave = function () {
               placenamesSearchService.hide();
            };

            this.enter = function () {
               placenamesSearchService.show(this.item);
            };

            this.$destroy = function () {
               placenamesSearchService.hide();
            };
         },
         controllerAs: "vm"
      };
   }]).factory('placenamesItemService', ['$http', 'configService', function ($http, configService) {
      var service = {
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
   angular.module("placenames.results", ['placenames.results.item', 'placenames.scroll', 'placenames.download']).directive("placenamesResultsSummary", [function () {
      return {
         templateUrl: "placenames/results/summary.html",
         scope: {
            state: "="
         }
      };
   }]).directive("placenamesResultsDownload", [function () {
      return {
         template: "<placenames-download data='data'></placenames-download>",
         scope: {
            data: "="
         }
      };
   }]).directive("placenamesResults", ['placenamesResultsService', function (placenamesResultsService) {
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

            this.clear = function () {
               placenamesResultsService.clear(this.data);
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
   }]).factory("placenamesResultsService", ResultsService).filter("formatDate", function () {
      return function (dateStr) {
         if (!dateStr) {
            return dateStr;
         }
         var date = new Date(dateStr);
         return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
      };
   }).filter("resultsHasSomeData", function () {
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
      clear: function clear(data) {
         data.searched = null;
         $timeout(function () {
            $rootScope.$broadcast("clear.button.fired");
         }, 10);
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

      moreDocs: function moreDocs(persist) {
         if (!persist) {
            return;
         }

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
   angular.module("placenames.search", ['placenames.filters', 'placenames.authorities']).directive('placenamesClear', ['placenamesSearchService', function (placenamesSearchService) {
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
   }]).directive('placenamesSearchFilters', ["groupsService", "placenamesSearchService", function (groupsService, placenamesSearchService) {
      var groupMatch = {
         group: "groups",
         category: "categories",
         feature: "features"
      };

      return {
         templateUrl: "placenames/search/searchfilters.html",
         link: function link(scope) {
            scope.summary = placenamesSearchService.summary;
            scope.data = placenamesSearchService.data;
            groupsService.getAll().then(function (data) {
               if (scope.data.filterBy) {
                  var type = groupMatch[scope.data.filterBy];
                  scope.filters = data[type].filter(function (item) {
                     return item.selected;
                  }).map(function (item) {
                     return item.name;
                  }).join(", ");
                  if (scope.filters.length) {
                     scope.type = type;
                  }
               }
               scope.authorities = data.authorities.filter(function (authority) {
                  return authority.selected;
               }).map(function (authority) {
                  return authority.code;
               }).join(", ");
            });
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
   }]).directive("placenamesQuickSearch", ['$rootScope', '$timeout', 'groupsService', 'placenamesSearchService', function ($rootScope, $timeout, groupsService, placenamesSearchService) {
      return {
         templateUrl: 'placenames/search/quicksearch.html',
         restrict: 'AE',
         link: function link(scope) {
            scope.state = placenamesSearchService.data;

            scope.loadDocs = function () {
               return placenamesSearchService.filtered().then(function (fetched) {
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
               placenamesSearchService.search(item);
               $timeout(function () {
                  $rootScope.$broadcast("search.button.fired");
               }, 100);
            };
         }
      };
   }]).directive("placenamesSearch", ['$timeout', 'groupsService', 'placenamesSearchService', function ($timeout, groupsService, placenamesSearchService) {
      return {
         templateUrl: 'placenames/search/search.html',
         restrict: 'AE',
         link: function link(scope) {
            scope.state = placenamesSearchService.data;
            scope.status = {};

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

            scope.select = function (item) {
               scope.search(item);
            };

            scope.deselect = function (facet) {
               facet.selected = false;
               placenamesSearchService.filtered();
            };

            scope.$watch("status.groupOpen", function (load) {
               if (load) {
                  console.log("Update filter", load);
                  scope.state.filterBy = "group";
                  placenamesSearchService.filtered();
               }
            });

            scope.$watch("status.catOpen", function (load) {
               if (load) {
                  console.log("Update filter", load);
                  scope.state.filterBy = "category";
                  placenamesSearchService.filtered();
               }
            });

            scope.$watch("status.featureOpen", function (load) {
               if (load) {
                  console.log("Update filter", load);
                  scope.state.filterBy = "feature";
                  placenamesSearchService.filtered();
               }
            });
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
   }]).factory('placenamesSearchService', SearchService);

   SearchService.$inject = ['$http', '$rootScope', '$timeout', 'configService', 'groupsService', 'mapService'];
}

function SearchService($http, $rootScope, $timeout, configService, groupsService, mapService) {
   var data = {
      searched: null // Search results
   };
   var summary = {};
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

      get summary() {
         return summary;
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
      var timeout;
      var facets = {
         facet: true,
         "facet.field": "feature"
      };

      map.on('resize moveend viewreset', update);

      function update() {
         $timeout.cancel(timeout);
         if (!data.searched) {
            timeout = $timeout(function () {
               service.filtered();
            }, 200);
            mapListeners.forEach(function (listener) {
               listener();
            });
         }
      }
   });

   // We replace the search parameters like filters with a unique record ID.
   function select(recordId) {
      return createParams().then(function (params) {
         params.q = "recordId:" + recordId;
         return run(params).then(function (response) {
            return service.persist(params, response).then(function () {
               $rootScope.$broadcast('pn.search.complete', response);
               return response;
            });
         });
      });
   }

   function _filtered() {
      createSummary();
      return createParams().then(function (params) {
         return run(params).then(function (response) {
            return service.persist(params, response).then(function () {
               $rootScope.$broadcast('pn.search.complete', response);
               return response;
            });
         });
      });
   }

   function createSummary() {
      return mapService.getMap().then(function (map) {
         return groupsService.getAll().then(function (response) {
            var filterIsObject = _typeof(data.filter) === "object";
            var summary = service.summary;
            summary.filter = filterIsObject ? data.filter.name : data.filter;
            summary.bounds = map.getBounds();
            summary.filterBy = data.filterBy;
            summary.authorities = response.authorities.filter(function (auth) {
               return auth.selected;
            });

            var current = null;
            switch (data.filterBy) {
               case "group":
                  current = response.groups.filter(function (group) {
                     return group.selected;
                  });
                  break;
               case "feature":
                  current = response.features.filter(function (feature) {
                     return feature.selected;
                  });
                  break;
               case "category":
                  current = response.categories.filter(function (category) {
                     return category.selected;
                  });
            }
            summary.current = current;
         });
      });
   }

   function createParams() {
      return mapService.getMap().then(function (map) {
         return groupsService.getAll().then(function (response) {
            var params = baseParameters();
            var filterIsObject = _typeof(data.filter) === "object";
            var q = filterIsObject ? data.filter.name : data.filter;

            params.fq = getBounds(map);
            params["facet.heatmap.geom"] = getHeatmapBounds(map);
            params.sort = getSort(map);
            params.q = q ? '*' + q.toLowerCase() : "*:*";

            var qs = [];
            var qas = [];

            switch (data.filterBy) {
               case "group":
                  response.groups.filter(function (group) {
                     return group.selected;
                  }).forEach(function (group) {
                     qs.push('group:"' + group.name + '"');
                  });
                  break;
               case "feature":
                  response.features.filter(function (feature) {
                     return feature.selected;
                  }).forEach(function (feature) {
                     qs.push('feature:"' + feature.name + '"');
                  });
                  break;
               case "category":
                  response.categories.filter(function (category) {
                     return category.selected;
                  }).forEach(function (category) {
                     qs.push('category:"' + category.name + '"');
                  });
            }

            response.authorities.filter(function (auth) {
               return auth.selected;
            }).forEach(function (auth) {
               qas.push('authority:' + auth.code);
            });

            if (qas.length) {
               params.q += ' AND (' + qas.join(" ") + ')';
            }

            if (qs.length) {
               params.q += ' AND (' + qs.join(" ") + ')';
            }

            return params;
         });
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
         "facet.field": ["feature", "category", "authority"],
         rows: 50,
         wt: "json"
      };
   }

   return service;

   function baseFacetParameters() {
      var params = baseParameters();
      params.rows = 0;
   }
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
   }).filter("placenamesGoogleLink", function () {
      var template = "https://www.google.com/maps/search/?api=1&query=${lat},${lng}";
      return function (what) {
         if (!what) return "";
         var location = what.location.split(" ");

         return template.replace("${lng}", location[0]).replace("${lat}", location[1]);
      };
   }).factory('placenamesUtilsService', ['configService', function (configService) {
      var service = {};

      return service;
   }]);
}
angular.module("placenames.templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("placenames/about/about.html","<span class=\"about\" ng-mouseenter=\"over()\" ng-mouseleave=\"out()\"\r\n      ng-class=\"(about.show || about.ingroup || about.stick) ? \'transitioned-down\' : \'transitioned-up\'\">\r\n   <button class=\"undecorated about-unstick\" ng-click=\"unstick()\" style=\"float:right\">X</button>\r\n   <div class=\"aboutHeading\">About Place Names</div>\r\n   <div ng-repeat=\"item in about.items\">\r\n      <a ng-href=\"{{item.link}}\" name=\"about{{$index}}\" title=\"{{item.heading}}\" target=\"_blank\">\r\n         {{item.heading}}\r\n      </a>\r\n   </div>\r\n</span>");
$templateCache.put("placenames/about/button.html","<button ng-mouseenter=\"over()\" ng-mouseleave=\"out()\"\r\n      ng-click=\"toggleStick()\" tooltip-placement=\"left\" uib-tooltip=\"About Place Names\"\r\n      class=\"btn btn-primary btn-default\">About</button>");
$templateCache.put("placenames/antarctic/antarctic.html","<button type=\"button\" class=\"map-tool-toggle-btn\" ng-click=\"go()\" title=\"Change to Antarctic view\">\r\n   <span>Antarctic View</span>\r\n</button>");
$templateCache.put("placenames/authorities/authorities.html","<div ng-repeat=\"item in authorities\">\r\n   <div class=\"col-md-12 ellipsis\" title=\'Jurisdiction: {{item.jurisdiction}}, Authority name: {{item.name}}\'>\r\n      <input type=\"checkbox\" ng-click=\"update()\" ng-model=\"item.selected\" ng-change=\"change()\">\r\n      <span>\r\n         <a target=\"_blank\" href=\"http://www.google.com/search?q={{item.name}}\">{{item.code}}</a>\r\n         ({{(item.count | number) + (item.count || item.count == 0?\' of \':\'\')}}{{item.total | number}})\r\n      </span>\r\n   </div>\r\n</div>");
$templateCache.put("placenames/categories/categories.html","<div>\r\n   <div ng-repeat=\"category in categories | orderBy: \'name\'\" ng-attr-title=\"{{category.definition}}\">\r\n      <input type=\"checkbox\" ng-model=\"category.selected\" ng-change=\"change()\">\r\n      <span title=\"[Group: {{category.parent.name}}], {{category.definition}}\">{{category.name}} ({{category.total}})</span>\r\n      <button class=\"undecorated\" ng-click=\"category.showChildren = !category.showChildren\">\r\n         <i class=\"fa fa-lg\" ng-class=\"{\'fa-question-circle-o\':!category.showChildren, \'fa-minus-square-o\': category.showChildren}\"></i>\r\n      </button>\r\n      <div ng-show=\"category.showChildren\" style=\"padding-left: 8px; border-bottom: solid 1px lightgray\">\r\n         <div>[Group: {{category.parent.name}}]\r\n         <div ng-if=\"category.definition\">{{category.definition}}</div>\r\n         It includes the following feature types:\r\n         <placenames-category-children features=\"category.features\"></placenames-category-children>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("placenames/categories/features.html","<div>\n   <div ng-repeat=\"feature in features\" style=\"padding-left:10px\" title=\"{{feature.definition}}\">\n      - {{feature.name}} ({{feature.total}})\n   </div>\n</div>");
$templateCache.put("placenames/contributors/contributors.html","<span class=\"contributors\" ng-mouseenter=\"over()\" ng-mouseleave=\"out()\" style=\"z-index:1500\"\r\n      ng-class=\"(contributors.show || contributors.ingroup || contributors.stick) ? \'transitioned-down\' : \'transitioned-up\'\">\r\n   <button class=\"undecorated contributors-unstick\" ng-click=\"unstick()\" style=\"float:right\">X</button>\r\n   <div ng-repeat=\"contributor in contributors.orgs | activeContributors\" style=\"text-align:cnter\">\r\n      <a ng-href=\"{{contributor.href}}\" name=\"contributors{{$index}}\" title=\"{{contributor.title}}\" target=\"_blank\">\r\n         <img ng-src=\"{{contributor.image}}\" alt=\"{{contributor.title}}\" class=\"elvis-logo\" ng-class=\"contributor.class\"></img>\r\n      </a>\r\n   </div>\r\n</span>");
$templateCache.put("placenames/contributors/show.html","<a ng-mouseenter=\"over()\" ng-mouseleave=\"out()\" class=\"contributors-link\" title=\"Click to lock/unlock contributors list.\"\r\n      ng-click=\"toggleStick()\" href=\"#contributors0\">Contributors</a>");
$templateCache.put("placenames/download/download.html","<div class=\"container-fluid\">\r\n   <div class=\"row\">\r\n      <div class=\"col-md-4\">\r\n         <label for=\"geoprocessOutCoordSys\">\r\n            Coordinate System\r\n         </label>\r\n      </div>\r\n      <div class=\"col-md-8\">\r\n         <select style=\"width:95%\" ng-model=\"processing.outCoordSys\" ng-options=\"opt.value for opt in processing.config.outCoordSys | productIntersect : data.bounds\"></select>\r\n      </div>\r\n   </div>\r\n\r\n   <div class=\"row\">\r\n      <div class=\"col-md-4\">\r\n         <label for=\"geoprocessOutputFormat\">\r\n            Output Format\r\n         </label>\r\n      </div>\r\n      <div class=\"col-md-8\">\r\n         <select style=\"width:95%\" ng-model=\"processing.outFormat\" ng-options=\"opt.value for opt in processing.config.outFormat\"></select>\r\n      </div>\r\n   </div>\r\n\r\n   <div class=\"row\">\r\n      <div class=\"col-md-4\">\r\n         <label for=\"geoprocessOutputFormat\">\r\n            File name\r\n         </label>\r\n      </div>\r\n      <div class=\"col-md-8\">\r\n         <input type=\"text\" ng-model=\"processing.filename\" class=\"download-control\" placeholder=\"Optional filename\" title=\"Alphanumeric, hyphen or dash characters, maximium of 16 characters\">\r\n      </div>\r\n   </div>\r\n   <div class=\"row\">\r\n      <div class=\"col-md-4\">\r\n         <label for=\"geoprocessOutputFormat\">\r\n            Email\r\n         </label>\r\n      </div>\r\n      <div class=\"col-md-8\">\r\n         <input required=\"required\" type=\"email\" ng-model=\"processing.email\" class=\"download-control\" placeholder=\"Email address to send download link\">\r\n      </div>\r\n   </div>\r\n\r\n   <div class=\"row\">\r\n      <div class=\"col-md-5\" style=\"padding-top:7px\">\r\n         <div class=\"progress\">\r\n            <div class=\"progress-bar\" role=\"progressbar\" aria-valuenow=\"{{processing.percentComplete}}\" aria-valuemin=\"0\" aria-valuemax=\"100\"\r\n               style=\"width: {{processing.percentComplete}}%;\">\r\n               <span class=\"sr-only\"></span>\r\n            </div>\r\n         </div>\r\n      </div>\r\n      <div class=\"col-md-5\" style=\"padding-top:7px\">\r\n         <span style=\"padding-right:10px\" uib-tooltip=\"Select a valid coordinate system for area.\" tooltip-placement=\"bottom\">\r\n            <i class=\"fa fa-file-video-o fa-2x\" ng-class=\"{\'product-valid\': processing.validProjection, \'product-invalid\': !processing.validProjection}\"></i>\r\n         </span>\r\n         <span style=\"padding-right:10px\" uib-tooltip=\"Select a valid download format.\" tooltip-placement=\"bottom\">\r\n            <i class=\"fa fa-files-o fa-2x\" ng-class=\"{\'product-valid\': processing.validFormat, \'product-invalid\': !processing.validFormat}\"></i>\r\n         </span>\r\n         <span style=\"padding-right:10px\" uib-tooltip=\"Optional custom filename (alphanumeric, max length 8 characters)\" tooltip-placement=\"bottom\">\r\n            <i class=\"fa fa-save fa-2x\" ng-class=\"{\'product-valid\': processing.validFilename, \'product-invalid\': !processing.validFilename}\"></i>\r\n         </span>\r\n         <span style=\"padding-right:10px\" uib-tooltip=\"Provide an email address.\" tooltip-placement=\"bottom\">\r\n            <i class=\"fa fa-envelope fa-2x\" ng-class=\"{\'product-valid\': processing.validEmail, \'product-invalid\': !processing.validEmail}\"></i>\r\n         </span>\r\n      </div>\r\n      <div class=\"col-md-2\">\r\n         <button class=\"btn btn-primary pull-right\" ng-disabled=\"!processing.valid\" ng-click=\"submit()\">Submit</button>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("placenames/extent/extent.html","<div class=\"row\" style=\"border-top: 1px solid gray; padding-top:5px\">\r\n	<div class=\"col-md-5\">\r\n		<div class=\"form-inline\">\r\n			<label>\r\n				<input id=\"extentEnable\" type=\"checkbox\" ng-model=\"parameters.fromMap\" ng-click=\"change()\"></input> \r\n				Restrict area to map\r\n			</label>\r\n		</div>\r\n	</div>\r\n	 \r\n	<div class=\"col-md-7\" ng-show=\"parameters.fromMap\">\r\n		<div class=\"container-fluid\">\r\n			<div class=\"row\">\r\n				<div class=\"col-md-offset-3 col-md-8\">\r\n					<strong>Y Max:</strong> \r\n					<span>{{parameters.yMax | number : 4}}</span> \r\n				</div>\r\n			</div>\r\n			<div class=\"row\">\r\n				<div class=\"col-md-6\">\r\n					<strong>X Min:</strong>\r\n					<span>{{parameters.xMin | number : 4}}</span> \r\n				</div>\r\n				<div class=\"col-md-6\">\r\n					<strong>X Max:</strong>\r\n					<span>{{parameters.xMax | number : 4}}</span> \r\n				</div>\r\n			</div>\r\n			<div class=\"row\">\r\n				<div class=\"col-md-offset-3 col-md-8\">\r\n					<strong>Y Min:</strong>\r\n					<span>{{parameters.yMin | number : 4}}</span> \r\n				</div>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("placenames/features/features.html","<div>\r\n      <div ng-repeat=\"feature in features | orderBy: \'name\'\" title=\"{{feature.definition}}\">\r\n         <input type=\"checkbox\" ng-model=\"feature.selected\" ng-change=\"change()\">\r\n         <span title=\"[Group/category: {{feature.parent.parent.name}}/{{feature.parent.name}}], {{feature.definition}}\">{{feature.name}} ({{feature.total}})</span>\r\n         <button class=\"undecorated\" ng-click=\"feature.showChildren = !feature.showChildren\">\r\n            <i class=\"fa fa-lg\" ng-class=\"{\'fa-question-circle-o\':!feature.showChildren, \'fa-minus-square-o\': feature.showChildren}\"></i>\r\n         </button>\r\n         <div ng-show=\"feature.showChildren\" style=\"padding-left: 8px; border-bottom: solid 1px lightgray\">\r\n            <div ng-if=\"feature.definition\">{{feature.definition}}</div>\r\n            [Group/Category: {{feature.parent.parent.name}}/{{feature.parent.name}}]\r\n         </div>\r\n      </div>\r\n   </div>");
$templateCache.put("placenames/filters/filters.html","<uib-accordion>\r\n   <div uib-accordion-group class=\"panel-default\" is-open=\"status.groupOpen\">\r\n      <uib-accordion-heading>\r\n         Filter by group...\r\n         <i class=\"pull-right glyphicon\" ng-class=\"{\'glyphicon-chevron-down\': status.groupOpen, \'glyphicon-chevron-right\': !status.groupOpen}\"></i>\r\n      </uib-accordion-heading>\r\n      <div style=\"max-height: 300px; overflow-y: auto\">\r\n         <placenames-groups update=\"update()\" ng-show=\"status.groupOpen\"></placenames-groups>\r\n      </div>\r\n   </div>\r\n   <div uib-accordion-group class=\"panel-default\" is-open=\"status.catOpen\">\r\n      <uib-accordion-heading>\r\n         Filter by category...\r\n         <i class=\"pull-right glyphicon\" ng-class=\"{\'glyphicon-chevron-down\': status.catOpen, \'glyphicon-chevron-right\': !status.catOpen}\"></i>\r\n      </uib-accordion-heading>\r\n      <div style=\"max-height: 300px; overflow-y: auto\">\r\n         <placenames-categories update=\"update()\" ng-show=\"status.catOpen\"></placenames-categories>\r\n      </div>\r\n   </div>\r\n   <div uib-accordion-group class=\"panel-default\" is-open=\"status.featureOpen\">\r\n      <uib-accordion-heading>\r\n         Filter by feature...\r\n         <i class=\"pull-right glyphicon\" ng-class=\"{\'glyphicon-chevron-down\': status.featureOpen, \'glyphicon-chevron-right\': !status.featureOopen}\"></i>\r\n      </uib-accordion-heading>\r\n      <div style=\"max-height: 300px; overflow-y: auto\">\r\n         <placenames-features update=\"update()\" ng-show=\"status.featureOpen\"></placenames-features>\r\n      </div>\r\n   </div>\r\n</uib-accordion>\r\n<uib-accordion close-others=\"oneAtATime\">\r\n   <div uib-accordion-group class=\"panel-default\" is-open=\"status.authOpen\">\r\n      <uib-accordion-heading>\r\n         Filter by authority...\r\n         <i class=\"pull-right glyphicon\" ng-class=\"{\'glyphicon-chevron-down\': status.authOpen, \'glyphicon-chevron-right\': !status.authOpen}\"></i>\r\n      </uib-accordion-heading>\r\n      <div style=\"max-height: 300px; overflow-y: auto\">\r\n         <placenames-authorities update=\"update()\" ng-show=\"status.authOpen\"></placenames-authorities>\r\n      </div>\r\n   </div>\r\n</uib-accordion>");
$templateCache.put("placenames/groups/category.html","\r\n<div style=\"padding-left:10px\">\r\n   - <span ng-attr-title=\"{{category.definition}}\">{{category.name}}</span>\r\n   <div ng-repeat=\"feature in category.features | orderBy:\'name\'\" style=\"padding-left:10px\">\r\n      - <span ng-attr-title=\"{{feature.definition}}\">{{feature.name}}</span>\r\n   </div>\r\n</div>\r\n");
$templateCache.put("placenames/groups/groups.html","<div>\r\n   <div ng-repeat=\"group in data.groups\">\r\n      <input type=\"checkbox\" ng-model=\"group.selected\" ng-change=\"change()\"><span title=\"{{group.definition}}\">{{group.name}} ({{group.total | number}})\r\n      <button class=\"undecorated\" ng-click=\"group.showChildren = !group.showChildren\">\r\n         <i class=\"fa fa-lg\" ng-class=\"{\'fa-question-circle-o\':!group.showChildren, \'fa-minus-square-o\': group.showChildren}\"></i>\r\n      </button>\r\n      <div ng-show=\"group.showChildren\" style=\"padding-left:8px\">\r\n         {{group.definition}}<br/><br/>\r\n         This group is made up of the following categories and feature types:\r\n         <div ng-repeat=\"category in group.categories\" style=\"padding-left:8px\">\r\n            <placenames-group-children category=\"category\"></placenames-group-children>\r\n         </div>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("placenames/header/header.html","<div class=\"container-full common-header\" style=\"padding-right:10px; padding-left:10px\">\r\n   <div class=\"navbar-header\">\r\n\r\n      <button type=\"button\" class=\"navbar-toggle\" data-toggle=\"collapse\" data-target=\".ga-header-collapse\">\r\n         <span class=\"sr-only\">Toggle navigation</span>\r\n         <span class=\"icon-bar\"></span>\r\n         <span class=\"icon-bar\"></span>\r\n         <span class=\"icon-bar\"></span>\r\n      </button>\r\n\r\n      <a href=\"/\" class=\"appTitle visible-xs\">\r\n         <h1 style=\"font-size:120%\">{{heading}}</h1>\r\n      </a>\r\n   </div>\r\n   <div class=\"navbar-collapse collapse ga-header-collapse\">\r\n      <ul class=\"nav navbar-nav\">\r\n         <li class=\"hidden-xs\">\r\n            <a href=\"/\">\r\n               <h1 class=\"applicationTitle\">{{heading}}</h1>\r\n            </a>\r\n         </li>\r\n      </ul>\r\n      <ul class=\"nav navbar-nav navbar-right nav-icons\">\r\n         <li role=\"menuitem\" style=\"padding-right:10px;position: relative;top: -3px;\">\r\n            <span class=\"altthemes-container\">\r\n               <span>\r\n                  <a title=\"Location INformation Knowledge platform (LINK)\" href=\"http://fsdf.org.au/\" target=\"_blank\">\r\n                     <img alt=\"FSDF\" src=\"placenames/resources/img/FSDFimagev4.0.png\" style=\"height: 66px\">\r\n                  </a>\r\n               </span>\r\n            </span>\r\n         </li>\r\n         <li placenames-navigation role=\"menuitem\" current=\"current\" style=\"padding-right:10px\"></li>\r\n         <li mars-version-display role=\"menuitem\"></li>\r\n         <li style=\"width:10px\"></li>\r\n      </ul>\r\n   </div>\r\n   <!--/.nav-collapse -->\r\n</div>\r\n<div class=\"contributorsLink\" style=\"position: absolute; right:7px; bottom:15px\">\r\n   <placenames-contributors-link></placenames-contributors-link>\r\n</div>\r\n<!-- Strap -->\r\n<div class=\"row\">\r\n   <div class=\"col-md-12\">\r\n      <div class=\"strap-blue\">\r\n      </div>\r\n      <div class=\"strap-white\">\r\n      </div>\r\n      <div class=\"strap-red\">\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("placenames/maps/maps.html","<div  ng-controller=\"MapsCtrl as maps\">\r\n	<div style=\"position:relative;padding:5px;padding-left:10px;\" >\r\n		<div class=\"panel panel-default\" style=\"padding:5px;\" >\r\n			<div class=\"panel-heading\">\r\n				<h3 class=\"panel-title\">Layers</h3>\r\n			</div>\r\n			<div class=\"panel-body\">\r\n				<div class=\"container-fluid\">\r\n					<div class=\"row\" ng-repeat=\"layer in layersTab.layers\" \r\n							style=\"padding:7px;padding-left:10px;position:relative\" ng-class-even=\"\'even\'\" ng-class-odd=\"\'odd\'\">\r\n						<div style=\"position:relative;left:6px;\">\r\n							<a href=\"{{layer.metadata}}\" target=\"_blank\" \r\n									class=\"featureLink\" title=\'View metadata related to \"{{layer.name}}\". (Opens new window.)\'>\r\n								{{layer.name}}\r\n							</a>\r\n							<div class=\"pull-right\" style=\"width:270px;\" tooltip=\"Show on map. {{layer.help}}\">\r\n								<span style=\"padding-left:10px;width:240px;\" class=\"pull-left\"><explorer-layer-slider layer=\"layer.layer\"></explorer-layer-slider></span>\r\n								<button style=\"padding:2px 8px 2px 2px;\" type=\"button\" class=\"undecorated featureLink pull-right\" href=\"javascript:;\" \r\n										ng-click=\"maps.toggleLayer(layer)\" >\r\n									<i class=\"fa\" ng-class=\"{\'fa-eye-slash\':(!layer.displayed), \'fa-eye active\':layer.displayed}\"></i>\r\n								</button>\r\n							</div>						\r\n						</div>\r\n					</div>\r\n				</div>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("placenames/navigation/altthemes.html","<span class=\"altthemes-container\">\r\n	<span ng-repeat=\"item in themes | altthemesMatchCurrent : current\">\r\n       <a title=\"{{item.label}}\" ng-href=\"{{item.url}}\" class=\"altthemesItemCompact\" target=\"_blank\">\r\n         <span class=\"altthemes-icon\" ng-class=\"item.className\"></span>\r\n       </a>\r\n    </li>\r\n</span>");
$templateCache.put("placenames/panes/panes.html","<div class=\"mapContainer\" class=\"col-md-12\" style=\"padding-right:0\">\r\n   <div class=\"panesMapContainer\" geo-map configuration=\"data.map\"></div>\r\n   <div class=\"base-layer-controller\">\r\n    	<div geo-draw data=\"data.map.drawOptions\" line-event=\"elevation.plot.data\" rectangle-event=\"bounds.drawn\"></div>\r\n   </div>\r\n   <restrict-pan bounds=\"data.map.position.bounds\"></restrict-pan>\r\n</div>");
$templateCache.put("placenames/popover/popover.html","<div class=\"placenames-popover {{direction}}\" ng-class=\"containerClass\" ng-show=\"show\">\r\n  <div class=\"arrow\"></div>\r\n  <div class=\"placenames-popover-inner\" ng-transclude></div>\r\n</div>");
$templateCache.put("placenames/quicksearch/filteredsummary.html","<div>\r\n      <div>\r\n         Matched {{state.persist.data.response.numFound | number}}\r\n      </div>\r\n      <div ng-if=\"summary.current.length\">Filtered by {{summary.filterBy}}: {{summary.current | quicksummary : \"name\" }}</div>\r\n      <div ng-if=\"summary.authorities.length\">For authorities: {{summary.authorities | quicksummary : \"code\"}}</div>\r\n</div>");
$templateCache.put("placenames/quicksearch/quicksearch.html","<div class=\"quickSearch\" placenames-quick-search style=\"opacity:0.9\"></div>\r\n");
$templateCache.put("placenames/reset/reset.html","<button type=\"button\" class=\"map-tool-toggle-btn\" ng-click=\"reset()\" title=\"Reset page\">\r\n   <span class=\"hidden-sm\">Reset</span>\r\n   <i class=\"fa fa-lg fa-refresh\"></i>\r\n</button>");
$templateCache.put("placenames/results/item.html","<div ng-mouseenter=\"vm.enter()\" ng-mouseleave=\"vm.leave()\">\r\n<div class=\"container-fluid\">\r\n   <div class=\"row\">\r\n      <div class=\"col-md-12 pn-header\" >\r\n         <button type=\"button\" class=\"undecorated\" ng-click=\"vm.showPan(vm.item)\"\r\n                tooltip-append-to-body=\"true\" title=\"Zoom to location and mark.\" tooltip-placement=\"left\" uib-tooltip=\"Zoom to location and mark\">\r\n            <i class=\"fa fa-lg fa-flag-o\"></i>\r\n         </button>\r\n         <span><a ng-href=\"{{vm.item | placenamesGoogleLink}}\" target=\"_google\"\r\n            title=\"View in Google maps. While the location will always be correct, Google will do a best guess at matching the Gazetteer name to its data.\">{{vm.item.name}}</a></span>\r\n         <span class=\"pull-right\">Record ID: {{vm.item.authorityId}}</span>\r\n      </div>\r\n   </div>\r\n</div>\r\n<div class=\"container-fluid\">\r\n   <div class=\"row\">\r\n      <div class=\"col-md-4\"  title=\"An authority can be a state department or other statutory authority\">Authority</div>\r\n      <div class=\"col-md-8\">{{vm.item.authority}}</div>\r\n   </div>\r\n   <div class=\"row\">\r\n      <div class=\"col-md-4\" title=\"Features belong to a category and categories belong to a group\">Feature Type</div>\r\n      <div class=\"col-md-8\">{{vm.item.feature}}</div>\r\n   </div>\r\n   <div class=\"row\" title=\"Features belong to a category and categories belong to a group\">\r\n      <div class=\"col-md-4\">Category</div>\r\n      <div class=\"col-md-8\">{{vm.item.category}}</div>\r\n   </div>\r\n   <div class=\"row\" title=\"Features belong to a category and categories belong to a group\">\r\n      <div class=\"col-md-4\">Group</div>\r\n      <div class=\"col-md-8\">{{vm.item.group}}</div>\r\n   </div>\r\n   <div class=\"row\">\r\n      <div class=\"col-md-4\">Supply Date</div>\r\n      <div class=\"col-md-8\" title=\"Date format is dd/mm/yyyy\">{{vm.item.supplyDate | formatDate}}</div>\r\n   </div>\r\n   <div class=\"row\">\r\n      <div class=\"col-md-4\">Lat / Lng</div>\r\n      <div class=\"col-md-8\">\r\n         <span class=\"pn-numeric\">\r\n            {{vm.item.location | itemLatitude}}&deg; / {{vm.item.location | itemLongitude}}&deg;\r\n         </span>\r\n      </div>\r\n   </div>\r\n\r\n</div>");
$templateCache.put("placenames/results/results.html","<div class=\"panel panel-default pn-container\" ng-if=\"pr.data.searched\" common-scroller buffer=\"200\" more=\"pr.more()\">\r\n   <div class=\"panel-heading\" style=\"min-height:25px\">\r\n      <span ng-if=\"pr.data.searched.item\">\r\n         Showing selected feature\r\n      </span>\r\n      <span ng-if=\"!pr.data.searched.item\">\r\n         Matched {{pr.data.searched.data.response.numFound | number}} features<span ng-if=\"!pr.data.searched.item && pr.data.searched.data.response.numFound > pr.data.searched.data.response.docs.length\">, showing {{pr.data.searched.data.response.docs.length\r\n         | number}}</span>\r\n         <a href \"javascript:void()\" ng-if=\"!pr.data.searched.item && pr.data.searched.data.response.numFound > pr.data.searched.data.response.docs.length\" ng-click=\"pr.more()\" tooltip-placement=\"bottom\" uib-tooltip=\"Scroll to the bottom of results or click here to load more matching features\">\r\n            [Load more]\r\n         </a>\r\n      </span>\r\n      <span class=\"pull-right\">\r\n         <a href \"javascript:void()\" ng-if=\"!pr.data.searched.item\" ng-click=\"pr.showDownload = !pr.showDownload\" tooltip-placement=\"bottom\"\r\n            uib-tooltip=\"Package up for download all your search results...\">\r\n            [\r\n            <span ng-if=\"!pr.showDownload\">Download...</span>\r\n            <span ng-if=\"pr.showDownload\">Hide download details</span>]\r\n         </a>\r\n         <a href \"javascript:void()\" ng-if=\"!pr.data.searched.item\" ng-click=\"pr.clear()\" tooltip-placement=\"bottom\" uib-tooltip=\"Clear search results and search again\">\r\n            [Clear results]\r\n         </a>\r\n      </span>\r\n      <placenames-search-filters ng-if=\"pr.data.searched\"></placenames-search-filters>\r\n   </div>\r\n   <div class=\"panel-heading\">\r\n      <placenames-results-item ng-if=\"pr.data.searched.item\" item=\"pr.data.searched.item\"></placenames-results-item>\r\n      <placenames-results-download data=\"pr.data.searched\" ng-if=\"!pr.data.searched.item && pr.showDownload\"></placenames-results-download>\r\n      <div class=\"pn-results-list\" ng-if=\"!pr.data.searched.item\" ng-repeat=\"doc in pr.data.searched.data.response.docs\">\r\n         <placenames-results-item item=\"doc\"></placenames-results-item>\r\n      </div>\r\n   </div>\r\n</div>\r\n<div class=\"panel panel-default pn-container\" ng-if=\"!pr.data.searched\">\r\n   <div class=\"panel-heading\" style=\"min-height:25px\">\r\n      <span>\r\n         No search results to show. Please conduct a search.\r\n      </span>\r\n   </div>\r\n</div>");
$templateCache.put("placenames/results/summary.html","<span class=\"placenamesSearchSummary\"\r\n      ng-if=\"state.searched.data.response.numFound\">(Found {{state.searched.data.response.numFound | number}} features)</span>");
$templateCache.put("placenames/search/quicksearch.html","<div class=\"search-text\">\r\n   <div class=\"input-group input-group-sm\">\r\n      <input type=\"text\" ng-model=\"state.filter\" placeholder=\"Match by feature name...\" ng-model-options=\"{ debounce: 300}\" typeahead-on-select=\"select($item, $model, $label)\"\r\n         ng-disabled=\"state.searched\" typeahead-template-url=\"placenames/search/typeahead.html\" class=\"form-control\" typeahead-min-length=\"0\"\r\n         uib-typeahead=\"doc as doc.name for doc in loadDocs(state.filter)\" typeahead-loading=\"loadingLocations\" typeahead-no-results=\"noResults\"\r\n         placenames-clear>\r\n\r\n      <span class=\"input-group-btn\">\r\n         <button class=\"btn btn-primary\" type=\"button\" ng-click=\"search()\" ng-hide=\"state.searched\">Search</button>\r\n         <button class=\"btn btn-primary\" type=\"button\" ng-click=\"showFilters = !showFilters\" ng-hide=\"state.searched\" title=\"SHow/hide filters such as authority, group, category and feature type\">Filters...</button>\r\n         <button class=\"btn btn-primary\" type=\"button\" ng-click=\"clear()\" ng-show=\"state.searched\">Clear Search Results</button>\r\n      </span>\r\n   </div>\r\n</div>\r\n<div class=\"filters\" ng-show=\"showFilters\" style=\"background-color: white; opacity:0.9\">\r\n   <placenames-filters status=\"status\"></placenames-filters>\r\n</div>");
$templateCache.put("placenames/search/search.html","<placenames-results data=\"state\"></placenames-results>\r\n");
$templateCache.put("placenames/search/searchfilters.html","<div style=\"padding-top:5px; padding-bottom:5px\">\r\n   <span ng-if=\"data.filter\">Matching names like \"{{data.filter}}\"</span>\r\n   <span ng-if=\"summary.current.length\">Filtered by {{summary.filterBy}}: {{summary.current | quicksummary : \"name\" }}</span>\r\n   <span ng-if=\"summary.authorities.length\">For authorities: {{summary.authorities | quicksummary : \"code\"}}</span>\r\n</div>");
$templateCache.put("placenames/search/typeahead.html","<a placenames-options ng-mouseenter=\"enter()\" ng-mouseleave=\"leave()\"  tooltip-append-to-body=\"true\"\r\n               tooltip-placement=\"bottom\" uib-tooltip-html=\"match.model | placenamesTooltip\">\r\n   <span ng-bind-html=\"match.model.name | uibTypeaheadHighlight:query\"></span>\r\n   (<span ng-bind-html=\"match.model.authorityId\"></span>)\r\n</a>");
$templateCache.put("placenames/side-panel/side-panel-left.html","<div class=\"cbp-spmenu cbp-spmenu-vertical cbp-spmenu-left\" style=\"width: {{left.width}}px;\" ng-class=\"{\'cbp-spmenu-open\': left.active}\">\r\n    <a href=\"\" title=\"Close panel\" ng-click=\"closeLeft()\" style=\"z-index: 1200\">\r\n        <span class=\"glyphicon glyphicon-chevron-left pull-right\"></span>\r\n    </a>\r\n    <div ng-show=\"left.active === \'legend\'\" class=\"left-side-menu-container\">\r\n        <legend url=\"\'img/AustralianTopogaphyLegend.png\'\" title=\"\'Map Legend\'\"></legend>\r\n    </div>\r\n</div>");
$templateCache.put("placenames/side-panel/side-panel-right.html","<div class=\"cbp-spmenu cbp-spmenu-vertical cbp-spmenu-right noPrint\" ng-attr-style=\"width:{{right.width}}\" ng-class=\"{\'cbp-spmenu-open\': right.active}\">\r\n    <a href=\"\" title=\"Close panel\" ng-click=\"closePanel()\" style=\"z-index: 1200\">\r\n        <span class=\"glyphicon glyphicon-chevron-right pull-left\"></span>\r\n    </a>\r\n    <div ng-show=\"right.active === \'search\'\" class=\"right-side-menu-container\">\r\n        <div class=\"panesTabContentItem\" placenames-search ></div>\r\n    </div>\r\n    <div ng-if=\"right.active === \'glossary\'\" class=\"right-side-menu-container\">\r\n        <div class=\"panesTabContentItem\" placenames-glossary></div>\r\n    </div>\r\n    <div ng-show=\"right.active === \'help\'\" class=\"right-side-menu-container\">\r\n        <div class=\"panesTabContentItem\" placenames-help></div>\r\n    </div>\r\n</div>\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n");
$templateCache.put("placenames/side-panel/trigger.html","<button ng-click=\"toggle()\" type=\"button\" class=\"map-tool-toggle-btn\">\r\n   <span class=\"hidden-sm\">{{name}}</span>\r\n   <ng-transclude></ng-transclude>\r\n   <i class=\"fa fa-lg\" ng-class=\"iconClass\"></i>\r\n</button>");
$templateCache.put("placenames/splash/splash.html","<div class=\"modal-header\">\r\n   <h3 class=\"modal-title splash\">Place Names</h3>\r\n</div>\r\n<div class=\"modal-body\" id=\"accept\" ng-form exp-enter=\"accept()\" placenames-splash-modal style=\"width: 100%; margin-left: auto; margin-right: auto;\">\r\n	<div style=\"border-bottom:1px solid gray\">\r\n		<p>\r\n			Users can download the place names data which is licensed under Creative Commons.\r\n		</p>\r\n		<p>\r\n			Data can be downloaded from the portal at <strong>no charge</strong> and there is no limit to how many requests you can place (please check the file size before you download your results).\r\n		</p>\r\n		<p>\r\n			If you need datasets in full, please contact <a href=\"clientservices@ga.gov.au\">clientservices@ga.gov.au</a>.\r\n		</p>\r\n		<p>\r\n			<a href=\"http://opentopo.sdsc.edu/gridsphere/gridsphere?cid=contributeframeportlet&gs_action=listTools\" target=\"_blank\">Click here for Free GIS Tools.</a>\r\n		</p>\r\n\r\n		<div style=\"padding:30px; padding-top:0; padding-bottom:40px; width:100%\">\r\n			<div class=\"pull-right\">\r\n			  	<button type=\"button\" class=\"btn btn-primary\" ng-model=\"seenSplash\" ng-focus ng-click=\"accept()\">Continue</button>\r\n			</div>\r\n		</div>\r\n	</div>\r\n	<div ng-show=\"messages.length > 0\" class=\"container\" style=\"width:100%; max-height:250px; overflow-y:auto\">\r\n		<div class=\"row\" ng-class-even=\"\'grayline\'\" style=\"font-weight:bold\">\r\n			<div class=\"col-sm-12\" ><h3>News</h3></div>\r\n		</div>\r\n\r\n		<div class=\"row\"ng-class-even=\"\'grayline\'\" style=\"max-height:400px;overflow:auto\" ng-repeat=\"message in messages | sortNotes\">\r\n			<div class=\"col-sm-12\">\r\n				<h4>{{message.title}} <span class=\"pull-right\" style=\"font-size:70%\">Created: {{message.creationDate | date : \"dd/MM/yyyy\"}}</span></h4>\r\n				<div ng-bind-html=\"message.description\"></div>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("placenames/toolbar/toolbar.html","<div class=\"placenames-toolbar noPrint\">\r\n    <div class=\"toolBarContainer\">\r\n        <div>\r\n            <ul class=\"left-toolbar-items\">\r\n               <li>\r\n                  <antarctic-view></antarctic-view>\r\n               </li>\r\n            </ul>\r\n            <ul class=\"right-toolbar-items\">\r\n                <li>\r\n                    <panel-trigger panel-id=\"search\" panel-width=\"540px\" name=\"Search Results\" icon-class=\"fa-list\">\r\n                        <placenames-results-summary state=\"state\"></placenames-results-summary>\r\n                    </panel-trigger>\r\n                </li>\r\n                <li reset-page></li>\r\n            </ul>\r\n        </div>\r\n    </div>\r\n</div>");
$templateCache.put("placenames/themes/themes.html","<div class=\"dropdown themesdropdown\">\r\n   <button class=\"btn btn-default dropdown-toggle themescurrent\" type=\"button\" id=\"dropdownMenu1\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">\r\n     Theme\r\n     <span class=\"caret\"></span>\r\n   </button>\r\n   <ul class=\"dropdown-menu\" aria-labelledby=\"dropdownMenu1\">\r\n     <li ng-repeat=\"item in themes\">\r\n        <a href=\"#\" title=\"{{item.title}}\" ng-href=\"{{item.url}}\" class=\"themesItemCompact\">\r\n          <span class=\"icsm-icon\" ng-class=\"item.className\"></span>\r\n          <strong style=\"vertical-align:top;font-size:110%\">{{item.label}}</strong>\r\n        </a>\r\n     </li>\r\n   </ul>\r\n </div>");}]);