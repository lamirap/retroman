'use strict';

angular.module('retroman')
  .service('retrodb', function() {
    
    /**
     * Saves a new post to the Firebase DB.
     */
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


    /**
     * Creates a new post for the current user.
     */
    this.newPostForCurrentUser = function(text, type, retroId) {
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
    
    /**
     * Star/unstar post.
     */
    function toggleStarRef(postRef, uid) {
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
    
    /**
     * Star/unstar post.
     */
    this.toggleStar = function(retroId, post) {      
      var uid = firebase.auth().currentUser.uid;

      var globalPostRef = firebase.database().ref('/posts/' + retroId +'/' + post.postId);
      var userPostRef = firebase.database().ref('/user-posts/' + retroId +'/' + post.authorId + '/' + post.postId);
      toggleStarRef(globalPostRef, uid);
      toggleStarRef(userPostRef, uid);  
    }
    
    /**
     * Writes the user's data to the database.
     */
    this.writeUserData = function(userId, name, email, imageUrl, isAnonymous) {
      //console.debug('Adding user');
      firebase.database().ref('users/' + userId).set({
        username: name,
        email: email,
        profile_picture : imageUrl,
        userId : userId,
        isAnonymous : isAnonymous
      });
    }

    /**
     * Delete Post
     */
    this.deletePost = function(post, retroId) {
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


    /**
     * Delete retro
     */
    this.deleteRetro = function(retro) {
      console.debug('Deleting retro');
      var userId = firebase.auth().currentUser.uid;
      firebase.database().ref('/retros/' + retro.retroId).remove();
      //console.debug('/retros/' + userId + '/' + retro.retroKey);
      
      firebase.database().ref('/user-retros/' + userId + '/' + retro.retroKey).remove();
      
      //Remove posts from deleted retro also
      
      firebase.database().ref('/posts/' + retro.retroId + '/').remove();
      var allUsers = firebase.database().ref('/users');
      
      allUsers.once('value', function(snap) { 
        
        snap.forEach(function(childSnap) {
          //console.debug(childSnap.val());
          firebase.database().ref('/user-posts/' + retro.retroId + '/').remove();
        });
      });
    }


    /**
     * Get Retros
     */
    this.getRetros = function(retroList) {
      var userId = firebase.auth().currentUser.uid;
      console.debug(userId);
      
      var userRetrosRef = firebase.database().ref('/user-retros/' + userId + '/');
      userRetrosRef.on('value', function(snapshot) {
        snapshot.forEach(function(childSnap) {
          var retro = {};
          
          retro.name = childSnap.val().name;
          retro.retroId = childSnap.val().retroId;
          retro.retroKey = childSnap.key;
          
          retroList.unshift(retro);
        });
      });      
    }

});