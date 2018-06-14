/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

// Shortcuts to DOM Elements.
var messageForm = document.getElementById('message-form');
var messageInput = document.getElementById('new-post-message');
var typeInput = document.getElementById('new-post-type');
var signInButton = document.getElementById('sign-in-button');
var anonSignInButton = document.getElementById('anon-sign-in-button');
var signOutButton = document.getElementById('sign-out-button');
var splashPage = document.getElementById('page-splash');
var addPost = document.getElementById('add-post');
var recentPostsSection = document.getElementById('recent-posts-list');
var listeningFirebaseRefs = [];

/**
 * Saves a new post to the Firebase DB.
 */
// [START write_fan_out]
function writeNewPost(uid, username, picture, body, type) {
  // A post entry.
  var postData = {
    author: username,
    uid: uid,
    body: body,
    type: type,
    starCount: 0,
    authorPic: picture
  };

  // Get a key for a new Post.
  var newPostKey = firebase.database().ref().child('posts').push().key;

  // Write the new post's data simultaneously in the posts list and the user's post list.
  var updates = {};
  updates['/posts/' + newPostKey] = postData;
  updates['/user-posts/' + uid + '/' + newPostKey] = postData;

  return firebase.database().ref().update(updates);
}
// [END write_fan_out]

/**
 * Star/unstar post.
 */
