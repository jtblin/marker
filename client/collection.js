var MK = window.MK = window.MK || {};

MK.Collection = function (name, maxItems) {
  var db = window.localStorage, collName = name, items, loaded = false,
      isStoredInLocalStorage = supportsLocalStorage(), sessionName = 'isConnected:' + name,
      collectionDep = new Deps.Dependency;

  maxItems = maxItems || 0;

  trackConnections();

  function trackConnections () {
    var nb = sessionStorage.getItem(sessionName);
    sessionStorage.setItem(sessionName, nb ? parseInt(nb) + 1 : 1);
  }

  function isShared () {
    return parseInt(sessionStorage.getItem(sessionName)) > 1;
  }

  function load (force) {
    if (loaded && !force) return;
    items = isStoredInLocalStorage ? JSON.parse(db.getItem(collName)) || [] : [];
    loaded = true;
  }

  function getIndex (key) {
    load();
    for (var i = 0; i < items.length; i++) {
      if (items[i]._id === key)
        return i;
    }
    return -1;
  }

  function reset () {
    items = [];
    if (isStoredInLocalStorage) db.removeItem(collName);
  }

  function emitEvent () {
    if (isShared()) {
      var event = document.createEvent("HTMLEvents"), eventName = collName + 'change';
      event.initEvent(eventName, true, true);
      event.eventName = eventName;
      document.dispatchEvent(event);
    }
  }

  function supportsLocalStorage() {
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
      return false;
    }
  }

  document.addEventListener(name + 'change', function (event) {
    load(true);
  });

  return {
    save: function (item) {
      var i = getIndex(item._id);
      if (i > -1)
        items.splice(i, 1);
      else if (maxItems !== 0 && this.length() >= maxItems)
        items.pop();
      items.unshift(item);

      try {
        if (isStoredInLocalStorage) db.setItem(collName, JSON.stringify(items));
      }
      catch (e){
        if(e.name === 'QUOTA_EXCEEDED_ERR') {
          // reset to make space
          reset();
          items.push(item);
          db.setItem(collName, JSON.stringify(items));
        } else {
          console.log("Local storage write failure - " + e);
          isStoredInLocalStorage = false;
          throw e;
        }
      }
      finally {
        collectionDep.changed();
        if (isStoredInLocalStorage) emitEvent();
      }
    },
    get: function (key) {
      collectionDep.depend();
      var i = getIndex(key);
      if (i === -1)
        return null;
      else
        return items[i];
    },
    getItems: function () {
      collectionDep.depend();
      load();
      return items;
    },
    remove: function (key) {
      var i = getIndex(key);
      items.splice(i, 1);
      if (isStoredInLocalStorage) {
        db.setItem(collName, JSON.stringify(items));
        collectionDep.changed();
        emitEvent();
      }
    },
    length: function () {
      return this.getItems().length;
    }
  }
};
