module.exports = {
  'url': 'mongodb://data01.audacy.space:11001/telemetry',
  'options': {
    'user': 'ray',
    'pass': 'race2space',
    'auth': {
      'authdb': 'admin'
    }
    /**
    "server": {   
      "auto_reconnect": true,
      "poolSize": 200,
      "socketOptions": {
         "keepAlive": 1
      }
   }
  **/
  },
  'secret': 'race2space'
};
