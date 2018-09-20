'use strict';

angular.module('retroman')
 .controller('LoginController', function ($scope, $rootScope, $location, $timeout) {
        $scope.signInClicked = function() {
          var provider = new firebase.auth.GoogleAuthProvider();
          firebase.auth().signInWithPopup(provider);
        }
                
        $scope.anonSignInClicked = function() {
          console.debug('Anon sign-in clicked');
          firebase.auth().signInAnonymously().catch(function(error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            
            console.debug(errorMessage);
            // ...
          });
        }

        $scope.onAuthStateChangedLogin = function(user) { 
          console.debug('Login Auth state changed login');
          console.debug(user);

          if (user) {
            $rootScope.showAdmin = !user.isAnonymous;
            console.log($rootScope.referrer);
            $timeout(function() {
              if ($rootScope.referrer) {
                $location.path( $rootScope.referrer );  
              } else {
                if (user.isAnonymous) {
                  $location.path( '/home' ); 
                } else {
                  $location.path( '/admin' );                   
                }                 
              }
            }, 0);            
          } else {
            //console.debug('Redirecting to login');
            $timeout(function() {
              $location.path("/login"); 
            }, 0);
            //$scope.anonSignInClicked(); 
          }
        }
        
        $scope.init = function() {
            console.debug("Initialized LoginController");
            // Listen for auth state changes
        }
        
        $scope.init();
        
        var unsubscribe = firebase.auth().onAuthStateChanged($scope.onAuthStateChangedLogin);
        
        $scope.$on("$destroy", function handler() {
          unsubscribe();
        });
 });