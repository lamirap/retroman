'use strict';

angular.module('retroman')
 .controller('LoginController', function ($scope, $rootScope, $location, $timeout) {
        $scope.signInClicked = function() {
          var provider = new firebase.auth.GoogleAuthProvider();
          firebase.auth().signInWithPopup(provider);
        }
                
        $scope.anonSignInClicked = function() {
          console.log('Anon sign-in clicked');
          firebase.auth().signInAnonymously().catch(function(error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            
            console.log(errorMessage);
            // ...
          });
        }

        $scope.onAuthStateChangedLogin = function(user) { 
          console.log('Auth state changed login');
          //console.log(user);

          if (user) {
            $rootScope.showAdmin = !user.isAnonymous;
            
            if (user.isAnonymous) {
              $timeout(function() {
                $location.path( "/home" );  
              }, 0);            
            } else {
              $timeout(function() {
                $location.path( "/admin" );
              }, 0); 
            }
          } else {
            //console.log('Redirecting to login');
            $timeout(function() {
              $location.path("/login"); 
            }, 0); 
          }
        }
        
        $scope.init = function() {
            console.log("Initialized LoginController");
            // Listen for auth state changes
            firebase.auth().onAuthStateChanged($scope.onAuthStateChangedLogin);
        }
        
        $scope.init();
 });