// [START post_stars_transaction]
function toggleStar(postRef, uid) {
  postRef.transaction(function(post) {
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
 * Creates a post element.
 */
function createPostElement(postId, text, author, authorId, authorPic) {
  var uid = firebase.auth().currentUser.uid;

  var html =
      '<li class="post post-' + postId + '" >' +
        '<div class="avatar"></div>' +
        '<div class="username mdl-color-text--black"></div>' +
        '<div class="stars">' +
          '<div class="not-starred material-icons">star_border</div>' +
          '<div class="starred material-icons">star</div>' +
          '<div class="star-count">0</div>' +
        '</div>' +
        '<div class="message-text text"></div>' +
      '</li>';

      
  // Create the DOM element from the HTML.
  var div = document.createElement('div');
  div.innerHTML = html;
  var postElement = div.firstChild;

  var star = postElement.getElementsByClassName('starred')[0];
  var unStar = postElement.getElementsByClassName('not-starred')[0];

  // Set values.
  postElement.getElementsByClassName('text')[0].innerText = text;
  postElement.getElementsByClassName('username')[0].innerText = author || 'Anonymous';
  postElement.getElementsByClassName('avatar')[0].style.backgroundImage = 'url("' +
      (authorPic || '/images/silhouette.jpg') + '")';

  // Listen for likes counts.
  // [START post_value_event_listener]
  var starCountRef = firebase.database().ref('posts/' + postId + '/starCount');
  starCountRef.on('value', function(snapshot) {
    updateStarCount(postElement, snapshot.val());
  });
  // [END post_value_event_listener]

  // Listen for the starred status.
  var starredStatusRef = firebase.database().ref('posts/' + postId + '/stars/' + uid)
  starredStatusRef.on('value', function(snapshot) {
    updateStarredByCurrentUser(postElement, snapshot.val());
  });

  // Keep track of all Firebase reference on which we are listening.
  listeningFirebaseRefs.push(starCountRef);
  listeningFirebaseRefs.push(starredStatusRef);

  // Bind starring action.
  var onStarClicked = function() {
    var globalPostRef = firebase.database().ref('/posts/' + postId);
    var userPostRef = firebase.database().ref('/user-posts/' + authorId + '/' + postId);
    toggleStar(globalPostRef, uid);
    toggleStar(userPostRef, uid);
  };
  unStar.onclick = onStarClicked;
  star.onclick = onStarClicked;

  return postElement;
}

/**
 * Updates the starred status of the post.
 */
function updateStarredByCurrentUser(postElement, starred) {
  if (starred) {
    postElement.getElementsByClassName('starred')[0].style.display = 'inline-block';
    postElement.getElementsByClassName('not-starred')[0].style.display = 'none';
  } else {
    postElement.getElementsByClassName('starred')[0].style.display = 'none';
    postElement.getElementsByClassName('not-starred')[0].style.display = 'inline-block';
  }
}

/**
 * Updates the number of stars displayed for a post.
 */
function updateStarCount(postElement, nbStart) {
  postElement.getElementsByClassName('star-count')[0].innerText = nbStart;
}


/**
 * Starts listening for new posts and populates posts lists.
 */
function startDatabaseQueries() {
  var myUserId = firebase.auth().currentUser.uid;

  // [START recent_posts_query]
  var recentPostsRef = firebase.database().ref('posts').limitToLast(100);
  // [END recent_posts_query]

  var fetchPosts = function(postsRef, sectionElement) {

    postsRef.on('child_added', function(data) {
      var index = parseInt(data.val().type) || 0;
      var author = data.val().author || 'Anonymous';
      var containerElement = sectionElement.getElementsByClassName('posts-container')[index];
      containerElement.insertBefore(
          createPostElement(data.key, data.val().body, author, data.val().uid, data.val().authorPic),
          containerElement.firstChild);
      
      var postname = ".post-" + data.key;
      $(postname).hide().delay().fadeIn(2000);      
    });
    
    postsRef.on('child_changed', function(data) {	
      var index = parseInt(data.val().type) || 0;
  		var containerElement = sectionElement.getElementsByClassName('posts-container')[index];
  		var postElement = containerElement.getElementsByClassName('post-' + data.key)[0];
      
  		postElement.getElementsByClassName('username')[0].innerText = data.val().author || 'Anonymous';
  		postElement.getElementsByClassName('text')[0].innerText = data.val().body;
  		postElement.getElementsByClassName('star-count')[0].innerText = data.val().starCount;
    });
    
    postsRef.on('child_removed', function(data) {
      var index = parseInt(data.val().type) || 0;
  		var containerElement = sectionElement.getElementsByClassName('posts-container')[index];
  		var post = containerElement.getElementsByClassName('post-' + data.key)[0];
  	    post.parentElement.removeChild(post);
      });
  };

  // Fetching and displaying all posts of each sections.
  fetchPosts(recentPostsRef, recentPostsSection);

  // Keep track of all Firebase refs we are listening to.
  listeningFirebaseRefs.push(recentPostsRef);
}

/**
 * Writes the user's data to the database.
 */
// [START basic_write]
function writeUserData(userId, name, email, imageUrl) {
  firebase.database().ref('users/' + userId).set({
    username: name,
    email: email,
    profile_picture : imageUrl
  });
}
// [END basic_write]

/**
 * Cleanups the UI and removes all Firebase listeners.
 */
function cleanupUi() {
  // Remove all previously displayed posts.
  recentPostsSection.getElementsByClassName('posts-container')[0].innerHTML = '';
  recentPostsSection.getElementsByClassName('posts-container')[1].innerHTML = '';
  recentPostsSection.getElementsByClassName('posts-container')[2].innerHTML = '';

  // Stop all currently listening Firebase listeners.
  listeningFirebaseRefs.forEach(function(ref) {
    ref.off();
  });
  listeningFirebaseRefs = [];
}

/**
 * The ID of the currently signed-in User. We keep track of this to detect Auth state change events that are just
 * programmatic token refresh but not a User status change.
 */
var currentUID;

/**
 * Triggers every time there is a change in the Firebase auth state (i.e. user signed-in or user signed out).
 */
function onAuthStateChanged(user) {
  // We ignore token refresh events.
  if (user && currentUID === user.uid) {
    return;
  }

  cleanupUi();
  if (user) {
    currentUID = user.uid;
    splashPage.style.display = 'none';
    writeUserData(user.uid, user.displayName, user.email, user.photoURL);
    startDatabaseQueries();
  } else {
    // Set currentUID to null.
    currentUID = null;
    // Display the splash page where you can sign-in.
    splashPage.style.display = '';
  }
}

/**
 * Creates a new post for the current user.
 */
function newPostForCurrentUser(text, type) {
  // [START single_value_read]
  var userId = firebase.auth().currentUser.uid;
  return firebase.database().ref('/users/' + userId).once('value').then(function(snapshot) {
    var username = (snapshot.val() && snapshot.val().username) || 'Anonymous';
    // [START_EXCLUDE]
    return writeNewPost(firebase.auth().currentUser.uid, username,
        firebase.auth().currentUser.photoURL,
        text, type);
    // [END_EXCLUDE]
  });
  // [END single_value_read]
}

/**
 * Displays the given section element and changes styling of the given button.
 */
function showSection(sectionElement) {
  recentPostsSection.style.display = 'none';
  addPost.style.display = 'none';

  if (sectionElement) {
    sectionElement.style.display = 'flex';
  }
}

