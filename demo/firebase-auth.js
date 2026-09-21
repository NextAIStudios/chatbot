/**
 * Botly Pro Firebase Authentication Helper
 * -------------------------------------------------------------
 * Provides Google Sign-in, Email/Password auth, and session
 * management for the Botly Pro Sandbox Studio & Checkout access.
 */

(function(window) {
  'use strict';

  var currentUser = null;
  var authListeners = [];
  var isInitialized = false;
  var initialAuthResolved = false;
  var pendingAction = null;

  function hasUsableApiKey(config) {
    var key = config && config.apiKey ? String(config.apiKey) : '';
    return !!(key && key.length > 20 && key.indexOf('YOUR_') === -1 && key.indexOf('PASTE_') === -1);
  }

  var BotlyAuth = {
    init: function() {
      var config = window.BOTLY_FIREBASE_CONFIG;
      var hasRealKeys = hasUsableApiKey(config);

      if (window.firebase && hasRealKeys) {
        try {
          if (!firebase.apps.length) {
            firebase.initializeApp(config);
          }
          isInitialized = true;
          // Set persistent session storage so login survives page reload & navigation
          try {
            if (firebase.auth && firebase.auth.Auth && firebase.auth.Auth.Persistence) {
              firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function(pe) {
                console.warn('Botly persistence notice:', pe.message);
              });
            }
          } catch(e) {}

          firebase.auth().onAuthStateChanged(function(user) {
            currentUser = user;
            initialAuthResolved = true;
            notifyListeners(user);
            updateAuthNavbarUI(user);
            if (user && pendingAction) {
              var fn = pendingAction;
              pendingAction = null;
              try { fn(); } catch(e) { console.error(e); }
            }
          });
        } catch(err) {
          console.warn('Botly Firebase init notice:', err.message);
          initialAuthResolved = true;
          notifyListeners(null);
        }
      } else {
        updateAuthNavbarUI(null);
        initialAuthResolved = true;
        notifyListeners(null);
      }
    },

    isConfigured: function() {
      return hasUsableApiKey(window.BOTLY_FIREBASE_CONFIG);
    },

    getUser: function() {
      return currentUser;
    },

    isAuthenticated: function() {
      return !!currentUser;
    },

    onAuthStateChanged: function(callback) {
      if (typeof callback === 'function') {
        authListeners.push(callback);
        if (initialAuthResolved) {
          try { callback(currentUser); } catch(e) { console.error(e); }
        }
      }
    },

    isReady: function() {
      return initialAuthResolved;
    },

    signInWithGoogle: function() {
      var self = this;
      return new Promise(function(resolve, reject) {
        if (!self.isConfigured()) {
          reject(new Error('Firebase is not configured yet. Get your Web API key: console.firebase.google.com > project "botly-662d7" > Project settings (gear icon) > General > "Web API Key". Paste it as apiKey in demo/firebase-config.local.js (recommended, gitignored) or demo/firebase-config.js, reload, and sign in again. Full steps: FIREBASE_SETUP_GUIDE.md'));
          return;
        }

        var provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider)
          .then(function(result) {
            self.closeModal();
            resolve(result.user);
          })
          .catch(function(error) {
            reject(error);
          });
      });
    },

    signInWithEmail: function(email, password) {
      var self = this;
      return new Promise(function(resolve, reject) {
        if (!self.isConfigured()) {
          reject(new Error('Firebase is not configured yet. Get your Web API key: console.firebase.google.com > project "botly-662d7" > Project settings (gear icon) > General > "Web API Key". Paste it as apiKey in demo/firebase-config.local.js (recommended, gitignored) or demo/firebase-config.js, reload, and sign in again. Full steps: FIREBASE_SETUP_GUIDE.md'));
          return;
        }

        firebase.auth().signInWithEmailAndPassword(email, password)
          .then(function(result) {
            self.closeModal();
            resolve(result.user);
          })
          .catch(function(error) {
            reject(error);
          });
      });
    },

    signUpWithEmail: function(email, password, displayName) {
      var self = this;
      return new Promise(function(resolve, reject) {
        if (!self.isConfigured()) {
          reject(new Error('Firebase is not configured yet. Get your Web API key: console.firebase.google.com > project "botly-662d7" > Project settings (gear icon) > General > "Web API Key". Paste it as apiKey in demo/firebase-config.local.js (recommended, gitignored) or demo/firebase-config.js, reload, and sign in again. Full steps: FIREBASE_SETUP_GUIDE.md'));
          return;
        }

        firebase.auth().createUserWithEmailAndPassword(email, password)
          .then(function(result) {
            if (displayName && result.user.updateProfile) {
              result.user.updateProfile({ displayName: displayName });
            }
            self.closeModal();
            resolve(result.user);
          })
          .catch(function(error) {
            reject(error);
          });
      });
    },

    signOut: function() {
      var self = this;
      return new Promise(function(resolve) {
        if (window.firebase && firebase.auth) {
          firebase.auth().signOut().then(function() {
            currentUser = null;
            notifyListeners(null);
            updateAuthNavbarUI(null);
            resolve();
          }).catch(function() {
            currentUser = null;
            notifyListeners(null);
            updateAuthNavbarUI(null);
            resolve();
          });
        } else {
          currentUser = null;
          notifyListeners(null);
          updateAuthNavbarUI(null);
          resolve();
        }
      });
    },

    requireAuth: function(actionCallback, optionalMessage) {
      if (currentUser) {
        if (typeof actionCallback === 'function') actionCallback();
        return true;
      }
      pendingAction = actionCallback;
      this.openModal(optionalMessage || 'Sign in to access sandbox, save your bot, and unlock $10 flat checkout.');
      return false;
    },

    openModal: function(customMessage) {
      var modal = document.getElementById('botly-auth-modal');
      var msgEl = document.getElementById('auth-modal-message');
      var errEl = document.getElementById('auth-error-banner');
      if (errEl) errEl.style.display = 'none';

      if (!BotlyAuth.isConfigured() && errEl) {
        errEl.innerHTML = 'Firebase setup needed: paste your <strong>Web API key</strong> as ' +
          '<code>apiKey</code> in <code>demo/firebase-config.local.js</code> ' +
          '(recommended, gitignored). Get it at <a href="https://console.firebase.google.com/project/botly-662d7/settings/general" ' +
          'target="_blank" rel="noopener" style="color:#1d4ed8;">Firebase Console &gt; Project settings &gt; General &gt; Web API Key</a>. ' +
          'Then reload this page. Full steps: <code>FIREBASE_SETUP_GUIDE.md</code>.';
        errEl.style.display = 'block';
      }

      if (msgEl && customMessage) {
        msgEl.textContent = customMessage;
      }

      if (modal) {
        modal.style.display = 'flex';
      }
    },

    closeModal: function(force) {
      if (window.BOTLY_REQUIRE_AUTH_PAGE && !currentUser && !force) {
        // Page requires authentication: sign-in modal persists and cannot be dismissed
        var card = document.querySelector('.botly-auth-card');
        if (card) {
          card.classList.remove('auth-shake');
          void card.offsetWidth;
          card.classList.add('auth-shake');
        }
        var hint = document.getElementById('auth-persist-hint');
        if (hint) {
          hint.style.display = 'block';
          setTimeout(function() { hint.style.display = 'none'; }, 2800);
        }
        return false;
      }

      var modal = document.getElementById('botly-auth-modal');
      if (modal) {
        modal.style.display = 'none';
      }
      return true;
    }
  };

  function notifyListeners(user) {
    authListeners.forEach(function(fn) {
      try { fn(user); } catch(e) { console.error(e); }
    });
    try {
      window.dispatchEvent(new CustomEvent('botly:authChanged', { detail: { user: user } }));
    } catch(e) {}
  }

  function updateAuthNavbarUI(user) {
    var loginBtn = document.getElementById('nav-auth-login-btn');
    var profileWrap = document.getElementById('nav-auth-profile-wrap');
    var userAvatar = document.getElementById('nav-user-avatar');
    var userName = document.getElementById('nav-user-name');

    var mobLoginBtn = document.getElementById('mobile-auth-login-btn');
    var mobProfileWrap = document.getElementById('mobile-auth-profile-wrap');
    var mobUserAvatar = document.getElementById('mobile-user-avatar');
    var mobUserName = document.getElementById('mobile-user-name');

    if (user) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (profileWrap) profileWrap.style.display = 'flex';
      var name = user.displayName || (user.email ? user.email.split('@')[0] : 'Developer');
      if (userName) userName.textContent = name;
      var avatarUrl = user.photoURL || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=18221c&color=9be553&bold=true');
      if (userAvatar) {
        userAvatar.src = avatarUrl;
        userAvatar.style.display = 'block';
      }

      if (mobLoginBtn) mobLoginBtn.style.display = 'none';
      if (mobProfileWrap) mobProfileWrap.style.display = 'flex';
      if (mobUserName) mobUserName.textContent = name;
      if (mobUserAvatar) {
        mobUserAvatar.src = avatarUrl;
        mobUserAvatar.style.display = 'block';
      }
    } else {
      if (loginBtn) loginBtn.style.display = 'inline-flex';
      if (profileWrap) profileWrap.style.display = 'none';
      if (mobLoginBtn) mobLoginBtn.style.display = 'inline-flex';
      if (mobProfileWrap) mobProfileWrap.style.display = 'none';
    }
  }

  window.BotlyAuth = BotlyAuth;

  document.addEventListener('DOMContentLoaded', function() {
    BotlyAuth.init();
  });

})(window);
