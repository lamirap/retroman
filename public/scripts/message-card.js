'use strict';

angular.module('retroman')
  .directive("messageCard", function() {
    return {
        restrict: 'E',
        templateUrl: 'html/message-card.html',
        controller: function($scope) {
          //console.debug($scope.retro);          
        }
    };
});