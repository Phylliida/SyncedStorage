# SyncedStorage
A javascript API that works the same way the LocalStorage API except it uses google apis to persist and sync across devices

Example usage:

```html
<html>
<head>
<script src="/js/syncedstorage.js"></script>
<script>
var syncedStorage;
function loadedSyncedStorage(resSyncedStorage, err)
{
  if(err)
  {
    console.error(err);
    return;
  }
  syncedStorage = resSyncedStorage;
  console.log(syncedStorage.getItem("hi"));
  syncedStorage.setItem("hi", "totesbeanlmao");
  
  // It doesn't save automatically, call this whenever you want to save the data to the hidden file in the appdata folder of GoogleDrive that is synced across devices
  syncedStorage.save(function() {
    console.log("done save");
  });
}

function loadedDriveAPI()
{
  // To get your clientId make a project in the google develpers console then generate a client id. This is free and doesn't require a server
  // When you call this it'll automatically prompt the user for the authentication if needed to write the synced file to the user's google drive in a hidden folder unique to your app. Once authentication is received the callback loadedSyncedStorage is called with the syncedStorage object you can use. Don't use it before that.
  // This can take 5-10 seconds to load so you might want to keep data in the actual LocalStorage API and then update it as needed once this loads so it doesn't feel slow to users.
  SyncedStorage(clientId, 'config.json', loadedSyncedStorage);
}
</script>
<script src="http://apis.google.com/js/client.js?onload=loadedDriveAPI"></script>
</head>
</html>
```
