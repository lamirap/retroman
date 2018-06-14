angular.module('retroman')
 .controller('LoginController', function ($scope, $location) {
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
            //console.log('Redirecting to home');
            $location.path( "/home" );
            $scope.$apply();
          } else {
            //console.log('Redirecting to login');
            $location.path("/login");
            $scope.$apply();
          }
        }
        
        $scope.init = function() {
            console.log("Initialized LoginController");
            // Listen for auth state changes
            firebase.auth().onAuthStateChanged($scope.onAuthStateChangedLogin);
        }
        
        $scope.init();
 });