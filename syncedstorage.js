
function SyncedStorage(clientId, configFileName, onApiLoad) {
  this.clientId = clientId;
  this.onApiLoad = onApiLoad;
  var mthis = this;
  
  this.setItem = function(key, val)
  {
    mthis.settingsObject[key] = val;
  };
  
  this.getItem = function(key)
  {
    return mthis.settingsObject[key];
  };
  
  this.removeItem = function(key)
  {
    delete mthis.settingsObject[key];
  };
  
  this.reload = function(callback)
  {
    gapi.client.drive.files.get({
      fileId: this.settingsFileId,
      mimeType: 'application/json',
      alt: 'media'
    }).then(function(resp) {
      mthis.settingsObject = JSON.parse(resp.body);
      if (callback)
      {
        callback();
      }
    });
  };
  
  // From https://stackoverflow.com/questions/40600725/google-drive-api-v3-javascript-update-file-contents
  this.updateFileContent = function(fileId, contentBlob, callback) {
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.onreadystatechange = function() {
      if (xhr.readyState != XMLHttpRequest.DONE) {
        return;
      }
      callback(xhr.response);
    };
    xhr.open('PATCH', 'https://www.googleapis.com/upload/drive/v3/files/' + fileId + '?uploadType=media');
    xhr.setRequestHeader('Authorization', 'Bearer ' + gapi.auth.getToken().access_token);
    xhr.send(contentBlob);
  }

  
  
  this.save = function(callback){
    
    var contentBlob = new  Blob([JSON.stringify(mthis.settingsObject)], {
      'type': 'application/json'
    });
    
    mthis.updateFileContent(mthis.settingsFileId, contentBlob, function(res){
      if (callback)
      {
        callback();
      }
    });
  };
  
  this.loadConfigFile = function(fileName, callback)
  {
    mthis.getConfigFile(fileName, function(f, err) {
      if (err)
      {
        callback(null, err);
      }
      else if (!(f))
      {
        mthis.makeConfigFile(fileName, function(f, err) {
          callback(f, err);
        });
      }
      else
      {
        callback(f, null);
      }
    });
  };

  this.makeConfigFile = function(fileName, callback)
  {
    var fileMetadata = {
      'title': fileName,
      'parents': [ 'appDataFolder']
    };

    var media = {
      mimeType: 'application/json',
      body: "{}"
    };

    var createFileCallback = function (file) {
      if (file.id) {
        callback(file, null);
      }
      else {
        callback(null, file);
      }
    };
    
    gapi.client.drive.files.insert({
      title: fileName,
      parents: [ 'appDataFolder'],
      media: media,
      fields: 'id',
    }).execute(createFileCallback);
  };


  this.getConfigFile = function(fileName, callback)
  {
    gapi.client.drive.files.list({
      parents: ['appDataFolder'],
      title: 'config.json',
      pageSize: 100
    }).execute(function(res, metadata) { 
      var bestFileId = false;
      var bestFile = null;
      res.items.forEach(function(file) {
        // Use the one alphabetically first in case there are multiple named the same for consistency
        if (file.title === fileName && (!(bestFileId) || file.id < bestFileId))
        {  
          bestFile = file;
          bestFileId = file.id;
        }
      });
      callback(bestFile, null);
    });
  };
    
  
  
  
  this.onAuthComplete = function(callback) {
    gapi.client.load('drive', 'v2', function() {
      mthis.loadConfigFile(configFileName, function(f, err){
        if (err)
        {
          callback(err);
        }
        else
        {
          mthis.settingsFileId = f.id;
          mthis.reload(function() {
            callback(null);
          });
        }
      });
    });
  };
  
  this.handleAuthResultManual = function(authResult, callback) {
    if (authResult && !authResult.error) {
      mthis.onAuthComplete(callback);
    } else {
      callback(null, authResult.error);
    }
  };
  
  this.handleAuthResultImmediate = function(authResult, callback) {
    if (authResult && !authResult.error) {
      mthis.onAuthComplete(callback);
    } else {
      gapi.auth.authorize({
        client_id: clientId,
        scope: [
          'https://www.googleapis.com/auth/drive.appfolder',
          'https://www.googleapis.com/auth/drive.file'
        ],
        immediate: false
      }, function(authResult){
        mthis.handleAuthResultManual(authResult, callback);
      });
    }
  };
  
  this.authenticate = function(callback) {
    gapi.auth.authorize({
      client_id: clientId,
      scope: [
        'https://www.googleapis.com/auth/drive.appfolder',
        'https://www.googleapis.com/auth/drive.file'
      ],
      immediate: true
    }, function(authResult) {
      mthis.handleAuthResultImmediate(authResult, callback);
    });
  };
  
  gapi.load('client', function() {
    setTimeout(function() {
      mthis.authenticate(function(err) {
        mthis.onApiLoad(mthis, err);
      });
    }, 1);
  });
}
