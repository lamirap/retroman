'use strict';

var myAPP = angular.module('retroman', [ 'ngRoute', 'ngMaterial' ]);

myAPP.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.
        when('/home', {
            templateUrl: 'html/home.html',
            controller: 'HomeController'
        }).
        when('/home/:retroId', {
            templateUrl: 'html/home.html',
            controller: 'HomeController'
        }).
        when('/login', {
            templateUrl: 'html/login.html',
            controller: 'LoginController'
        }).
        when('/admin', {
            templateUrl: 'html/admin.html',
            controller: 'AdminController'
        }).
        when('/not-found', {
            templateUrl: 'html/404.html'
        }).
        otherwise({
            redirectTo: '/home'
        });
}]);

// Bind Sign out button.
function signOutClicked() {
  console.log('Signout clicked');
  firebase.auth().signOut();
};