'use strict';

angular.module('retroman')
  .controller('HomeController', function ($scope, $rootScope, $location, $timeout, $routeParams, $mdDialog) {
  
    $scope.retroId = 0;
    
    $scope.$on('$routeChangeSuccess', function() {
      $scope.retroId = $routeParams.retroId;

      //console.debug($routeParams);
      
      console.debug($scope.retroId);
      
      if (!$scope.retroId) {
        $timeout(function() {
          $scope.showRetroSelector = true;
          $scope.showRecentPosts = false;
        }, 0);
      } else {
        firebase.database().ref('/retros/' + $scope.retroId).once('value').then(function(snapshot) {
          if (!snapshot.exists()) {
            $mdDialog.show(
              $mdDialog.alert()
                .clickOutsideToClose(true)
                .title('Retro not found')
                .textContent('No such retro with retroId - ' + $scope.retroId)
                .ariaLabel('Not found')
                .ok('Got it!')
            ).then(function() {
              $timeout(function() {
                $scope.showRetroSelector = true;
                $scope.showRecentPosts = false;
              }, 0);
            });
          } else {
            console.debug('Retro found' + snapshot.val().name);
            $timeout(function() {
              $scope.retroName = snapshot.val().name;
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
    $scope.recentPostsSection = angular.element('#recent-posts-list');
    $scope.listeningFirebaseRefs = [];

    $scope.showAddPost = false;
    $scope.showRecentPosts = true;
    
    $scope.postList = [];
    

    /**
     * Starts listening for new posts and populates posts lists.
     */
    $scope.startDatabaseQueries = function() {
      // [START recent_posts_query]
      var recentPostsRef = firebase.database().ref('/posts/' + $scope.retroId +'/').orderByChild('date').limitToLast(100);
      // [END recent_posts_query]

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
          var globalPostRef = firebase.database().ref('/posts/' + $scope.retroId +'/' + post.postId);
          var userPostRef = firebase.database().ref('/user-posts/' + $scope.retroId +'/' + post.authorId + '/' + post.postId);
          toggleStar(globalPostRef, uid);
          toggleStar(userPostRef, uid);
        };
        
        $timeout(function() {
          $scope.postList.unshift(post);
        }, 0);
        //console.debug(post);
        
        $(".post-" + post.postId).hide().delay().fadeIn(2000);      
        //console.debug(".post-" + post.postId);
        //console.debug($(".post-" + post.postId).html());
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
     * Saves a new post to the Firebase DB.
     */
    // [START write_fan_out]
    function writeNewPost(uid, username, picture, body, type, retroId) {
      // A post entry.
      var postData = {
        author: username,
        uid: uid,
        body: body,
        type: type,
        starCount: 0,
        authorPic: picture,
        date: Date.now()
      };

      //console.debug(postData);
      
      // Get a key for a new Post.
      var newPostKey = firebase.database().ref().child('/posts/' + retroId +'/').push().key;

      // Write the new post's data simultaneously in the posts list and the user's post list.
      var updates = {};
      updates['/posts/' + retroId +'/' + newPostKey] = postData;
      updates['/user-posts/' + retroId +'/' + uid + '/' + newPostKey] = postData;

      //console.debug(updates);
      
      return firebase.database().ref().update(updates);
    }
    // [END write_fan_out]

    /**
     * Star/unstar post.
     */
    // [START post_stars_transaction]
    function toggleStar(postRef, uid) {
      postRef.transaction(function(post) {
        //console.debug(post);
        if (post) {
          if (post.stars && post.stars[uid]) {
            post.starCount--;
            post.stars[uid] = null;
          } else {
            post.starCount++;
            if (!post.stars) {
              post.stars = {};
            }
            post.stars[uid] = true;
          }
        }
        return post;
      });
    }
    // [END post_stars_transaction]

    /**
     * Writes the user's data to the database.
     */
    // [START basic_write]
    function writeUserData(userId, name, email, imageUrl, isAnonymous) {
      //console.debug('Adding user');
      firebase.database().ref('users/' + userId).set({
        username: name,
        email: email,
        profile_picture : imageUrl,
        userId : userId,
        isAnonymous : isAnonymous
      });
    }
    // [END basic_write]

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
        writeUserData(user.uid, user.displayName, user.email, user.photoURL, user.isAnonymous);
        $scope.startDatabaseQueries();
      } else {
        // Set currentUID to null.
        currentUID = null;
        // Display the splash page where you can sign-in.
        //console.debug('Redirecting to login');
        $location.path("/login");
        $scope.$apply();
      }
    }

    /**
     * Creates a new post for the current user.
     */
    function newPostForCurrentUser(text, type, retroId) {
      var userId = firebase.auth().currentUser.uid;
      console.debug(userId);
      console.debug("New post");
      console.debug('users/' + userId);
      
      return firebase.database().ref('users/' + userId).once('value').then(function(snapshot) {
        console.debug(snapshot.val());
        var username = (snapshot.val() && snapshot.val().username) || 'Anonymous';
        return writeNewPost(firebase.auth().currentUser.uid, username,
            firebase.auth().currentUser.photoURL,
            text, type, retroId);
      });
    }

     // Saves message on form submit.
     $scope.formSubmit = function() {
       var text = $scope.messageInput;
       var type = $scope.typeInput;
       
       console.debug('Post added ' + text);
       //console.debug(type);
       
       if (text) {
         newPostForCurrentUser(text, type, $scope.retroId).then(function() {
           console.debug('Post add complete');
           $timeout(function() {
             $scope.showAddPost = false;
             $scope.showRecentPosts = true;
           });
         });
         $scope.messageInput = '';
       }
     };
     
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
       //console.debug('Deleting post');
       
       firebase.database().ref('/posts/' + retroId +'/' + post.postId).remove();
       var allUsers = firebase.database().ref('/users');
       
       allUsers.once('value', function(snap) { 
         
         snap.forEach(function(childSnap) {
           //console.debug(childSnap.val());
           firebase.database().ref('/user-posts/' + retroId +'/' + childSnap.key + '/' + post.postId).remove();
         });
      });
     };
     
     var unsubscribe = firebase.auth().onAuthStateChanged(onAuthStateChanged);  

     $scope.$on("$destroy", function handler() {
       unsubscribe();
     });
  });
  
  
