'use strict';

angular.module('retroman')
 .controller('LogoutController', function ($scope, $location) {
   console.log('Logout');
   firebase.auth().signOut();
   $location.path('/login');
 });