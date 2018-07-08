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
    // [START post_stars_transaction]
    this.toggleStar = function(postRef, uid) {
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


});