angular.module('retroman')
 .controller('AdminController', function ($scope, $timeout, $location, $mdDialog) {
    $scope.retroList = []
    var currentUID;

    $scope.getRetros = function() {
      var userId = firebase.auth().currentUser.uid;
      console.log(userId);
      
      firebase.database().ref('/user-retros/' + userId + '/').once('value').then(function(snapshot) {
        snapshot.forEach(function(childSnap) {
          var retro = {};
          
          retro.name = childSnap.val().name;
          retro.retroId = childSnap.val().retroId;
          retro.retroKey = childSnap.key;
          
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
      var retro = {};

      retro.name = name;
      retro.retroId = Math.random().toString(36).substr(2, 6);
      retro.uid = userId;
      
      retro.newRetroKey = firebase.database().ref().child('/retros/' + retro.retroId + '/').push().key;
      
      $scope.retroList.push(retro);
      
      // Write the new post's data simultaneously in the posts list and the user's post list.
      var updates = {};
      updates['/retros/' + retro.retroId] = retro;
      updates['/user-retros/' + userId + '/' + retro.newRetroKey] = retro;

      firebase.database().ref().update(updates);
      
      return retro.retroId;
    }
  
    $scope.deleteRetroClicked = function(retro) {
      console.log('Deleting retro');
      var userId = firebase.auth().currentUser.uid;
      firebase.database().ref('/retros/' + retro.retroId).remove();
      //console.log('/retros/' + userId + '/' + retro.retroKey);
      
      for(var i = 0; i < $scope.retroList.length; i += 1) {
        if($scope.retroList[i].retroId === retro.retroId) {
          $timeout(function() {        
            $scope.retroList.splice(i, 1);
          }, 0);
          break;
        }
      }

      firebase.database().ref('/user-retros/' + userId + '/' + retro.retroKey).remove();
      
      //Remove posts from deleted retro also
      
      firebase.database().ref('/posts/' + retro.retroId + '/').remove();
      var allUsers = firebase.database().ref('/users');
      
      allUsers.once('value', function(snap) { 
        
        snap.forEach(function(childSnap) {
          //console.log(childSnap.val());
          firebase.database().ref('/user-posts/' + retro.retroId + '/').remove();
        });
      });
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