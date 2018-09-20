'use strict';

angular.module('retroman')
  .controller('HomeController', function ($scope, $rootScope, $location, $timeout, $routeParams, retrodb) {
  
    $scope.retroId = 0;
    $scope.retroTypes = [];
    $scope.sortBy = "0";
    
    retrodb.getRetroTypes(function(retroType) {
      //console.log("New retro type called", retroType);
      $timeout(function() {
        $scope.retroTypes.unshift(retroType);
      }, 0);
    });
    
    $scope.$on('$routeChangeSuccess', function() {
      $scope.retroId = $routeParams.retroId;
      //console.debug($scope.retroId);
      
      if (!$scope.retroId) {

        $timeout(function() {
            $scope.showRetroSelector = true;
            $scope.showRecentPosts = false;
        }, 0);

      } else {
        firebase.database().ref('/retros/' + $scope.retroId).once('value').then(function(snapshot) {
          if (!snapshot.exists()) {

              $timeout(function() {
                  $('#RetroNotFoundModal').modal('show');
                  $scope.showRetroSelector = true;
                  $scope.showRecentPosts = false;
              }, 0);
              
          } else {
            console.debug('Retro found', snapshot.val().name, snapshot.val().retroTypeId);
            $timeout(function() {
              $scope.retroName = snapshot.val().name;
              var retroTypeId = snapshot.val().retroTypeId;
              
              for(var i = 0; i < $scope.retroTypes.length; i += 1) {
                if($scope.retroTypes[i].retroTypeId === retroTypeId) {
                    $scope.currentRetroType = $scope.retroTypes[i];
                    break;
                }
              }
            }, 0);
          }
        }, function(error) {
          // The Promise was rejected.
          console.error(error);
        });
      }
      
    });
    
  
    var currentUID;
    var post = {}
    
    // Shortcuts to DOM Elements.
    $scope.splashPage = angular.element('#page-splash');
    $scope.listeningFirebaseRefs = [];

    $scope.showAddPost = false;
    $scope.showRecentPosts = true;
    
    $scope.postList = [];
    

    /**
     * Starts listening for new posts and populates posts lists.
     */
    function startDatabaseQueries() {
                  
      var recentPostsRef;
      
      recentPostsRef = firebase.database().ref('/posts/' + $scope.retroId +'/').orderByChild('date').limitToLast(100);
      //recentPostsRef = firebase.database().ref('/posts/' + $scope.retroId +'/').orderByChild('starCount').limitToLast(100);
      
      // Fetching and displaying all posts of each sections.
      recentPostsRef.on('child_added', function(data) {
        //console.debug('Child added');

        var uid = firebase.auth().currentUser.uid;
        var post = {}
        post.username = data.val().author || 'Anonymous';
        post.avatarURL = data.val().authorPic || '/images/silhouette.jpg';
        post.starred = data.val().starred;
        post.starCount = data.val().starCount;
        post.text = data.val().body;
        post.type = data.val().type;
        post.postId = data.key;
        post.authorId = data.val().uid;
        post.date = data.val().date;
        
        
        var starCountRef = firebase.database().ref('/posts/' + $scope.retroId +'/' + post.postId + '/starCount');
        starCountRef.on('value', function(snapshot) {
          post.starCount = snapshot.val();
        });
        
        var starredStatusRef = firebase.database().ref('/posts/' + $scope.retroId +'/' + post.postId + '/stars/' + uid)
        starredStatusRef.on('value', function(snapshot) {
            post.starred = false;
            if (snapshot.val()) { 
              post.starred = true;
            }
        });

        $scope.listeningFirebaseRefs.push(starCountRef);
        $scope.listeningFirebaseRefs.push(starredStatusRef);

        // Bind starring action.
        $scope.onStarClicked = function(post) {
          console.debug('Star clicked');
          retrodb.toggleStar($scope.retroId, post);
        };
        
        if ($scope.sortBy == "0") {
            $timeout(function() {        
              $scope.postList.unshift(post);
            }, 0);
        } else {
            console.log("Sorted by votes");
            $timeout(function() {       
              if ($scope.postList.length == 0) {
                $scope.postList.unshift(post);
              } else {
                for (var i = 0; i < $scope.postList.length; i += 1) {
                  if($scope.postList[i].starCount < post.starCount) {
                    //console.log("Inserting at ", i);
                    $scope.postList.splice(i, 0, post);
                    return;
                  }
                }
                $scope.postList.push(post);
              }
            }, 0);
        }
        //console.debug(post);        
      });
      
      recentPostsRef.on('child_changed', function(data) {	
        //console.debug('Child changed');
        
        var postIndex = $scope.postList.findIndex(x => x.postId == data.key);
        
        //console.debug(postIndex);
        $timeout(function() {
          $scope.postList[postIndex].username = data.val().author || 'Anonymous';
          $scope.postList[postIndex].text = data.val().body;
          //$scope.postList[postIndex].starred = data.val().starred;
          $scope.postList[postIndex].starCount = data.val().starCount;
          
          if ($scope.sortBy == "1") {
            $scope.postList.sort((a,b) => (a.starCount > b.starCount) ? -1 : ((b.starCount > a.starCount) ? 1 : 0)); 
          } 
        }, 0);        
      });
      
      recentPostsRef.on('child_removed', function(data) {
        //console.debug('Child removed');
        for(var i = 0; i < $scope.postList.length; i += 1) {
          if($scope.postList[i].postId === data.key) {
            $timeout(function() {        
              $scope.postList.splice(i, 1);
            }, 0);
            return;
          }
        }
      });
      // Keep track of all Firebase refs we are listening to.
      $scope.listeningFirebaseRefs.push(recentPostsRef);
    }

    /**
     * Cleanups the UI and removes all Firebase listeners.
     */
    function cleanupUi() {
      // Remove all previously displayed posts.
      
      //console.debug('UI cleanup');
      $scope.postList = []
      
      // Stop all currently listening Firebase listeners.
      $scope.listeningFirebaseRefs.forEach(function(ref) {
        ref.off();
      });
      $scope.listeningFirebaseRefs = [];
    }

    $scope.sortByChanged = function(newValue) {
      $scope.sortBy = newValue;
      
      console.log("SortBy changed");
      $scope.postList = []
      
      $scope.listeningFirebaseRefs.forEach(function(ref) {
        ref.off();
      });
      $scope.listeningFirebaseRefs = [];

      startDatabaseQueries();
     }

    /**
     * Triggers every time there is a change in the Firebase auth state (i.e. user signed-in or user signed out).
     */
    function onAuthStateChanged(user) {
      
      //console.debug(user);
      
      // We ignore token refresh events.
      if (user && currentUID === user.uid) {
        return;
      }

      //console.debug('Auth state changed');
      
      cleanupUi();
      if (user) {
        $rootScope.showAdmin = !user.isAnonymous;
        currentUID = user.uid;
        $scope.splashPage.hide();
        retrodb.writeUserData(user.uid, user.displayName, user.email, user.photoURL, user.isAnonymous);        
        startDatabaseQueries();
      } else {
        // Set currentUID to null.
        currentUID = null;
        $rootScope.referrer = $location.path();
        // Display the splash page where you can sign-in.
        //console.debug('Redirecting to login');
        $location.path("/login");
        $scope.$apply();
      }
    }

     // Saves message on form submit.
     $scope.formSubmit = function() {
       var text = $scope.messageInput;
       var type = $scope.typeInput;
       
       console.debug('Post added ' + text);
       //console.debug(type);
       
       if (text) {
         retrodb.newPostForCurrentUser(text, type, $scope.retroId).then(function() {
           console.debug('Post add complete');
           $timeout(function() {
             $scope.showAddPost = false;
             $scope.showRecentPosts = true;
           });
         });
         $scope.messageInput = '';
       }
     }
     
     // Saves message on form submit.
     $scope.backClicked = function() {
       $scope.showAddPost = false;
       $scope.showRecentPosts = true;
     }
     
     $scope.addPostClicked = function(id) {
       console.debug('Post  adding');
       
       $scope.showAddPost = true;
       $scope.showRecentPosts = false;
       
       $scope.messageInput = '';
       $scope.typeInput = id;
     };

     $scope.retroIdSubmit = function() {
       
       $timeout(function() {
         $scope.showRetroSelector = false;
         $scope.showRecentPosts = true;
         $location.path("/home/" + $scope.retroIdInput);
       }, 0);
     };
     
     $scope.deletePostClicked = function(post, retroId) {
       retrodb.deletePost(post, retroId);
     };
     
     var unsubscribe = firebase.auth().onAuthStateChanged(onAuthStateChanged);  

     $scope.$on("$destroy", function handler() {
       unsubscribe();
     });
  });
  
  
