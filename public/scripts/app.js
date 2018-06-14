'use strict';

var myAPP = angular.module('retroman', [ 'ngRoute' ]);

myAPP.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.
        when('/home', {
            templateUrl: 'home.html',
            controller: 'HomeController'
        }).
        when('/login', {
            templateUrl: 'login.html',
            controller: 'LoginController'
        }).
        when('/admin', {
            templateUrl: 'admin.html',
            controller: 'AdminController'
        }).
        otherwise({
            redirectTo: '/login'
        });
}]);

// Bind Sign out button.
function signOutClicked() {
  console.log('Signout clicked');
  firebase.auth().signOut();
};