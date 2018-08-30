'use strict';

angular.module('retroman')
  .directive('alertNotifications', function($timeout){
    return {
      restrict: 'E',
      template: '<div class="alert alert-{{ alertmsg.type }}" role="alert"> {{ alertmsg.content }} </div>',
      link: function(scope, element, attrs) {
        //console.log("Alert notification linked");
      },
      controller: function($scope) {
      }
    }
  });
  