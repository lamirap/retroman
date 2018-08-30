'use strict';

angular.module('retroman')
 .controller('AdminController', function ($scope, $rootScope, $timeout, $location, $mdDialog, retrodb) {
    $scope.retroList = [];
    $scope.currentUID = null;
    $scope.retroTypes = [];
    $scope.alertmessages = [];

    $scope.getRetros = function() {
      
      var userId = firebase.auth().currentUser.uid;
      //console.debug(userId);
      
      var userRetrosRef = firebase.database().ref('/user-retros/' + userId + '/');
      
      userRetrosRef.on('child_added', function(data) {
        //console.debug('Child added ', data);
        var retro = {};

        retro.name = data.val().name;
        retro.retroId = data.val().retroId;
        retro.retroTypeId = data.val().retroTypeId;
        retro.retroKey = data.key;
        
        $timeout(function() {
          $scope.retroList.unshift(retro);
        }, 0);

      });
      
      userRetrosRef.on('child_removed', function(data) {
        //console.debug('Child removed ', data);
        for(var i = 0; i < $scope.retroList.length; i += 1) {
          if($scope.retroList[i].retroKey === data.key) {
            $timeout(function() {        
              $scope.retroList.splice(i, 1);
            }, 0);
            return;
          }
        }
      });
      
    }

    $scope.getRetroTypes = function() {    
      retrodb.getRetroTypes(function(retroType) {
        //console.log("New retro type called", retroType);
        $timeout(function() {
          $scope.retroTypes.unshift(retroType);
          console.log(retroType);
        }, 0);
      });
    }

    $scope.addRetroClicked = function() {
      console.debug('Add retro clicked');
      if (firebase.auth().currentUser.isAnonymous) {
        console.debug('Anonymous cannot add retro');
        return;
      }
      
      $scope.showAddRetro = true;
      $scope.showRetroList = false;
    }
        
    $scope.createRetro = function() {
      console.debug('Create retro');
      var retroId = saveNewRetro(firebase.auth().currentUser.uid, $scope.retroName, $scope.selectedRetroType);
      $scope.showAddRetro = false;
      $scope.showRetroList = true;
      $scope.retroName = "";
      
      $scope.alertmessages.unshift({content: "Retro created successfully", type: "success"});
      
      $timeout(function() {
        $scope.alertmessages = [];
      }, 3000);
    }
    
    $scope.getRetroTypeName = function(retroTypeId) {
      for(var i = 0; i < $scope.retroTypes.length; i += 1) {
        if($scope.retroTypes[i].retroTypeId === retroTypeId) {
            return $scope.retroTypes[i].name;
        }
      }  
      return "Unknown";
    }
    
    function saveNewRetro(userId, name, retroTypeId) {
      // Get a key for a new Post.
      var retro = {};

      retro.name = name;
      retro.retroId = Math.random().toString(36).substr(2, 6);
      retro.uid = userId;
      retro.retroTypeId = retroTypeId;
      
      retro.newRetroKey = firebase.database().ref().child('/retros/' + retro.retroId + '/').push().key;
            
      // Write the new post's data simultaneously in the posts list and the user's post list.
      var updates = {};
      updates['/retros/' + retro.retroId] = retro;
      updates['/user-retros/' + userId + '/' + retro.newRetroKey] = retro;

      firebase.database().ref().update(updates);
      
      return retro.retroId;
    }
  
    $scope.deleteRetroClicked = function(retro) {
      console.debug("Deleting retro now");
      retrodb.deleteRetro(retro);      
      
      $scope.alertmessages.unshift({content: "Retro deleted", type: "danger"});
      
      $timeout(function() {
        $scope.alertmessages = [];
      }, 3000);

    }

    $scope.backClicked = function() {
      $scope.showAddRetro = false;
      $scope.showRetroList = true;
    }
    
    $scope.init = function() {
      console.debug("Initialized AdminController");
      $scope.showAddRetro = false;
      $scope.showRetroList = true;
    }
    
    $scope.init();
    
    $scope.onAuthStateChanged = function(user) {
      console.debug('Admin auth state changed');
      // We ignore token refresh events.
      if (user && $scope.currentUID === user.uid) {
        return;
      }
      
      if (user) {
        $scope.currentUID = user.uid;
        $rootScope.showAdmin = !user.isAnonymous;
        
        if (user.isAnonymous) {
          $mdDialog.show(
            $mdDialog.alert()
              .clickOutsideToClose(true)
              .title('Sign-in')
              .textContent('Login to create new retro')
              .ariaLabel('Login')
              .ok('Got it!')
          ).then(function() {
            $timeout(function() {
              $location.path("/home");
            }, 0);      
          });
        } else {
          $scope.getRetros();
          $scope.getRetroTypes();
        }
      } else {
        // Set currentUID to null.
        $scope.currentUID = null;
        
        $timeout(function() {
          $location.path("/login");
        }, 0);      
      }
    }    

    var unsubscribe = firebase.auth().onAuthStateChanged($scope.onAuthStateChanged);  

    $scope.$on("$destroy", function handler() {
      unsubscribe();
    });
 });