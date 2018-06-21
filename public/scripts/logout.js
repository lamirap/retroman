'use strict';

angular.module('retroman')
 .controller('LogoutController', function ($scope, $location) {
   console.debug('Logout');
   firebase.auth().signOut();
   $location.path('/login');
 });