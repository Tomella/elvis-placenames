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
               link: function (scope) {
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
         }])

         .controller('altthemesCtrl', ['altthemesService', function (altthemesService) {
            this.service = altthemesService;
         }])

         .filter('altthemesFilter', function () {
            return function (features, theme) {
               let response = [];
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
         })

         .factory('altthemesService', ['$q', '$http', 'storageService', function ($q, $http, storageService) {
            let THEME_PERSIST_KEY = 'placenames.current.theme';
            let THEMES_LOCATION = 'placenames/resources/config/themes.json';
            let DEFAULT_THEME = "All";
            let waiting = [];
            let self = this;

            this.themes = [];
            this.theme = null;

            storageService.getItem(THEME_PERSIST_KEY).then(function (value) {
               if (!value) {
                  value = DEFAULT_THEME;
               }
               $http.get(THEMES_LOCATION, { cache: true }).then(function (response) {
                  let themes = response.data.themes;

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
                  let waiter = $q.defer();
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
         }])

         .filter('altthemesEnabled', function () {
            return function (headers) {
               if (headers) {
                  return headers.filter(function (value) {
                     return !!value.enabled;
                  });
               }
               return headers;
            };
         })

         .filter('altthemesMatchCurrent', function () {
            return function (headers, current) {
               if (headers) {
                  return headers.filter(function (value) {
                     return !!value.keys.find(key => key === current);
                  });
               }
               return headers;
            };
         });

   }