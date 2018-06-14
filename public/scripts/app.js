'use strict';

var myAPP = angular.module('retroman', [ 'ngRoute' ]);

myAPP.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.
        when('/home', {
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
        otherwise({
            redirectTo: '/login'
        });
}]);

// Bind Sign out button.
function signOutClicked() {
  console.log('Signout clicked');
  firebase.auth().signOut();
};