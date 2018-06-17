angular.module('retroman')
 .controller('AdminController', function ($scope, $timeout, $location) {
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
      saveNewRetro(firebase.auth().currentUser.uid, $scope.retroName);
      $scope.showAddRetro = false;
      $scope.showRetroList = true;
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

      return firebase.database().ref().update(updates);
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
        $location.path("/login");
        $scope.$apply();
      }
    }

    firebase.auth().onAuthStateChanged(onAuthStateChanged);  
 });