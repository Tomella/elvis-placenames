{
   angular.module('placenames.themes', [])

      .directive('placenamesThemes', ['placenamesService', function (themesService) {
         return {
            restrict: 'AE',
            templateUrl: 'placenames/themes/themes.html',
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

      .controller('themesCtrl', ['themesService', function (themesService) {
         this.service = themesService;
      }])

      .filter('themesFilter', function () {
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
      })

      .factory('themesService', ['$q', 'configService', 'storageService', function ($q, configService, storageService) {
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