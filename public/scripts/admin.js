angular.module('retroman')
 .controller('AdminController', function ($scope, $timeout, $location, $mdDialog) {
    $scope.retroList = []
    var currentUID;

    $scope.getRetros = function() {
      var userId = firebase.auth().currentUser.uid;
      console.log(userId);
      
      firebase.database().ref('/retros/' + userId + '/').once('value').then(function(snapshot) {
        snapshot.forEach(function(childSnap) {
          var retro = {};
          
          retro.name = childSnap.val().name;
          retro.retroId = childSnap.val().retroId;
          
          $timeout(function() {
            $scope.retroList.unshift(retro);
          }, 0);          
        });
      });
    }

    $scope.addRetroClicked = function() {
      console.log('Add retro clicked');
      $scope.showAddRetro = true;
      $scope.showRetroList = false;
    }
        
    $scope.createRetro = function() {
      console.log('Create retro');
      var retroId = saveNewRetro(firebase.auth().currentUser.uid, $scope.retroName);
      $scope.showAddRetro = false;
      $scope.showRetroList = true;
      
      console.log('Showing dialog');
      
      $mdDialog.show(
        $mdDialog.confirm()
          .clickOutsideToClose(true)
          .title('Retro created successfully')
          .textContent('New retroId - ' + retroId)
          .ariaLabel('Success')
          .ok('Got it!')
          .cancel('Go to new retro')
      ).then(function() {
        console.log('Back to admin screen');
      }, function() {
        console.log('Go to retro page' + "/#!/home/" + retroId);
        
        $timeout(function() {
          $location.path('/home/' + retroId);
        }, 0);      
      });
    }
    
    function saveNewRetro(userId, name) {
      // Get a key for a new Post.
      var newRetroKey = firebase.database().ref().child('/retros/' + userId + '/').push().key;
      var retro = {};

      retro.name = name;
      retro.retroId = Math.random().toString(36).substr(2, 6);
      retro.uid = userId;
      
      $scope.retroList.push(retro);
      
      // Write the new post's data simultaneously in the posts list and the user's post list.
      var updates = {};
      updates['/retros/' + userId + '/' + newRetroKey] = retro;

      firebase.database().ref().update(updates);
      
      return retro.retroId;
    }
  
    
    $scope.init = function() {
      console.log("Initialized AdminController");
      $scope.showAddRetro = false;
      $scope.showRetroList = true;
    }
    
    $scope.init();
    
    function onAuthStateChanged(user) {
      // We ignore token refresh events.
      if (user && currentUID === user.uid) {
        return;
      }
      if (user) {
        currentUID = user.uid;
        $scope.getRetros();
      } else {
        // Set currentUID to null.
        currentUID = null;
        
        $timeout(function() {
          $location.path("/login");
        }, 0);      
      }
    }

    firebase.auth().onAuthStateChanged(onAuthStateChanged);  
 });