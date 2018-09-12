'use strict';

angular.module('retroman')
 .controller('LogoutController', function ($scope, $rootScope, $location) {
     $rootScope.showAdmin = false;
     console.debug('Logout');
     firebase.auth().signOut();
     $location.path('/login');
 });