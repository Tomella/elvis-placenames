{

   angular.module("placenames.storage", [])

      .factory("storageService", ['$log', '$q', function ($log, $q) {
         let project = "elvis.placenames";
         return {
            setGlobalItem: function (key, value) {
               this._setItem("_system", key, value);
            },

            setItem: function (key, value) {
               this._setItem(project, key, value);
            },

            _setItem: function (project, key, value) {
               $log.debug("Fetching state for key locally" + key);
               localStorage.setItem(project + "." + key, JSON.stringify(value));
            },

            getGlobalItem: function (key) {
               return this._getItem("_system", key);
            },

            getItem: function (key) {
               let deferred = $q.defer();
               this._getItem(project, key).then(function (response) {
                  deferred.resolve(response);
               });
               return deferred.promise;
            },

            _getItem: function (project, key) {
               $log.debug("Fetching state locally for key " + key);
               let item = localStorage.getItem(project + "." + key);
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
