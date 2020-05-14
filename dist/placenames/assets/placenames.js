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
      templateUrl: "/authorities/authorities.html",
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
  angular.module("placenames.categories", []).directive("placenamesCategories", ['groupsService', "searchService", function (groupsService, searchService) {
    return {
      templateUrl: "/categories/categories.html",
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
      templateUrl: "/categories/features.html",
      scope: {
        features: "="
      }
    };
  }]);
}
"use strict";

var declusteredIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.2.0/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.2.0/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.2.0/dist/images/marker-shadow.png',
  iconSize: [16, 25],
  iconAnchor: [7, 26],
  popupAnchor: [1, -22],
  tooltipAnchor: [10, -18],
  shadowSize: [25, 25]
});
"use strict";

{
  angular.module('placenames.contributors', []).directive("placenamesContributors", ["$interval", "contributorsService", function ($interval, contributorsService) {
    return {
      templateUrl: "/contributors/contributors.html",
      scope: {},
      link: function link(scope, element) {
        var timer;
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
      templateUrl: "/contributors/show.html",
      scope: {},
      link: function link(scope) {
        var timer;
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
  angular.module("placenames.download", ['placenames.zone']).directive("placenamesDownload", ["flashService", "messageService", "placenamesDownloadService", "zoneService", function (flashService, messageService, placenamesDownloadService, zoneService) {
    return {
      templateUrl: "/download/download.html",
      scope: {
        data: "="
      },
      link: function link(scope) {
        scope.processing = placenamesDownloadService.data; // Gets the counts per zone but they can be a bit iffy so we use them for a guide only

        zoneService.counts(scope.data).then(function (results) {
          scope.outCoordSys = results;
        });
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
          })["catch"](function () {
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
        dataFields: "common",

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
          data_fields: this.data.dataFields,
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
            yMin = _item$extent.yMin,
            response;

        try {
          response = extent.intersects([[yMin, xMin], [yMax, xMax]]);
        } catch (e) {
          console.error("Couldn't test for intersects", e);
          return false;
        }

        return response;
      });
    };
  });
}
"use strict";

{
  angular.module("placenames.feature", []).directive("placenamesFeatures", ['groupsService', "searchService", function (groupsService, searchService) {
    return {
      templateUrl: "/features/features.html",
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
  angular.module('placenames.feedback', []).directive('feedback', ['$window', 'configService', function ($window, configService) {
    return {
      restrict: 'AE',
      templateUrl: '/feedback/feedback.html',
      link: function link($scope) {
        $scope.open = function () {
          configService.getConfig("feedbackUrl").then(function (url) {
            $window.open(url, "_blank");
          });
        };
      }
    };
  }]);
}
"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

{
  var Group = /*#__PURE__*/function () {
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

  var Category = /*#__PURE__*/function () {
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

  var Feature = /*#__PURE__*/function () {
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
      templateUrl: "/groups/groups.html",
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
      templateUrl: "/groups/category.html",
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
            }); // After thought: Why bother with any that have zero counts? Filter them out now.

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
          var lastElement;
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
"use strict";

{
  angular.module("placenames.tree", []).directive("placenamesTree", ["groupsService", "searchService", function (groupsService, searchService) {
    return {
      templateUrl: "/filters/tree.html",
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

{
  angular.module('placenames.header', []).controller('headerController', ['$scope', '$q', '$timeout', function ($scope, $q, $timeout) {
    var modifyConfigSource = function modifyConfigSource(headerConfig) {
      return headerConfig;
    };

    $scope.$on('headerUpdated', function (event, args) {
      $scope.headerConfig = modifyConfigSource(args);
    });
  }]).directive('placenamesBeta', [function () {
    return {
      transclude: true,
      restrict: "EA",
      templateUrl: "/header/beta.html"
    };
  }]).directive('placenamesHeader', [function () {
    var defaults = {
      current: "none",
      heading: "ICSM",
      subheading: "ICSM",
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
      templateUrl: "/header/header.html",
      scope: {
        current: "=",
        breadcrumbs: "=",
        heading: "=",
        subheading: "=",
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
"use strict";

{
  angular.module("placenames.help", []).directive("placenamesHelp", [function () {
    return {
      templateUrl: "/help/help.html"
    };
  }]).directive("placenamesFaqs", [function () {
    return {
      restrict: "AE",
      templateUrl: "/help/faqs.html",
      scope: {
        faqs: "="
      },
      link: function link(scope) {
        scope.focus = function (key) {
          $("#faqs_" + key).focus();
        };
      }
    };
  }]).controller("HelpCtrl", HelpCtrl).factory("helpService", HelpService);
  HelpCtrl.$inject = ['$log', 'helpService'];
}

function HelpCtrl($log, helpService) {
  var self = this;
  $log.info("HelpCtrl");
  helpService.getFaqs().then(function (faqs) {
    self.faqs = faqs;
  });
}

HelpService.$inject = ['$http'];

function HelpService($http) {
  var FAQS_SERVICE = "placenames/resources/config/faqs.json";
  return {
    getFaqs: function getFaqs() {
      return $http.get(FAQS_SERVICE, {
        cache: true
      }).then(function (response) {
        return response.data;
      });
    }
  };
}
"use strict";

{
  angular.module("placenames.lock", []).directive("placenamesLock", [function () {
    return {
      scope: {
        hover: "="
      },
      template: '<i class="fa fa-lock" aria-hidden="true" title="The features shown on the map are locked to the current search results. Clear your search results to show more features"></i>'
    };
  }]);
}
"use strict";

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
      templateUrl: '/navigation/altthemes.html',
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
      var response = []; // Give 'em all if they haven't set a theme.

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

      $http.get(THEMES_LOCATION, {
        cache: true
      }).then(function (response) {
        var themes = response.data.themes;
        self.themes = themes;
        self.theme = themes[value]; // Decorate the key

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
      return $http.get(THEMES_LOCATION, {
        cache: true
      }).then(function (response) {
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
"use strict";

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
  angular.module("placenames.pill", []).directive('placenamesPill', ['searchService', function (searchService) {
    return {
      restrict: 'EA',
      templateUrl: "/pill/pill.html",
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
  angular.module("placenames.quicksearch", ['placenames.pill']).directive('placenamesQuicksearch', [function () {
    return {
      link: function link(scope) {},
      templateUrl: "/quicksearch/quicksearch.html"
    };
  }]).directive('placenamesFilteredSummary', ["searchService", function (searchService) {
    return {
      scope: {
        state: "="
      },
      templateUrl: "/quicksearch/filteredsummary.html",
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
"use strict";

{
  angular.module('placenames.reset', []).directive('resetPage', function ($window) {
    return {
      restrict: 'AE',
      scope: {},
      templateUrl: '/reset/reset.html',
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

  angular.module("placenames.results.item", []).directive("placenamesResultsItem", ['placenamesItemService', 'placenamesResultsService', 'searchService', function (placenamesItemService, placenamesResultsService, searchService) {
    return {
      templateUrl: "/results/item.html",
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
  }]).factory('placenamesItemService', ['$http', 'configService', function ($http, configService) {
    var service = {
      wfs: function wfs(vm) {
        configService.getConfig("results").then(function (_ref) {
          var wfsTemplate = _ref.wfsTemplate;
          $http.get(wfsTemplate.replace("${id}", vm.item.recordId)).then(function (response) {
            var blob = new Blob([response.data], {
              type: "application/json;charset=utf-8"
            });
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
"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

{
  angular.module("placenames.results", ['placenames.results.item', 'placenames.scroll', 'placenames.download']).directive("placenamesZoomToAll", ['mapService', function (mapService) {
    return {
      template: '<button type="button" class="map-tool-toggle-btn" ng-click="zoomToAll()" title="{{text}}">' + '<span class="hidden-sm">{{text}}</span> ' + '<i class="fa fa-lg {{icon}}"></i>' + '</button>',
      scope: {
        center: "=",
        zoom: "=",
        bounds: "=",
        text: "@",
        icon: "@"
      },
      link: function link(scope) {
        scope.zoomToAll = function () {
          mapService.getMap().then(function (map) {
            if (scope.center && scope.zoom) {
              map.setView(scope.center, scope.zoom);
            } else {
              map.fitBounds(scope.bounds);
            }
          });
        };
      }
    };
  }]).directive("placenamesResultsSummary", [function () {
    return {
      templateUrl: "/results/summary.html",
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
      templateUrl: '/results/results.html',
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
  ResultsService.$inject = ['proxy', '$http', '$rootScope', '$timeout', 'configService', 'mapService', 'searchService'];
}

function ResultsService(proxy, $http, $rootScope, $timeout, configService, mapService, searchService) {
  var ZOOM_IN = 13;
  var marker;
  var service = {
    showPan: function showPan(what) {
      return this.show(what).then(function (details) {
        var map = details.map;
        var currentZoom = map.getZoom();
        map.setView(details.location, ZOOM_IN > currentZoom ? ZOOM_IN : currentZoom, {
          animate: true
        });
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
        }); // split lng/lat string seperated by space, reverse to lat/lng, cooerce to numbers

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
          var blob = new Blob([JSON.stringify(data, null, 3)], {
            type: "application/json;charset=utf-8"
          });
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
      searchService.request(params).then(function (data) {
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
"use strict";

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
  }]).directive('placenamesOnEnter', function () {
    return function (scope, element, attrs) {
      element.bind("keydown keypress", function (event) {
        if (event.which === 13) {
          scope.$apply(function () {
            scope.$eval(attrs.placenamesOnEnter);
          });
          event.preventDefault();
        }
      });
    };
  }).directive('placenamesSearchFilters', ["searchService", function (searchService) {
    var groupMatch = {
      group: "groups",
      category: "categories",
      feature: "features"
    };
    return {
      templateUrl: "/search/searchfilters.html",
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
  }]).directive("placenamesQuickSearch", ['$document', '$rootScope', '$timeout', 'groupsService', 'searchService', function ($document, $rootScope, $timeout, groupsService, searchService) {
    return {
      templateUrl: '/search/quicksearch.html',
      restrict: 'AE',
      link: function link(scope, element) {
        scope.state = searchService.data;

        scope.erase = function () {
          scope.state.filter = "";
          searchService.filtered();
        };

        $document.on('keyup', function keyupHandler(keyEvent) {
          if (keyEvent.which === 27) {
            keyEvent.stopPropagation();
            keyEvent.preventDefault();
            scope.$apply(function () {
              scope.showFilters = false;
            });
          }
        });

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

        scope.select = function (item) {
          scope.search(item);
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
      templateUrl: '/search/search.html',
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
"use strict";

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
      templateUrl: '/side-panel/side-panel-right.html',
      link: function link(scope) {
        scope.right = panelSideFactory.state.right;

        scope.closePanel = function () {
          panelSideFactory.setRight({
            name: null,
            width: 0
          });
        };
      }
    };
  }]).directive('panelTrigger', ["panelSideFactory", function (panelSideFactory) {
    return {
      restrict: 'E',
      transclude: true,
      templateUrl: '/side-panel/trigger.html',
      scope: {
        "default": "@?",
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

        if (scope["default"]) {
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

          if (state && (!state.active || scope.panelId !== state.active)) {
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
      templateUrl: '/side-panel/side-panel-left.html',
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
          } catch (e) {// Do nothing as it will be a string
          }
        }

        return $q.when(item);
      }
    };
  }]);
}
"use strict";

{
  angular.module('placenames.specification', []).directive('productSpecification', ['$window', 'configService', function ($window, configService) {
    return {
      restrict: 'AE',
      templateUrl: '/specification/specification.html',
      link: function link($scope) {
        $scope.openSpec = function () {
          configService.getConfig("dataSpecificationUrl").then(function (url) {
            $window.open(url, "_blank");
          });
        };
      }
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
            map.panInsideBounds(restrict, {
              animate: false
            });
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
  }).filter("placenamesGoogleLink", ['configService', function (configService) {
    var template = "https://www.google.com/maps/search/?api=1&query=${lat},${lng}";
    return function (what) {
      if (!what) return "";
      var location = what.location.split(" ");
      return template.replace("${lng}", location[0]).replace("${lat}", location[1]);
    };
  }]).directive("placenamesGoogleAnchor", ['configService', function (configService) {
    var template = "https://www.google.com/maps/search/?api=1&query=${lat},${lng}";
    return {
      scope: {
        linkTitle: "@",
        item: "="
      },
      template: '<span ng-if="hide">{{item.name}}</span>' + '<a ng-if="!hide" ng-href="{{item | placenamesGoogleLink}}" target="_google" title="{{linkTitle}}">{{item.name}}</a>',
      link: function link(scope) {
        configService.getConfig("hideGoogleLink").then(function (val) {
          scope.hide = !!val;
        });
      }
    };
  }]).factory('placenamesUtilsService', ['configService', function (configService) {
    var service = {};
    return service;
  }]);
}
"use strict";

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
"use strict";

{
  AboutService.$inject = ["configService"];
  angular.module('placenames.about', []).directive("placenamesAbout", ["$interval", "aboutService", function ($interval, aboutService) {
    return {
      templateUrl: "/about/about.html",
      scope: {},
      link: function link(scope, element) {
        var timer;
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
      templateUrl: "/about/button.html",
      scope: {},
      link: function link(scope) {
        var timer;
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
"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var SolrTransformer = /*#__PURE__*/function () {
  function SolrTransformer(data) {
    var _this = this;

    _classCallCheck(this, SolrTransformer);

    if (data) {
      var response = {};
      var lastField = null;

      if (Array.isArray(data)) {
        data.forEach(function (element, idx) {
          if (idx % 2) {
            response[lastField] = element;
          } else {
            lastField = element;
          }
        });
      } else {
        // Newer versions of Solr do it properly
        response = data;
      }

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
  }]).factory("placenamesClusterService", ["$http", "$rootScope", "configService", "flashService", "mapService", function ($http, $rootScope, configService, flashService, mapService) {
    var HIGHWATER_MARK = 40000;
    var MIDWATER_MARK = 600;
    var LOWWATER_MARK = 50;
    var service = {
      sequence: 0,
      layer: null,
      timeout: null
    };

    service.init = function () {
      var _this2 = this;

      configService.getConfig("clusters").then(function (config) {
        mapService.getMap().then(function (map) {
          _this2.map = map;
          _this2.config = config;
          var self = _this2;
          $rootScope.$on('pn.search.complete', movePan);
          $rootScope.$on('pn.search.start', hideClusters);

          function hideClusters() {
            if (self.layer) {
              self.flasher = flashService.add("Loading features", null, true);
              self.map.removeLayer(self.layer);
              self.layer = null;
            }
          }

          function movePan(event, data) {
            if (service.timeout) {
              clearTimeout(service.timeout);
            }

            service.timeout = setTimeout(function () {
              self._refreshClusters(data);
            }, 10);
          }
        });
      });
    };

    service._refreshClusters = function (response) {
      if (response.restrict && response.response.numFound > MIDWATER_MARK) {
        clearTimeout(service.debounce);
        service.debounce = setTimeout(function () {
          var params = Object.assign({}, response.responseHeader.params, {
            rows: MIDWATER_MARK,
            fq: getBounds(map.getBounds(), response.restrict)
          });
          return $http({
            url: "/select?",
            params: params,
            method: "get"
          }).then(function (result) {
            service._refreshClusters2(result.data);
          });
        }, 200);
      } else {
        return service._refreshClusters2(response);
      }
    };

    service._refreshClusters2 = function (response) {
      var _this3 = this;

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
        zoomToBoundsOnClick: true,
        singleMarkerMode: true,
        animate: false
      }; // We use this to know when to bail out on slow service calls

      service.sequence++;
      var mySequence = service.sequence;
      var count = response.response.numFound;

      if (this.layer) {
        this.map.removeLayer(this.layer);
      }

      if (count > HIGHWATER_MARK) {
        options.iconCreateFunction = function (cluster) {
          var childCount = cluster.getAllChildMarkers().reduce(function (sum, value) {
            return sum + value.options.count;
          }, 0);
          var c = ' marker-cluster-';

          if (childCount < 1000) {
            c += 'small';
          } else if (childCount < 5000) {
            c += 'medium';
          } else {
            c += 'large';
          }

          return new L.DivIcon({
            html: '<div><span>' + Number(childCount).toLocaleString() + '</span></div>',
            className: 'marker-cluster' + c,
            iconSize: new L.Point(40, 40)
          });
        };

        this.layer = L.markerClusterGroup(options);
        var data = response.facet_counts.facet_heatmaps[this.config.countField];
        var worker = new SolrTransformer(data);
        var result = worker.getGeoJson();
        var maxCount = Math.max.apply(Math, _toConsumableArray(result.features.map(function (item) {
          return item.properties.count;
        })));
        worker.cells.forEach(function (cell) {
          var count = cell.properties.count;
          var x = cell.geometry.coordinates[1];
          var y = cell.geometry.coordinates[0];
          var xy = [x, y];
          var marker = L.marker(xy, {
            count: count
          });

          _this3.layer.addLayer(marker);
        });

        if (this.flasher) {
          this.flasher.remove();
        }

        this.layer.addTo(this.map);
      } else if (count > MIDWATER_MARK) {
        options.iconCreateFunction = function (cluster) {
          var childCount = cluster.getChildCount();
          var c = ' marker-cluster-';

          if (childCount < 10) {
            c += 'small';
          } else if (childCount < 100) {
            c += 'medium';
          } else {
            c += 'large';
          }

          return new L.DivIcon({
            html: '<div><span>' + Number(childCount).toLocaleString() + '</span></div>',
            className: 'marker-cluster' + c,
            iconSize: new L.Point(40, 40)
          });
        };

        this.layer = L.markerClusterGroup(options);
        var _data = response.facet_counts.facet_heatmaps[this.config.countField];

        var _worker = new SolrTransformer(_data);

        var _result = _worker.getGeoJson();

        var _maxCount = Math.max.apply(Math, _toConsumableArray(_result.features.map(function (item) {
          return item.properties.count;
        })));

        _worker.cells.forEach(function (cell) {
          var count = cell.properties.count;
          var x = cell.geometry.coordinates[1];
          var y = cell.geometry.coordinates[0];
          var xy = [x, y];

          for (var i = 0; i < count; i++) {
            _this3.layer.addLayer(L.marker(xy));
          }
        });

        if (this.flasher) {
          this.flasher.remove();
        }

        this.layer.addTo(this.map);
      } else {
        var params = {
          q: response.responseHeader.params.q,
          sort: response.responseHeader.params.sort,
          rows: count,
          fq: getBounds(map.getBounds(), response.restrict),
          wt: "json"
        };
        $http({
          url: "/select?",
          params: params,
          method: "get"
        }).then(function (result) {
          if (mySequence !== service.sequence) {
            console.log("Bailing out as another post has started since this one started");
            return;
          }

          var layer = _this3.layer = L.layerGroup();
          var docs = result.data.response.docs;
          docs.forEach(function (doc) {
            var popup = ["<table class='cluster-table'>"];
            var coords = doc.location.split(" ");
            var date = new Date(doc.supplyDate);
            var dateStr = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
            var wasclicked = false;
            popup.push("<tr><th>Name </th><td>" + doc.name + "</td></tr>");
            popup.push("<tr><th>Feature type </th><td>" + doc.feature + "</td></tr>");
            popup.push("<tr><th>Category </th><td>" + doc.category + "</td></tr>");
            popup.push("<tr><th>Authority </th><td>" + doc.authority + "</td></tr>");
            popup.push("<tr><th>Supply date</th><td>" + dateStr + "</td></tr>");
            popup.push("<tr><th>Lat / Lng</th><td>" + coords[1] + "° / " + coords[0] + "°</td></tr>");
            doc.icon = declusteredIcon;
            var marker;

            if (docs.length > LOWWATER_MARK) {
              marker = L.marker([+coords[1], +coords[0]], doc);
            } else {
              doc.radius = 2;
              marker = L.circleMarker([+coords[1], +coords[0]], doc);
              layer.addLayer(marker);
              marker = L.marker([+coords[1], +coords[0]], {
                icon: L.divIcon({
                  html: "<div class='cluster-icon'><div class='ellipsis'>" + doc.name + "</div></div>"
                })
              });
            }

            popup.push("</table>");
            marker.bindPopup(popup.join(""));
            marker.on("mouseover", function () {
              this.openPopup();
            });
            marker.on('mouseout', function (e) {
              if (!wasclicked) {
                this.closePopup();
              }
            });
            marker.on('click', function (e) {
              wasclicked = true;
              this.openPopup();
            });
            marker.on('popupclose', function (e) {
              wasclicked = false;
            });
            layer.addLayer(marker);
          });

          try {
            layer.addTo(_this3.map);
          } catch (e) {
            console.log("What the ");
          } finally {
            if (_this3.flasher) {
              _this3.flasher.remove();
            }
          }
        });
      }
    };

    return service;
  }]);
}
"use strict";

{
  angular.module('placenames.antarctic', []).directive('antarcticView', function () {
    return {
      restrict: 'AE',
      scope: {},
      templateUrl: '/antarctic/antarctic.html',
      controller: ['$scope', function ($scope) {
        $scope.go = function () {
          window.location = "antarctic.html";
        };
      }]
    };
  });
}
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

{
  var RootCtrl = function RootCtrl(configService, mapService) {
    var _this = this;

    _classCallCheck(this, RootCtrl);

    mapService.getMap().then(function (map) {
      // TODO: Remove this hack when we rewrite the map library.
      map.fitBounds([[-9.622414142924805, 196.61132812500003], [-55.57834467218206, 67.06054687500001]]);
      _this.map = map;
    });
    configService.getConfig().then(function (data) {
      _this.data = data;
    });
  };

  RootCtrl.$invoke = ['configService', 'mapService'];
  angular.module("PlacenamesApp", ['placenames.templates', 'explorer.config', 'explorer.confirm', 'explorer.enter', 'explorer.flasher', 'explorer.googleanalytics', 'explorer.info', 'explorer.message', 'explorer.modal', 'explorer.persist', 'explorer.version', 'exp.ui.templates', 'explorer.map.templates', 'ui.bootstrap', 'ngAutocomplete', 'ngSanitize', 'page.footer', 'geo.map', 'geo.maphelper', 'placenames.about', 'placenames.antarctic', 'placenames.clusters', 'placenames.download', 'placenames.extent', 'placenames.feedback', 'placenames.header', 'placenames.help', 'placenames.lock', 'placenames.maps', 'placenames.navigation', 'placenames.panes', 'placenames.popover', 'placenames.proxy', 'placenames.quicksearch', 'placenames.reset', "placenames.search", "placenames.searched", "placenames.search.service", "placenames.side-panel", 'placenames.specification', 'placenames.toolbar', 'placenames.tree', 'placenames.utils']).run(function ($templateCache) {
    console.log("Running");
  }) // Set up all the service providers here.
  .config(['configServiceProvider', 'persistServiceProvider', 'projectsServiceProvider', 'versionServiceProvider', function (configServiceProvider, persistServiceProvider, projectsServiceProvider, versionServiceProvider) {
    configServiceProvider.location("placenames/resources/config/config.json?v=5");
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
  }]); // A couple of polyfills for ie11

  if (!('every' in Array.prototype)) {
    Array.prototype.every = function (tester, that
    /*opt*/
    ) {
      for (var i = 0, n = this.length; i < n; i++) {
        if (i in this && !tester.call(that, this[i], i, this)) return false;
      }

      return true;
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
      }; // The length property of the from method is 1.


      return function from(arrayLike
      /*, mapFn, thisArg */
      ) {
        // 1. Let C be the this value.
        var C = this; // 2. Let items be ToObject(arrayLike).

        var items = Object(arrayLike); // 3. ReturnIfAbrupt(items).

        if (arrayLike === null) {
          throw new TypeError('Array.from requires an array-like object - not null or undefined');
        } // 4. If mapfn is undefined, then let mapping be false.


        var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
        var T;

        if (typeof mapFn !== 'undefined') {
          // 5. else
          // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
          if (!isCallable(mapFn)) {
            throw new TypeError('Array.from: when provided, the second argument must be a function');
          } // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.


          if (arguments.length > 2) {
            T = arguments[2];
          }
        } // 10. Let lenValue be Get(items, "length").
        // 11. Let len be ToLength(lenValue).


        var len = toLength(items.length); // 13. If IsConstructor(C) is true, then
        // 13. a. Let A be the result of calling the [[Construct]] internal method
        // of C with an argument list containing the single item len.
        // 14. a. Else, Let A be ArrayCreate(len).

        var A = isCallable(C) ? Object(new C(len)) : new Array(len); // 16. Let k be 0.

        var k = 0; // 17. Repeat, while k < len… (also steps a - h)

        var kValue;

        while (k < len) {
          kValue = items[k];

          if (mapFn) {
            A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
          } else {
            A[k] = kValue;
          }

          k += 1;
        } // 18. Let putStatus be Put(A, "length", len, true).


        A.length = len; // 20. Return A.

        return A;
      };
    }();
  }
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
      templateUrl: "/extent/extent.html",
      controller: ['$scope', function ($scope) {
        $scope.parameters = extentService.getParameters();
      }],
      link: function link(scope, element, attrs) {}
    };
  }]).factory("extentService", ExtentService);
}
"use strict";

{
  angular.module("placenames.panes", []).directive("placenamesPanes", ['$rootScope', '$timeout', 'mapService', function ($rootScope, $timeout, mapService) {
    return {
      templateUrl: "/panes/panes.html",
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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

{
  var MapsCtrl = /*#__PURE__*/function () {
    function MapsCtrl(mapsService) {
      _classCallCheck(this, MapsCtrl);

      this.mapService = mapService;
    }

    _createClass(MapsCtrl, [{
      key: "toggleLayer",
      value: function toggleLayer(data) {
        this.mapsService.toggleShow(data);
      }
    }]);

    return MapsCtrl;
  }();

  MapsCtrl.$inject = ['mapsService'];

  var MapsService = /*#__PURE__*/function () {
    function MapsService(configService, mapService) {
      _classCallCheck(this, MapsService);

      this.CONFIG_KEY = "layersTab";
      this.configService = configService;
      this.mapService = mapService;
      this.configService = configService;
    }

    _createClass(MapsService, [{
      key: "getConfig",
      value: function getConfig() {
        return this.configService.getConfig(this.CONFIG_KEY);
      }
    }, {
      key: "toggleShow",
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
      templateUrl: "/maps/maps.html",
      link: function link(scope) {
        mapsService.getConfig().then(function (data) {
          scope.layersTab = data;
        });
      }
    };
  }]).controller("MapsCtrl", MapsCtrl).service("mapsService", MapsService);
}
"use strict";

{
  angular.module('placenames.popover', []).directive('placenamesPopover', [function () {
    return {
      templateUrl: "/popover/popover.html",
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

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * This is the all of australia specific implementation of the search service.
 */
{
  angular.module("placenames.search.service", []).factory('searchService', SearchService);
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
          _this.searched(item);

          data.filter = "";
        });
      } else {
        this.searched();
      }
    },
    loadPage: function loadPage(summary, authority, start, count) {
      return _loadPage(summary, authority, start, count);
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
    searched: function searched(item) {
      data.searched = data.persist;
      data.searched.item = item;
      data.searched.data.restrict = map.getBounds();
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
  $rootScope.$on("clear.button.fired", function () {
    data.searched = null;
    $timeout(function () {
      service.filtered();
    }, 20);
  });
  mapService.getMap().then(function (map) {
    var timeout;
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
  }); // We replace the search parameters like filters with a unique record ID.

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

  function _loadPage(summary, authority, start) {
    var rows = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 50;
    return groupsService.getAll().then(function (response) {
      var filterIsObject = _typeof(data.filter) === "object";
      var filter = filterIsObject ? data.filter.name : data.filter;
      var current = [];
      response.groups.forEach(function (group) {
        return current = current.concat(group.selections());
      });
      var params = {
        rows: rows,
        wt: "json"
      };
      var bounds = summary.bounds;
      var qas;
      params.fq = getBounds(bounds);
      params.sort = getSort(bounds);
      params.q = filter ? '"' + filter.toLowerCase() + '"' : "*:*";
      var qs = current.map(function (item) {
        return item.label + ':"' + item.name + '"';
      });
      qas = ['authority:' + authority.code];
      params.q += ' AND (' + qas.join(" ") + ')';

      if (qs.length) {
        params.q += ' AND (' + qs.join(" ") + ')';
      }

      params.start = start;
      params.rows = rows;
      return _request(params);
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
    });
  }

  function arrayToMap(facets) {
    var lastElement;
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
    var lastElement;
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
      params["facet.heatmap.geom"] = getHeatmapBounds(bounds);
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
    return q ? '"' + q.toLowerCase() + '"' : "*:*";
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
        return data;
      });
    });
  } // We assume summary is already made.


  function createAuthorityParams() {
    return summary.authorities.map(function (auth) {
      return 'authority:' + auth.code;
    });
  } // We assume
  // Current is one of group category or feature, which ever panel is open.


  function createCurrentParams() {
    return summary.current.map(function (item) {
      return item.label + ':"' + item.name + '"';
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

  function getSort(bounds) {
    var dx = (bounds.getEast() - bounds.getWest()) / 2;
    var dy = (bounds.getNorth() - bounds.getSouth()) / 2;
    return "geodist(ll," + (bounds.getSouth() + dy) + "," + (bounds.getWest() + dx) + ") asc";
  }

  function getHeatmapBounds(bounds) {
    return "[" + Math.max(bounds.getSouth(), -90) + "," + Math.max(bounds.getWest(), -180) + " TO " + Math.min(bounds.getNorth(), 90) + "," + Math.min(bounds.getEast(), 180) + "]";
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
      "facet.heatmap.format": "ints2D",
      "facet.heatmap": "location",
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
  angular.module("placenames.feature", []).directive("placenamesFeature", ['placenamesItemService', 'searchService', function (placenamesItemService, searchService) {
    return {
      templateUrl: "/searched/feature.html",
      bindToController: {
        feature: "="
      },
      controller: function controller() {
        console.log("Creating an item scope");

        this.showPan = function (feature) {
          placenamesItemService.showPan(feature);
        };

        this.download = function (type) {
          placenamesItemService[type](this);
        };

        this.leave = function () {
          searchService.hide();
        };

        this.enter = function () {
          searchService.show(this.feature);
        };

        this.$destroy = function () {
          searchService.hide();
        };
      },
      controllerAs: "vm"
    };
  }]).filter("formatDate", function () {
    return function (dateStr) {
      if (!dateStr) {
        return dateStr;
      }

      var date = new Date(dateStr);
      return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
    };
  }).factory('placenamesItemService', ['$http', 'configService', 'mapService', function ($http, configService, mapService) {
    var ZOOM_IN = 8;
    var marker;
    var service = {
      hide: function hide(what) {
        return mapService.getMap().then(function (map) {
          if (marker) {
            map.removeLayer(marker);
          }

          return map;
        });
      },
      show: function show(what) {
        return this.hide().then(function (map) {
          var location = what.location.split(" ").reverse().map(function (str) {
            return +str;
          }); // split lng/lat string seperated by space, reverse to lat/lng, cooerce to numbers

          marker = L.popup().setLatLng(location).setContent(what.name + "<br/>Lat/Lng: " + location[0] + "&deg;" + location[1] + "&deg;").openOn(map);
          return {
            location: location,
            map: map,
            marker: marker
          };
        });
      },
      wfs: function wfs(vm) {
        configService.getConfig("results").then(function (_ref) {
          var wfsTemplate = _ref.wfsTemplate;
          $http.get(wfsTemplate.replace("${id}", vm.item.recordId)).then(function (response) {
            var blob = new Blob([response.data], {
              type: "application/json;charset=utf-8"
            });
            saveAs(blob, "gazetteer-wfs-feature-" + vm.item.recordId + ".xml");
          });
        });
      },
      showPan: function showPan(what) {
        return this.show(what).then(function (details) {
          var map = details.map;
          var currentZoom = map.getZoom();
          map.setView(details.location, ZOOM_IN > currentZoom ? ZOOM_IN : currentZoom, {
            animate: true
          });
          return details;
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
}
"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

{
  angular.module("placenames.searched", ["placenames.feature"]).directive('placenamesSearched', ['$rootScope', 'searchService', function ($rootScope, searchService) {
    return {
      restrict: "AE",
      templateUrl: "/searched/searched.html",
      scope: {
        authorities: "="
      },
      link: function link(scope) {
        scope.data = searchService.data;
        scope.summary = searchService.summary;
        $rootScope.$on("clear.button.fired", function () {
          scope.showDownload = false;
        });

        scope.clear = function () {
          $rootScope.$broadcast("clear.button.fired");
        };
      }
    };
  }]).directive("placenamesZoomToAll", ['mapService', function (mapService) {
    return {
      template: '<button type="button" class="map-tool-toggle-btn" ng-click="zoomToAll()" title="{{text}}">' + '<span class="hidden-sm">{{text}}</span> ' + '<i class="fa fa-lg {{icon}}"></i>' + '</button>',
      scope: {
        center: "=",
        zoom: "=",
        bounds: "=",
        text: "@",
        icon: "@"
      },
      link: function link(scope) {
        scope.zoomToAll = function () {
          mapService.getMap().then(function (map) {
            if (scope.center && scope.zoom) {
              map.setView(scope.center, scope.zoom);
            } else {
              map.fitBounds(scope.bounds);
            }
          });
        };
      }
    };
  }]).directive("placenamesSearchedSummary", [function () {
    return {
      templateUrl: "/searched/summary.html",
      scope: {
        state: "="
      }
    };
  }]).directive("placenamesSearchedItem", [function () {
    return {
      templateUrl: "/searched/item.html",
      scope: {
        authority: "=",
        feature: "="
      }
    };
  }]).directive("placenamesSearchedDownload", [function () {
    return {
      template: "<placenames-download data='data' class='searched-download'></placenames-download>",
      scope: {
        data: "="
      }
    };
  }]).directive('placenamesJurisdiction', ['searchedService', function (searchedService) {
    return {
      restrict: "AE",
      templateUrl: "/searched/jurisdiction.html",
      scope: {
        authority: "=",
        item: "="
      },
      link: function link(scope) {
        scope.features = [];

        scope.toggle = function () {
          scope.showing = !scope.showing;

          if (scope.showing && !scope.features.length) {
            scope.loadPage();
          }
        };

        scope.loadPage = function () {
          if (scope.features.length >= scope.authority.count) return;
          scope.loading = true;
          searchedService.getPage(scope.authority, scope.features.length).then(function (_ref) {
            var _scope$features;

            var response = _ref.response;
            scope.loading = false;

            (_scope$features = scope.features).push.apply(_scope$features, _toConsumableArray(response.docs));
          })["catch"](function () {
            scope.loading = false;
          });
        };
      }
    };
  }]).filter("activeAuthorities", function () {
    return function (all) {
      return all.filter(function (item) {
        return item.count;
      });
    };
  }).factory("searchedService", ['$rootScope', 'searchService', function ($rootScope, searchService) {
    var lastResponse = null;
    var service = {
      data: {
        searched: false
      },
      scratch: {}
    };
    $rootScope.$on('pn.search.complete', function (event, response) {
      lastResponse = response;
    });
    $rootScope.$on("search.button.fired", function () {
      service.data.searched = searchService.data.searched;
    });
    $rootScope.$on("clear.button.fired", function () {
      service.scratch = {};
      delete service.data.searched;
    });

    service.getPage = function (authority, start) {
      console.log("Paging", authority, start);
      return searchService.loadPage(this.data.searched, authority, start);
    };

    return service;

    function toMap(arr) {
      var key = null;
      var response = {};
      arr.forEach(function (item, index) {
        if (index % 2 === 0) {
          key = item;
        } else if (item) {
          response[key] = item;
        }
      });
      return response;
    }
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
              templateUrl: '/splash/splash.html',
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
  angular.module("placenames.toolbar", []).directive("placenamesToolbar", [function () {
    return {
      templateUrl: "/toolbar/toolbar.html",
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

function getBounds(bounds, restrictTo) {
  var fq;

  if (restrictTo) {
    var left = Math.max(bounds.getWest(), -180, restrictTo.getWest());
    var right = Math.min(bounds.getEast(), 180, restrictTo.getEast());
    var top = Math.min(bounds.getNorth(), 90, restrictTo.getNorth());
    var bottom = Math.max(bounds.getSouth(), -90, restrictTo.getSouth());
    fq = "location:[" + (bottom > top ? top : bottom) + "," + (left > right ? right : left) + " TO " + top + "," + right + "]";
  } else {
    fq = "location:[" + Math.max(bounds.getSouth(), -90) + "," + Math.max(bounds.getWest(), -180) + " TO " + Math.min(bounds.getNorth(), 90) + "," + Math.min(bounds.getEast(), 180) + "]";
  }

  return fq;
}
angular.module('placenames.templates', []).run(['$templateCache', function($templateCache) {$templateCache.put('/about/about.html','<span class="about" ng-mouseenter="over()" ng-mouseleave="out()"\r\n      ng-class="(about.show || about.ingroup || about.stick) ? \'transitioned-down\' : \'transitioned-up\'">\r\n   <button class="undecorated about-unstick" ng-click="unstick()" style="float:right">X</button>\r\n   <div class="aboutHeading">About Composite Gazetteer of Australia</div>\r\n   <div ng-repeat="item in about.items">\r\n      <a ng-href="{{item.link}}" name="about{{$index}}" title="{{item.heading}}" target="_blank"> \r\n         {{item.heading}}\r\n      </a>\r\n   </div>\r\n</span>');
$templateCache.put('/about/button.html','<button ng-mouseenter="over()" ng-mouseleave="out()"\r\n      ng-click="toggleStick()" tooltip-placement="left" uib-tooltip="About Composite Gazetteer of Australia"\r\n      class="btn btn-primary btn-default">About</button>');
$templateCache.put('/antarctic/antarctic.html','<button type="button" class="map-tool-toggle-btn" ng-click="go()" title="Change to Antarctic view">\r\n   <span>Go to Antarctic view</span>\r\n</button>');
$templateCache.put('/extent/extent.html','<div class="row" style="border-top: 1px solid gray; padding-top:5px">\r\n\t<div class="col-md-5">\r\n\t\t<div class="form-inline">\r\n\t\t\t<label>\r\n\t\t\t\t<input id="extentEnable" type="checkbox" ng-model="parameters.fromMap" ng-click="change()"></input> \r\n\t\t\t\tRestrict area to map\r\n\t\t\t</label>\r\n\t\t</div>\r\n\t</div>\r\n\t \r\n\t<div class="col-md-7" ng-show="parameters.fromMap">\r\n\t\t<div class="container-fluid">\r\n\t\t\t<div class="row">\r\n\t\t\t\t<div class="col-md-offset-3 col-md-8">\r\n\t\t\t\t\t<strong>Y Max:</strong> \r\n\t\t\t\t\t<span>{{parameters.yMax | number : 4}}</span> \r\n\t\t\t\t</div>\r\n\t\t\t</div>\r\n\t\t\t<div class="row">\r\n\t\t\t\t<div class="col-md-6">\r\n\t\t\t\t\t<strong>X Min:</strong>\r\n\t\t\t\t\t<span>{{parameters.xMin | number : 4}}</span> \r\n\t\t\t\t</div>\r\n\t\t\t\t<div class="col-md-6">\r\n\t\t\t\t\t<strong>X Max:</strong>\r\n\t\t\t\t\t<span>{{parameters.xMax | number : 4}}</span> \r\n\t\t\t\t</div>\r\n\t\t\t</div>\r\n\t\t\t<div class="row">\r\n\t\t\t\t<div class="col-md-offset-3 col-md-8">\r\n\t\t\t\t\t<strong>Y Min:</strong>\r\n\t\t\t\t\t<span>{{parameters.yMin | number : 4}}</span> \r\n\t\t\t\t</div>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t</div>\r\n</div>');
$templateCache.put('/panes/panes.html','<div class="mapContainer" class="col-md-12" style="padding-right:0">\r\n   <div class="panesMapContainer" geo-map configuration="data.map"></div>\r\n   <div class="base-layer-controller">\r\n       <div geo-draw data="data.map.drawOptions" line-event="elevation.plot.data" rectangle-event="bounds.drawn"></div>\r\n       <placenames-nt></placenames-nt>\r\n   </div>\r\n   <restrict-pan bounds="data.map.position.bounds"></restrict-pan>\r\n</div>');
$templateCache.put('/maps/maps.html','<div  ng-controller="MapsCtrl as maps">\r\n\t<div style="position:relative;padding:5px;padding-left:10px;" >\r\n\t\t<div class="panel panel-default" style="padding:5px;" >\r\n\t\t\t<div class="panel-heading">\r\n\t\t\t\t<h3 class="panel-title">Layers</h3>\r\n\t\t\t</div>\r\n\t\t\t<div class="panel-body">\r\n\t\t\t\t<div class="container-fluid">\r\n\t\t\t\t\t<div class="row" ng-repeat="layer in layersTab.layers" \r\n\t\t\t\t\t\t\tstyle="padding:7px;padding-left:10px;position:relative" ng-class-even="\'even\'" ng-class-odd="\'odd\'">\r\n\t\t\t\t\t\t<div style="position:relative;left:6px;">\r\n\t\t\t\t\t\t\t<a href="{{layer.metadata}}" target="_blank" \r\n\t\t\t\t\t\t\t\t\tclass="featureLink" title=\'View metadata related to "{{layer.name}}". (Opens new window.)\'>\r\n\t\t\t\t\t\t\t\t{{layer.name}}\r\n\t\t\t\t\t\t\t</a>\r\n\t\t\t\t\t\t\t<div class="pull-right" style="width:270px;" tooltip="Show on map. {{layer.help}}">\r\n\t\t\t\t\t\t\t\t<span style="padding-left:10px;width:240px;" class="pull-left"><explorer-layer-slider layer="layer.layer"></explorer-layer-slider></span>\r\n\t\t\t\t\t\t\t\t<button style="padding:2px 8px 2px 2px;" type="button" class="undecorated featureLink pull-right" href="javascript:;" \r\n\t\t\t\t\t\t\t\t\t\tng-click="maps.toggleLayer(layer)" >\r\n\t\t\t\t\t\t\t\t\t<i class="fa" ng-class="{\'fa-eye-slash\':(!layer.displayed), \'fa-eye active\':layer.displayed}"></i>\r\n\t\t\t\t\t\t\t\t</button>\r\n\t\t\t\t\t\t\t</div>\t\t\t\t\t\t\r\n\t\t\t\t\t\t</div>\r\n\t\t\t\t\t</div>\r\n\t\t\t\t</div>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t</div>\r\n</div>');
$templateCache.put('/popover/popover.html','<div class="placenames-popover {{direction}}" ng-class="containerClass" ng-show="show">\r\n  <div class="arrow"></div>\r\n  <div class="placenames-popover-inner" ng-transclude></div>\r\n</div>');
$templateCache.put('/side-panel/side-panel-left.html','<div class="cbp-spmenu cbp-spmenu-vertical cbp-spmenu-left" style="width: {{left.width}}px;" ng-class="{\'cbp-spmenu-open\': left.active}">\r\n    <a href="" title="Close panel" ng-click="closeLeft()" style="z-index: 1200">\r\n        <span class="glyphicon glyphicon-chevron-left pull-right"></span>\r\n    </a>\r\n    <div ng-show="left.active === \'legend\'" class="left-side-menu-container">\r\n        <legend url="\'img/AustralianTopogaphyLegend.png\'" title="\'Map Legend\'"></legend>\r\n    </div>\r\n</div>');
$templateCache.put('/side-panel/side-panel-right.html','<div class="cbp-spmenu cbp-spmenu-vertical cbp-spmenu-right noPrint" ng-attr-style="width:{{right.width}}" ng-class="{\'cbp-spmenu-open\': right.active}">\r\n    <a href="" title="Close panel" ng-click="closePanel()" style="z-index: 1">\r\n        <span class="glyphicon glyphicon-chevron-right pull-left"></span>\r\n    </a>\r\n    <div ng-show="right.active === \'search\'" class="right-side-menu-container" style="z-index: 2">\r\n        <div class="panesTabContentItem" placenames-searched authorities="authorities"></div>\r\n    </div>\r\n    <div ng-if="right.active === \'glossary\'" class="right-side-menu-container">\r\n        <div class="panesTabContentItem" placenames-glossary></div>\r\n    </div>\r\n    <div ng-show="right.active === \'help\'" class="right-side-menu-container">\r\n        <div class="panesTabContentItem" placenames-help></div>\r\n    </div>\r\n</div>\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n');
$templateCache.put('/searched/feature.html','<div ng-mouseenter="vm.enter()" ng-mouseleave="vm.leave()">\r\n      <div class="container-fluid">\r\n         <div class="row">\r\n            <div class="col-md-12 pn-header" >\r\n               <button type="button" class="undecorated" ng-click="vm.showPan(feature)"\r\n                      tooltip-append-to-body="true" title="Zoom to location." tooltip-placement="left" uib-tooltip="Zoom to location">\r\n                  <i class="fa fa-lg fa-flag-o"></i>\r\n               </button>\r\n               <span>{{feature.name}}</span>\r\n               <span class="pull-right">Record ID: {{feature.authorityId}}</span>\r\n            </div>\r\n         </div>\r\n      </div>\r\n      <div class="container-fluid">\r\n         <div class="row">\r\n            <div class="col-md-4" title="Features belong to a category and categories belong to a group">Feature Type</div>\r\n            <div class="col-md-8">{{feature.feature}}</div>\r\n         </div>\r\n         <div class="row" title="Features belong to a category and categories belong to a group">\r\n            <div class="col-md-4">Category</div>\r\n            <div class="col-md-8">{{feature.category}}</div>\r\n         </div>\r\n         <div class="row" title="Features belong to a category and categories belong to a group">\r\n            <div class="col-md-4">Group</div>\r\n            <div class="col-md-8">{{feature.group}}</div>\r\n         </div>\r\n         <div class="row">\r\n            <div class="col-md-4">Supply Date</div>\r\n            <div class="col-md-8" title="Date format is dd/mm/yyyy">{{feature.supplyDate | formatDate}}</div>\r\n         </div>\r\n         <div class="row">\r\n            <div class="col-md-4">Lat / Lng</div>\r\n            <div class="col-md-8">\r\n               <span class="pn-numeric">\r\n                  {{feature.location | itemLatitude}}&deg; / {{feature.location | itemLongitude}}&deg;\r\n               </span>\r\n            </div>\r\n         </div>\r\n\r\n      </div>');
$templateCache.put('/searched/item.html','<div class="row">\r\n   <div class="col-md-3" style="text-align:center">\r\n      <a href="{{authority.href}}" target="_blank">\r\n         <img ng-src="{{authority.image}}" ng-attr-style="height:{{authority.height}}px">\r\n      </a>\r\n   </div>\r\n   <div class="col-md-9">\r\n      <strong ng-bind-html="authority.name"></strong>\r\n      <div>\r\n         <a ng-if="authority.metadata" ng-href="{{authority.metadata}}" target="_blank">[metadata]</a>\r\n         <a ng-if="authority.disclaimer" ng-click="authority.showDisclaimer = !authority.showDisclaimer">[disclaimer]</a>\r\n      </div>\r\n   </div>\r\n</div>\r\n<div ng-show="authority.showDisclaimer" class="searched-disclaimer" ng-bind-html="authority.disclaimer"></div>\r\n<placenames-feature feature="item"></placenames-feature>');
$templateCache.put('/searched/jurisdiction.html','<div class="row">\r\n   <div class="col-md-3" style="text-align:center">\r\n      <a href="{{authority.href}}" target="_blank">\r\n         <img ng-src="{{authority.image}}" ng-attr-style="height:{{authority.height}}px">\r\n      </a>\r\n   </div>\r\n   <div class="col-md-6">\r\n      <strong ng-bind-html="authority.name"></strong>\r\n      <div>\r\n         <a ng-if="authority.metadata" ng-href="{{authority.metadata}}" target="_blank">[metadata]</a>\r\n         <a ng-if="authority.disclaimer" ng-click="authority.showDisclaimer = !authority.showDisclaimer">[note]</a>\r\n      </div>\r\n   </div>\r\n   <div class="col-md-3" style="float:right;">\r\n      ({{authority.count | number:0}} features)\r\n      <div>\r\n         <a ng-click="toggle()" class="searched-important">[{{showing?\'hide\':\'show\'}} list]</a>\r\n      </div>\r\n   </div>\r\n</div>\r\n<div ng-show="authority.showDisclaimer" class="searched-disclaimer" ng-bind-html="authority.disclaimer"></div>\r\n<div ng-show="showing">\r\n   <placenames-feature ng-repeat="feature in features" feature="feature"></placenames-feature>\r\n   <div class="row">\r\n      <div class="col-md-7" ng-show="authority.count > features.length">\r\n         <i style="padding:10px;" class="fa fa-spinner fa-2x fa-spin" aria-hidden="true" ng-show="loading"></i>\r\n         <a class="searched-important" ng-show="authority.count > features.length && !loading" ng-click="loadPage()">[more]</a>\r\n      </div>\r\n      <div class="col-md-7" ng-show="authority.count === features.length">\r\n         <div class="ellipsis">(End of features for {{authority.name}})</div>\r\n      </div>\r\n      <div class="col-md-5">\r\n         <span class="pull-right">\r\n            Showing {{features.length | number : 0}} of {{authority.count| number : 0}}\r\n            <a ng-click="toggle()" class="searched-important">[hide]</a>\r\n         </span>\r\n      </div>\r\n</div>');
$templateCache.put('/searched/searched.html','<div class="pn-results-heading" style="min-height:25px" ng-if="data.searched" ng-class="{\'searched-download\': showDownload}">\r\n   <span ng-if="data.searched.item">\r\n      Showing selected feature\r\n   </span>\r\n   <span ng-if="!data.searched.item">\r\n      Matched {{data.searched.data.response.numFound | number}} features\r\n   </span>\r\n   <span class="pull-right">\r\n      <button class="btn btn-primary" style="padding:0 10px" ng-click="showDownload = !showDownload">\r\n         <span ng-if="!showDownload">Download...</span>\r\n         <span ng-if="showDownload">Hide download details</span>\r\n      </button>\r\n      <button class="btn btn-primary" style="padding:0 10px" ng-click="clear()">\r\n         Clear results\r\n      </button>\r\n   </span>\r\n   <placenames-search-filters></placenames-search-filters>\r\n   <h4>Composite Gazetteer of Australia</h4>\r\n   <placenames-searched-download data="data.searched" ng-if="showDownload"></placenames-searched-download>\r\n</div>\r\n\r\n<div ng-if="data.searched">\r\n   <div ng-if="!data.searched.item">\r\n      <div ng-repeat="authority in authorities | activeAuthorities" title="{{authority.jurisdiction}}" style="border-bottom: 1px gray solid;padding:3px 0 3px">\r\n         <placenames-jurisdiction authority="authority"></placenames-jurisdiction>\r\n      </div>\r\n   </div>\r\n   <div ng-if="data.searched.item">\r\n      <div ng-repeat="authority in authorities | activeAuthorities" title="{{authority.jurisdiction}}" style="border-bottom: 1px gray solid;padding:3px 0 3px">\r\n         <placenames-searched-item authority="authority" feature="data.searched.item"></placenames-searched-item>\r\n      </div>\r\n   </div>\r\n</div>\r\n<div ng-if="!data.searched">\r\n   <div class="panel-heading" style="min-height:25px">\r\n      <span style="font-weight:bold">\r\n         Need help on how to search?\r\n      </span>\r\n   </div>\r\n   <div class="panel-body">\r\n      Searching is conducted on the current map view. Pan and zoom the map to your area of interest\r\n      <br/>\r\n      <br/>\r\n      <span class="padding-left:5px">You can apply filters for:</span>\r\n      <div class="well">\r\n         Features matching on partial or like name, groups, categories and features.\r\n         <br/> You can restrict results to only authorities of interest.\r\n         <br/>\r\n         <br/> Once you have zoomed, panned and filtered to your desired results hit the search button to list details with\r\n         the option to download in a variety of projections and formats.\r\n         <br/>\r\n         <br/>\r\n         <b title="nota bene">NB</b> Name searching is done on "fuzzy" searching which means it isn\'t always an exact match\r\n         but a match something like what is typed.\r\n      </div>\r\n      <div>\r\n         If you are interested in features in the Antarctic consider using the\r\n         <a href="antarctic.html">search specific to the polar view</a>\r\n      </div>\r\n   </div>\r\n</div>');
$templateCache.put('/searched/summary.html','<span class="placenamesSearchSummary"\r\n      ng-if="state.searched.data.response.numFound">(Found {{state.searched.data.response.numFound | number}} features)</span>');
$templateCache.put('/splash/splash.html','<div class="modal-header">\r\n   <h3 class="modal-title splash">Composite Gazetteer of Australia</h3>\r\n</div>\r\n<div class="modal-body" id="accept" ng-form exp-enter="accept()" placenames-splash-modal style="width: 100%; margin-left: auto; margin-right: auto;">\r\n\t<div style="border-bottom:1px solid gray">\r\n\t\t<p>\r\n\t\t\tUsers can download the Composite Gazetteer of Australia data which is licensed under Creative Commons.\r\n\t\t</p>\r\n\t\t<p>\r\n\t\t\tData can be downloaded from the portal at <strong>no charge</strong> and there is no limit to how many requests you can place (please check the file size before you download your results).\r\n\t\t</p>\r\n\t\t<p>\r\n\t\t\tIf you need datasets in full, please contact <a href="clientservices@ga.gov.au">clientservices@ga.gov.au</a>.\r\n\t\t</p>\r\n\t\t<p>\r\n\t\t\t<a href="http://opentopo.sdsc.edu/gridsphere/gridsphere?cid=contributeframeportlet&gs_action=listTools" target="_blank">Click here for Free GIS Tools.</a>\r\n\t\t</p>\r\n\r\n\t\t<div style="padding:30px; padding-top:0; padding-bottom:40px; width:100%">\r\n\t\t\t<div class="pull-right">\r\n\t\t\t  \t<button type="button" class="btn btn-primary" ng-model="seenSplash" ng-focus ng-click="accept()">Continue</button>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t</div>\r\n\t<div ng-show="messages.length > 0" class="container" style="width:100%; max-height:250px; overflow-y:auto">\r\n\t\t<div class="row" ng-class-even="\'grayline\'" style="font-weight:bold">\r\n\t\t\t<div class="col-sm-12" ><h3>News</h3></div>\r\n\t\t</div>\r\n\r\n\t\t<div class="row"ng-class-even="\'grayline\'" style="max-height:400px;overflow:auto" ng-repeat="message in messages | sortNotes">\r\n\t\t\t<div class="col-sm-12">\r\n\t\t\t\t<h4>{{message.title}} <span class="pull-right" style="font-size:70%">Created: {{message.creationDate | date : "dd/MM/yyyy"}}</span></h4>\r\n\t\t\t\t<div ng-bind-html="message.description"></div>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t</div>\r\n</div>');
$templateCache.put('/toolbar/toolbar.html','<div class="placenames-toolbar noPrint">\r\n    <div class="toolBarContainer">\r\n        <div>\r\n            <ul class="left-toolbar-items">\r\n               <li>\r\n                  <antarctic-view></antarctic-view>\r\n               </li>\r\n            </ul>\r\n            <ul class="right-toolbar-items">\r\n                <li>\r\n                    <panel-trigger panel-id="search" panel-width="540px" name="Search results" icon-class="fa-list" title="When a search has completed this allows the showing and hiding of the results">\r\n                        <placenames-results-summary state="state"></placenames-results-summary>\r\n                    </panel-trigger>\r\n                </li>\r\n                <li ng-if="state.searched.data.response.numFound">\r\n                   <placenames-zoom-to-all bounds="state.searched.bounds" text="Show searched area" icon="fa-object-group"></placenames-zoom-to-all>\r\n                </li>\r\n                <li reset-page></li>\r\n                <li product-specification></li>\r\n                <li feedback></li>\r\n                <li>\r\n                  <panel-trigger panel-id="help" panel-width="540px" name="Help" icon-class="fa-question-circle-o" title="Show help"></panel-trigger>\r\n               </li>\r\n            </ul>\r\n        </div>\r\n    </div>\r\n</div>');
$templateCache.put('/authorities/authorities.html','<div ng-repeat="item in authorities" style="width:49%; display:inline-block">\r\n   <div class="ellipsis" title=\'Jurisdiction: {{item.jurisdiction}}, Authority name: {{item.name}}\'>\r\n      <input type="checkbox" ng-click="update()" ng-model="item.selected" ng-change="change()">\r\n      <span>\r\n         <a target="_blank" href="http://www.google.com/search?q={{item.name}}">{{item.code}}</a>\r\n         ({{(item.allCount | number) + (item.allCount || item.allCount == 0?\' of \':\'\')}}{{item.total | number}})\r\n      </span>\r\n   </div>\r\n</div>');
$templateCache.put('/categories/categories.html','<div>\r\n   <div ng-repeat="category in categories | orderBy: \'name\'" ng-attr-title="{{category.definition}}">\r\n      <input type="checkbox" ng-model="category.selected" ng-change="change()">\r\n      <span title="[Group: {{category.parent.name}}], {{category.definition}}">\r\n         {{category.name}}\r\n         ({{(category.allCount | number) + (category.allCount || category.allCount == 0?\' of \':\'\')}}{{category.total}})\r\n      </span>\r\n      <button class="undecorated" ng-click="category.showChildren = !category.showChildren">\r\n         <i class="fa fa-lg" ng-class="{\'fa-question-circle-o\':!category.showChildren, \'fa-minus-square-o\': category.showChildren}"></i>\r\n      </button>\r\n      <div ng-show="category.showChildren" style="padding-left: 8px; border-bottom: solid 1px lightgray">\r\n         <div>[Group: {{category.parent.name}}]\r\n         <div ng-if="category.definition">{{category.definition}}</div>\r\n         It includes the following feature types:\r\n         <placenames-category-children features="category.features"></placenames-category-children>\r\n      </div>\r\n   </div>\r\n</div>');
$templateCache.put('/categories/features.html','<div>\n   <div ng-repeat="feature in features" style="padding-left:10px" title="{{feature.definition}}">\n      - {{feature.name}} ({{feature.total}})\n   </div>\n</div>');
$templateCache.put('/contributors/contributors.html','<span class="contributors" ng-mouseenter="over()" ng-mouseleave="out()" style="z-index:1500"\r\n      ng-class="(contributors.show || contributors.ingroup || contributors.stick) ? \'transitioned-down\' : \'transitioned-up\'">\r\n   <button class="undecorated contributors-unstick" ng-click="unstick()" style="float:right">X</button>\r\n   <div ng-repeat="contributor in contributors.orgs | activeContributors" style="text-align:cnter">\r\n      <a ng-href="{{contributor.href}}" name="contributors{{$index}}" title="{{contributor.title}}" target="_blank">\r\n         <img ng-src="{{contributor.image}}"  alt="{{contributor.title}}" class="elvis-logo" ng-class="contributor.class"></img>\r\n      </a>\r\n   </div>\r\n</span>');
$templateCache.put('/contributors/show.html','<a ng-mouseenter="over()" ng-mouseleave="out()" class="contributors-link" title="Click to lock/unlock contributors list."\r\n      ng-click="toggleStick()" href="#contributors0">Contributors</a>');
$templateCache.put('/download/download.html','<div class="container-fluid">\r\n   <div class="row">\r\n      <div class="col-md-4">\r\n         <label for="geoprocessOutCoordSys">\r\n            Coordinate System\r\n         </label>\r\n      </div>\r\n      <div class="col-md-8">\r\n         <select style="width:95%" ng-model="processing.outCoordSys" id="geoprocessOutCoordSys"\r\n            ng-options="opt.value for opt in outCoordSys"></select>\r\n      </div>\r\n   </div>\r\n\r\n   <div class="row">\r\n      <div class="col-md-4">\r\n         <label for="geoprocessOutputFormat">\r\n            Output Format\r\n         </label>\r\n      </div>\r\n      <div class="col-md-8">\r\n         <select style="width:95%" ng-model="processing.outFormat" id="geoprocessOutputFormat" ng-options="opt.value for opt in processing.config.outFormat"></select>\r\n      </div>\r\n   </div>\r\n\r\n\r\n   <div class="row" title="You can elect to get common data across the authorities or for each authority receive the authorities data per feature">\r\n      <div class="col-md-4">\r\n         <label for="geoprocessDataFieldsCommon">\r\n            Data fields\r\n         </label>\r\n      </div>\r\n      <div class="col-md-8">\r\n         <label for="geoprocessDataFieldsCommon">Common fields</label>\r\n         <input type="radio" ng-model="processing.dataFields" value="common" id="geoprocessDataFieldsCommon" name="dataFields" checked="checked">\r\n         <label for="geoprocessDataFields">Authorities\' fields</label>\r\n         <input type="radio" ng-model="processing.dataFields" value="authorities" id="geoprocessDataFields" name="dataFields">\r\n      </div>\r\n   </div>\r\n\r\n   <div class="row">\r\n      <div class="col-md-4">\r\n         <label for="geoprocessOutputFormat">\r\n            File name\r\n         </label>\r\n      </div>\r\n      <div class="col-md-8">\r\n         <input type="text" ng-model="processing.filename" class="download-control" placeholder="Optional filename" title="Alphanumeric, hyphen or dash characters, maximium of 16 characters">\r\n      </div>\r\n   </div>\r\n   <div class="row">\r\n      <div class="col-md-4">\r\n         <label for="geoprocessOutputFormat">\r\n            Email\r\n         </label>\r\n      </div>\r\n      <div class="col-md-8">\r\n         <input required="required" type="email" ng-model="processing.email" class="download-control" placeholder="Email address to send download link">\r\n      </div>\r\n   </div>\r\n\r\n   <div class="row">\r\n      <div class="col-md-5" style="padding-top:7px">\r\n         <div class="progress">\r\n            <div class="progress-bar" role="progressbar" aria-valuenow="{{processing.percentComplete}}" aria-valuemin="0" aria-valuemax="100"\r\n               style="width: {{processing.percentComplete}}%;">\r\n               <span class="sr-only"></span>\r\n            </div>\r\n         </div>\r\n      </div>\r\n      <div class="col-md-5" style="padding-top:7px">\r\n         <span style="padding-right:10px" uib-tooltip="Select a valid coordinate system for area." tooltip-placement="top">\r\n            <i class="fa fa-file-video-o fa-2x" ng-class="{\'product-valid\': processing.validProjection, \'product-invalid\': !processing.validProjection}"></i>\r\n         </span>\r\n         <span style="padding-right:10px" uib-tooltip="Select a valid download format." tooltip-placement="top">\r\n            <i class="fa fa-files-o fa-2x" ng-class="{\'product-valid\': processing.validFormat, \'product-invalid\': !processing.validFormat}"></i>\r\n         </span>\r\n         <span style="padding-right:10px" uib-tooltip="Optional custom filename (alphanumeric, max length 8 characters)" tooltip-placement="top">\r\n            <i class="fa fa-save fa-2x" ng-class="{\'product-valid\': processing.validFilename, \'product-invalid\': !processing.validFilename}"></i>\r\n         </span>\r\n         <span style="padding-right:10px" uib-tooltip="Provide an email address." tooltip-placement="top">\r\n            <i class="fa fa-envelope fa-2x" ng-class="{\'product-valid\': processing.validEmail, \'product-invalid\': !processing.validEmail}"></i>\r\n         </span>\r\n      </div>\r\n      <div class="col-md-2">\r\n         <button class="btn btn-primary pull-right" ng-disabled="!processing.valid" ng-click="submit()">Submit</button>\r\n      </div>\r\n   </div>\r\n</div>');
$templateCache.put('/features/features.html','<div>\r\n      <div ng-repeat="feature in features | orderBy: \'name\'" title="{{feature.definition}}">\r\n         <input type="checkbox" ng-model="feature.selected" ng-change="change()">\r\n         <span title="[Group/category: {{feature.parent.parent.name}}/{{feature.parent.name}}], {{feature.definition}}">\r\n            {{feature.name}} ({{(feature.allCount | number) + (feature.allCount || feature.allCount == 0?\' of \':\'\')}}{{feature.total}})\r\n         </span>\r\n         <button class="undecorated" ng-click="feature.showChildren = !feature.showChildren">\r\n            <i class="fa fa-lg" ng-class="{\'fa-question-circle-o\':!feature.showChildren, \'fa-minus-square-o\': feature.showChildren}"></i>\r\n         </button>\r\n         <div ng-show="feature.showChildren" style="padding-left: 8px; border-bottom: solid 1px lightgray">\r\n            <div ng-if="feature.definition">{{feature.definition}}</div>\r\n            [Group/Category: {{feature.parent.parent.name}}/{{feature.parent.name}}]\r\n         </div>\r\n      </div>\r\n   </div>');
$templateCache.put('/feedback/feedback.html','<button type="button" class="map-tool-toggle-btn" ng-click="open()"\r\n   title="Provide feedback via Geoscience Australia\'s contact page.">\r\n   <span class="hidden-sm">Feedback</span>\r\n   <i class="fa fa-lg fa-comment-o"></i>\r\n</button>');
$templateCache.put('/groups/category.html','\r\n<div style="padding-left:10px">\r\n   - <span ng-attr-title="{{category.definition}}">{{category.name}}</span>\r\n   <div ng-repeat="feature in category.features | orderBy:\'name\'" style="padding-left:10px">\r\n      - <span ng-attr-title="{{feature.definition}}">{{feature.name}}</span>\r\n   </div>\r\n</div>\r\n');
$templateCache.put('/groups/groups.html','<div>\r\n   <div ng-repeat="group in data.groups">\r\n      <input type="checkbox" ng-model="group.selected" ng-change="change()"><span title="{{group.definition}}">\r\n         {{group.name}} ({{(group.allCount | number) + (group.allCount || group.allCount == 0?\' of \':\'\')}}{{group.total | number}})\r\n      <button class="undecorated" ng-click="group.showChildren = !group.showChildren">\r\n         <i class="fa fa-lg" ng-class="{\'fa-question-circle-o\':!group.showChildren, \'fa-minus-square-o\': group.showChildren}"></i>\r\n      </button>\r\n      <div ng-show="group.showChildren" style="padding-left:8px">\r\n         {{group.definition}}<br/><br/>\r\n         This group is made up of the following categories and feature types:\r\n         <div ng-repeat="category in group.categories" style="padding-left:8px">\r\n            <placenames-group-children category="category"></placenames-group-children>\r\n         </div>\r\n      </div>\r\n   </div>\r\n</div>');
$templateCache.put('/filters/tree.html','<div style="max-height:300px; overflow-y:auto;padding-left:10px">\r\n   <div ng-repeat="group in groups | withTotals">\r\n      <button class="undecorated" ng-click="group.expanded = !group.expanded" ng-style="{color:group.color}">\r\n         <i class="fa" ng-class="{\'fa-plus\':!group.expanded, \'fa-minus\':group.expanded}"></i>\r\n      </button>\r\n      <input type="checkbox" class="filters-check" ng-model="group.selectExpand" ng-change="change(group)" ng-style="{color:group.color}">\r\n      <span title="{{group.definition}}">\r\n         {{group.name}} ({{(group.allCount | number) + (group.allCount || group.allCount == 0?\' of \':\'\')}}{{group.total | number}})\r\n      </span>\r\n      <div style="padding-left:10px" ng-show="group.expanded">\r\n         <div ng-repeat="category in group.categories | withTotals | orderBy: \'name\'"  ng-attr-title="{{category.definition}}">\r\n            <button class="undecorated" ng-click="category.expanded = !category.expanded" ng-style="{color:category.color}">\r\n               <i class="fa" ng-class="{\'fa-plus\':!category.expanded, \'fa-minus\':category.expanded}"></i>\r\n            </button>\r\n            <input class="filters-check" type="checkbox" ng-model="category.selectExpand" ng-change="change()" ng-style="{color:category.color}">\r\n            <span title="{{category.definition}}">\r\n               {{category.name}}\r\n               ({{(category.allCount | number) + (category.allCount || category.allCount == 0?\' of \':\'\')}}{{category.total}})\r\n            </span>\r\n            <div ng-show="category.expanded" style="padding-left:20px">\r\n               <div ng-repeat="feature in category.features | withTotals | orderBy: \'name\'"  ng-attr-title="{{feature.definition}}">\r\n                  <i class="fa fa-hand-o-right" aria-hidden="true" ng-style="{color:feature.color}"></i>\r\n                  <input class="filters-check" type="checkbox" ng-model="feature.selected" ng-change="change()" ng-style="{color:feature.color}">\r\n                  <span>\r\n                     {{feature.name}}\r\n                     ({{(feature.allCount | number) + (feature.allCount || feature.allCount == 0?\' of \':\'\')}}{{feature.total}})\r\n                  </span>\r\n               </div>\r\n            </div>\r\n         </div>\r\n      </div>\r\n   </div>\r\n</div>');
$templateCache.put('/header/beta.html','<span title="This site is a beta site"\r\n   style="background-color: orangered; padding:4px; border-radius:3px; color:white; font-size:40%; position: relative; top: -4px;">BETA</span>');
$templateCache.put('/header/header.html','<div class="container-full common-header" style="padding-right:10px; padding-left:10px">\r\n   <div class="navbar-header">\r\n\r\n      <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".ga-header-collapse">\r\n         <span class="sr-only">Toggle navigation</span>\r\n         <span class="icon-bar"></span>\r\n         <span class="icon-bar"></span>\r\n         <span class="icon-bar"></span>\r\n      </button>\r\n\r\n      <a href="/" class="appTitle visible-xs">\r\n         <h1 style="font-size:120%">{{heading}}</h1>\r\n      </a>\r\n   </div>\r\n   <div class="navbar-collapse collapse ga-header-collapse">\r\n      <ul class="nav navbar-nav">\r\n         <li class="hidden-xs">\r\n            <a href="https://www.icsm.gov.au/" target="_blank" class="icsm-logo" style="margin-top: -4px;display:inline-block;">\r\n               <img alt="ICSM - ANZLIC Committee on Surveying &amp; Mapping" class="header-logo"\r\n                  src="placenames/resources/img/icsm-logo-sml.gif">\r\n            </a>\r\n            <a href="/" style="margin-top:8px; padding:5px;display:inline-block">\r\n               <h1 class="applicationTitle">{{heading}} <placenames-beta></placenames-beta>\r\n                  </elvis-beta>\r\n               </h1>\r\n               <h3 ng-if="subheading" class="sub-heading">{{subheading}}</h3>\r\n            </a>\r\n         </li>\r\n      </ul>\r\n      <ul class="nav navbar-nav navbar-right nav-icons">\r\n         <li placenames-navigation role="menuitem" current="current" style="padding-right:10px"></li>\r\n         <li mars-version-display role="menuitem"></li>\r\n         <li style="width:10px"></li>\r\n      </ul>\r\n   </div>\r\n   <!--/.nav-collapse -->\r\n</div>\r\n<div class="contributorsLink" style="position: absolute; right:7px; bottom:25px">\r\n   <placenames-contributors-link></placenames-contributors-link>\r\n</div>\r\n<!-- Strap -->\r\n<div class="row">\r\n   <div class="col-md-12">\r\n      <div class="strap-blue">\r\n      </div>\r\n      <div class="strap-white">\r\n      </div>\r\n      <div class="strap-red">\r\n      </div>\r\n   </div>\r\n</div>');
$templateCache.put('/help/faqs.html','<p style="text-align: left; margin: 10px; font-size: 14px;">\r\n   <strong>FAQS</strong>\r\n</p>\r\n\r\n<h5 ng-repeat="faq in faqs"><button type="button" class="undecorated" ng-click="focus(faq.key)">{{faq.question}}</button></h5>\r\n<hr/>\r\n<div class="row" ng-repeat="faq in faqs">\r\n   <div class="col-md-12">\r\n      <h5 tabindex="0" id="faqs_{{faq.key}}">{{faq.question}}</h5>\r\n      <span ng-bind-html="faq.answer"></span>\r\n      <hr/>\r\n   </div>\r\n</div>');
$templateCache.put('/help/help.html','<p style="text-align: left; margin: 10px; font-size: 14px;">\r\n\t<strong>Help</strong>\r\n</p>\r\n\r\n<div class="panel-body" ng-controller="HelpCtrl as help">\r\n\tThe steps to get data!\r\n\t<ol>\r\n\t\t<li>Define area of interest</li>\r\n\t\t<li>Select datasets</li>\r\n\t\t<li>Enter email address</li>\r\n\t\t<li>Start extract</li>\r\n\t</ol>\r\n\tAn email will be sent to you on completion of the data extract with a link to your data.\r\n   <hr>\r\n\t<placenames-faqs faqs="help.faqs" ></placenames-faqs>\r\n</div>');
$templateCache.put('/navigation/altthemes.html','<span class="altthemes-container">\r\n\t<span ng-repeat="item in themes | altthemesMatchCurrent : current">\r\n       <a title="{{item.label}}" ng-href="{{item.url}}" class="altthemesItemCompact" target="_blank">\r\n         <span class="altthemes-icon" ng-class="item.className"></span>\r\n       </a>\r\n    </li>\r\n</span>');
$templateCache.put('/pill/pill.html','<span class="btn btn-primary pn-pill" ng-style="item.color?{\'background-color\':item.color, \'padding-top\': \'3px\'}: {\'padding-top\': \'3px\'}">\r\n   <span style="max-width:100px;display:inline-block" title="{{label + item[name]}}" class="ellipsis">{{item[name]}}</span>\r\n   <span class="ellipsis" style="max-width:100px;display:inline-block">\r\n      ({{item.count?item.count:0 | number}})\r\n      <a ng-click="deselect()" href="javascript:void(0)" title="Remove from filters">\r\n         <i class="fa fa-close fa-xs" style="color: white"></i>\r\n      </a>\r\n   </span>\r\n</span>');
$templateCache.put('/quicksearch/filteredsummary.html','<span class="placenames-filtered-summary-child">\r\n   <span style="font-weight:bold; margin:5px;">\r\n      Matched {{state.persist.data.response.numFound | number}}\r\n   </span>\r\n   <span ng-if="summary.authorities.length">\r\n      <span style="font-weight:bold">| For authorities:</span>\r\n      <placenames-pill ng-repeat="item in summary.authorities" name="code" item="item" update="update()"></placenames-pill>\r\n   </span>\r\n   <span ng-if="summary.current.length">\r\n      <span style="font-weight:bold"> | Filtered by {{summary.filterBy}}:</span>\r\n      <placenames-pill ng-repeat="item in summary.current" item="item" update="update()"></placenames-pill>\r\n   </span>\r\n</span>');
$templateCache.put('/quicksearch/quicksearch.html','<div class="quickSearch" placenames-quick-search></div>\r\n');
$templateCache.put('/reset/reset.html','<button type="button" class="map-tool-toggle-btn" ng-click="reset()" title="Reset page">\r\n   <span class="hidden-sm">Reset</span>\r\n   <i class="fa fa-lg fa-refresh"></i>\r\n</button>');
$templateCache.put('/results/item.html','<div ng-mouseenter="vm.enter()" ng-mouseleave="vm.leave()">\r\n<div class="container-fluid">\r\n   <div class="row">\r\n      <div class="col-md-12 pn-header" >\r\n         <button type="button" class="undecorated" ng-click="vm.showPan(vm.item)"\r\n                tooltip-append-to-body="true" title="Zoom to location." tooltip-placement="left" uib-tooltip="Zoom to location">\r\n            <i class="fa fa-lg fa-flag-o"></i>\r\n         </button>\r\n         <span><placenames-google-anchor item="vm.item"\r\n            link-title="View in Google maps. While the location will always be correct, Google will do a best guess at matching the Gazetteer name to its data."></placenames-google-anchor></span>\r\n         <span class="pull-right">Record ID: {{vm.item.authorityId}}</span>\r\n      </div>\r\n   </div>\r\n</div>\r\n<div class="container-fluid">\r\n   <div class="row">\r\n      <div class="col-md-4"  title="An authority can be a state department or other statutory authority">Authority</div>\r\n      <div class="col-md-8">{{vm.item.authority}}</div>\r\n   </div>\r\n   <div class="row">\r\n      <div class="col-md-4" title="Features belong to a category and categories belong to a group">Feature Type</div>\r\n      <div class="col-md-8">{{vm.item.feature}}</div>\r\n   </div>\r\n   <div class="row" title="Features belong to a category and categories belong to a group">\r\n      <div class="col-md-4">Category</div>\r\n      <div class="col-md-8">{{vm.item.category}}</div>\r\n   </div>\r\n   <div class="row" title="Features belong to a category and categories belong to a group">\r\n      <div class="col-md-4">Group</div>\r\n      <div class="col-md-8">{{vm.item.group}}</div>\r\n   </div>\r\n   <div class="row">\r\n      <div class="col-md-4">Supply Date</div>\r\n      <div class="col-md-8" title="Date format is dd/mm/yyyy">{{vm.item.supplyDate | formatDate}}</div>\r\n   </div>\r\n   <div class="row">\r\n      <div class="col-md-4">Lat / Lng</div>\r\n      <div class="col-md-8">\r\n         <span class="pn-numeric">\r\n            {{vm.item.location | itemLatitude}}&deg; / {{vm.item.location | itemLongitude}}&deg;\r\n         </span>\r\n      </div>\r\n   </div>\r\n\r\n</div>');
$templateCache.put('/results/results.html','<div class="pn-results-heading" style="min-height:25px" ng-if="pr.data.searched">\r\n   <span ng-if="pr.data.searched.item">\r\n      Showing selected feature\r\n   </span>\r\n   <span ng-if="!pr.data.searched.item">\r\n      Matched {{pr.data.searched.data.response.numFound | number}} features\r\n      <span ng-if="!pr.data.searched.item && pr.data.searched.data.response.numFound > pr.data.searched.data.response.docs.length">, showing {{pr.data.searched.data.response.docs.length | number}}</span>\r\n      <a href="javascript:void()" ng-if="!pr.data.searched.item && pr.data.searched.data.response.numFound > pr.data.searched.data.response.docs.length"\r\n         ng-click="pr.more()" tooltip-placement="bottom" uib-tooltip="Scroll to the bottom of results or click here to load more matching features">\r\n         [Load more]\r\n      </a>\r\n   </span>\r\n   <span class="pull-right">\r\n      <button class="btn btn-primary" style="padding:0 10px" ng-click="pr.showDownload = !pr.showDownload">\r\n         <span ng-if="!pr.showDownload">Download...</span>\r\n         <span ng-if="pr.showDownload">Hide download details</span>\r\n      </button>\r\n      <button class="btn btn-primary" style="padding:0 10px" ng-if="!pr.data.searched.item && !pr.showDownload" ng-click="pr.clear()">\r\n         Clear results\r\n      </button>\r\n   </span>\r\n</div>\r\n<div class="panel panel-default pn-container" ng-if="pr.data.searched" common-scroller buffer="200" more="pr.more()">\r\n   <div class="panel-heading">\r\n      <placenames-search-filters ng-if="pr.data.searched"></placenames-search-filters>\r\n      <placenames-results-item ng-if="pr.data.searched.item" item="pr.data.searched.item"></placenames-results-item>\r\n      <placenames-results-download data="pr.data.searched" ng-if="!pr.data.searched.item && pr.showDownload"></placenames-results-download>\r\n      <div class="pn-results-list" ng-if="!pr.data.searched.item" ng-repeat="doc in pr.data.searched.data.response.docs">\r\n         <placenames-results-item item="doc"></placenames-results-item>\r\n      </div>\r\n   </div>\r\n</div>\r\n<div class="panel panel-default pn-container" ng-if="!pr.data.searched">\r\n   <div class="panel-heading" style="min-height:25px">\r\n      <span style="font-weight:bold">\r\n         Need help on how to search?\r\n      </span>\r\n   </div>\r\n   <div class="panel-body">\r\n      Searching is conducted on the current map view. Pan and zoom the map to your area of interest\r\n      <br/>\r\n      <br/>\r\n      <span class="padding-left:5px">You can apply filters for:</span>\r\n      <div class="well">\r\n         Features matching on partial or like name, groups, categories and features.\r\n         <br/> You can restrict results to only authorities of interest.\r\n         <br/>\r\n         <br/> Once you have zoomed, panned and filtered to your desired results hit the search button to list details with the\r\n         option to download in a variety of projections and formats.\r\n         <br/>\r\n         <br/>\r\n         <b title="nota bene">NB</b> Name searching is done on "fuzzy" searching which means it isn\'t always an exact match but a match something\r\n         like what is typed.\r\n\r\n      </div>\r\n      <div>\r\n         If you are interested in features in the Antarctic consider using the\r\n         <a href="antarctic.html">search specific to the polar view</a>\r\n      </div>\r\n   </div>\r\n</div>');
$templateCache.put('/results/summary.html','<span class="placenamesSearchSummary"\r\n      ng-if="state.searched.data.response.numFound">(Found {{state.searched.data.response.numFound | number}} features)</span>');
$templateCache.put('/search/quicksearch.html','<div class="search-text">\r\n   <div class="input-group input-group-sm">\r\n      <input type="text" ng-model="state.filter" placeholder="Match by feature name..." placenames-on-enter="search()"\r\n         ng-model-options="{ debounce: 300}" typeahead-on-select="select($item, $model, $label)" typeahead-focus-first="false"\r\n         ng-disabled="state.searched" typeahead-template-url="/search/typeahead.html" class="form-control" typeahead-min-length="0"\r\n         uib-typeahead="doc as doc.name for doc in loadDocs(state.filter)" typeahead-loading="loadingLocations" typeahead-no-results="noResults"\r\n         placenames-clear>\r\n\r\n      <span class="input-group-btn">\r\n         <button class="btn btn-primary" type="button" ng-click="erase()" title="Clear typed text"\r\n            ng-hide="state.searched" id="placenamesEraseBtn">X</button>\r\n         <button class="btn btn-primary" type="button" ng-click="search()" title="Search for all features matching your search criteria"\r\n            ng-hide="state.searched" id="placenamesSearchBtn">Search</button>\r\n         <button class="btn btn-primary" type="button" ng-click="showFilters = !showFilters" ng-hide="state.searched" title="SHow/hide filters such as authority, group, category and feature type">Filters...</button>\r\n         <button class="btn btn-primary" title="Clear the current search and enable discovery" type="button" ng-click="clear()" ng-show="state.searched">Clear Search Results</button>\r\n      </span>\r\n   </div>\r\n</div>\r\n<div class="filters" ng-show="showFilters" style="background-color: white">\r\n   <div class="panel panel-default" style="margin-bottom:5px">\r\n      <div class="panel-heading">\r\n         <h4 class="panel-title">\r\n            Filter\r\n            <span ng-if="summary.current.length">ing</span> by groups/categories/features...\r\n         </h4>\r\n      </div>\r\n   </div>\r\n   <placenames-tree></placenames-tree>\r\n   <div class="panel panel-default" style="margin-bottom:5px">\r\n      <div class="panel-heading">\r\n         <h4 class="panel-title">\r\n            Filter\r\n            <span ng-if="summary.authorities.length">ing</span> by authority...\r\n         </h4>\r\n      </div>\r\n      <div style="max-height: 200px; overflow-y: auto; padding:5px">\r\n         <placenames-authorities update="update()"></placenames-authorities>\r\n      </div>\r\n   </div>\r\n</div>');
$templateCache.put('/search/search.html','<placenames-results data="state"></placenames-results>\r\n');
$templateCache.put('/search/searchfilters.html','<div style="padding-top:5px; padding-bottom:5px">\r\n   <span ng-if="data.filter && !data.filter.location">Matching names like "{{summary.filter}}"</span>\r\n   <span ng-if="summary.current.length">Filtered by: {{summary.current | quicksummary : "name" }}</span>\r\n   <span ng-if="summary.authorities.length">For authorities: {{summary.authorities | quicksummary : "code"}}</span>\r\n</div>');
$templateCache.put('/search/typeahead.html','<a placenames-options ng-mouseenter="enter()" ng-mouseleave="leave()"  tooltip-append-to-body="true"\r\n               tooltip-placement="bottom" uib-tooltip-html="match.model | placenamesTooltip">\r\n   <span ng-bind-html="match.model.name | uibTypeaheadHighlight:query"></span>\r\n   (<span ng-bind-html="match.model.authorityId"></span>)\r\n</a>');
$templateCache.put('/side-panel/trigger.html','<button ng-click="toggle()" type="button" class="map-tool-toggle-btn">\r\n   <span class="hidden-sm">{{name}}</span>\r\n   <ng-transclude></ng-transclude>\r\n   <i class="fa fa-lg" ng-class="iconClass"></i>\r\n</button>');
$templateCache.put('/specification/specification.html','<button type="button" class="map-tool-toggle-btn" ng-click="openSpec()" title="View data product specification (opens new page)">\r\n      <span class="hidden-sm">Data Product Specification</span>\r\n      <i class="fa fa-lg fa-book"></i>\r\n   </button>');}]);