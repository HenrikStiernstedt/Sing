
var
  express = require('express'),
  app = express(),
  server  = require("http").createServer(app),
  io = require("socket.io")(server, {
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: true
  }),
  session = require("express-session")({
    secret: "my-secret123",
    resave: true,
    saveUninitialized: true
  }),
  sharedsession = require("express-socket.io-session");

  var share = require('./js/share.js');

const fs = require('fs');

// Attach session
app.use(session);

// Share session with io sockets
io.use(sharedsession(session, {
    autoSave:true
}));

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

server.listen(port, function(){
  console.log('listening on *:' + port);
});

var request = require('request');

app.use('/favicon.ico', express.static('images/favicon.png'));

var nextTeamNumber = 1;

/******************************************************************************
 * Data structures
 ******************************************************************************/
var chatHistory =
[
  {
    date : new Date(),
    name : 'Server',
    text : 'Server started.'
  }
];

var data = {
  players: [{
      "id" : 0,
      "team" : 0,
      "score" : 0,
      "active" : false,
      "socketId" : "",
      "teamName" : null,
      "buzzOrder": 0,
      "HasBuzzd": false,
      "isCorrect": null,
      "answer" : null,
      "lastAnswer": 0,
      "questionScore" : 0,
      "NumberOfWins": 0,
      "emote" : "",
      "confidenceLevel": 5,
      "votedSongs": []
  }],
  status: {
    "isBuzzed" : false,
    "isBuzzActive" : false,
    "questionTime": 30,
    "winningTeamName" : null,
    "winningTeam" : null,
    "buzzList" : [],
    "songVotes": [],
    quizMasterId: 0,
    question : { 
      "songNumber": 1,
      "songType" : "WELCOME",
      "songTitle": "Multisofts sångbok",
      "melody": "",
      "author": "",
      "songText": ["Välkommen till Multisofts sångbok."],
      "comment": "",
      "isSung": false
    },
    pendingAnswers: [{
      "id" : 0,
      "answer": "",
      "questionScore": 0,
      "clueScore": 0
    }],
    "questionList": [{
      "songNumber": 1,
      "songType" : "SNAPS",
      "songTitle": "Bredbandsbolaget",
      "melody": "Spritbolaget",
      "author": "Henrik Stiernstedt",
      "songText": ["test"],
      "comment": "",
      "isSung": false
    }]
  },
  answers: [{
    "id" : 0,
    "answer": "",
    "questionScore": 0,
    "clueScore": 0
  }],
  quizMasterPassword : '4552',
  "questionList": [{
    "songNumber": 1,
    "songType" : "SNAPS",
    "songTitle": "Bredbandsbolaget",
    "melody": "Spritbolaget",
    "author": "Henrik Stiernstedt",
    "songText": ["test"],
    "comment": "",
    "isSung": false
  }]
}

data.players.pop();

app.get('/', function(req, res){
  res.sendFile(__dirname + '/quizlist.html');
});

app.get('/quizmaster', function(req, res){
  res.sendFile(__dirname + '/quizmaster.html');
});

// Ovanstående prylar känns onödigt nu när den här tar in alla filer.
app.use(express.static(__dirname + '/', {
    maxage: 0
}));

// Specialare för AJAX och annat som inte behöver pushas ut.
app.get('/status', function(req, res){
  res.json(
    {
      question: data.status.question,
      status: data.status,
      players: data.players,
      nameRequired: {
        id: req.session.team,
        name: req.session.teamName
      }
    }
  );
});

app.get('/chatHistory', function(req, res){
  res.json(chatHistory);
});

/********************************************************************************************
 * Helper functions
 ********************************************************************************************/
function getCurrentPlayer(teamId)
{
   return data.players.filter( obj => obj.team == teamId)[0];
}

function verifyQM(teamId, action) {
  if(data.status.quizMasterId == teamId) {
    return true;
  }
  console.log("WARN: Unauthorized attempt to " + action + " from " + teamId);
  return false;

}

function getCurrentObject(array, id) {
  return array.filter( obj => obj.id == id)[0];
}

function addOrReplace(array, obj) {
  var index = -1;
  array.filter((el, pos) => {
    if( el.id == obj.id )
      delete array[index = pos];
    return true;
  });

  // put in place, or append to list
  if( index == -1 )
    array.push(obj);
  else
    array[index] = obj;
}

function upsert(array, item) { // (1)
  const i = array.findIndex(_item => _item.id == item.id);
  if (i > -1) array[i] = item; // (2)
  else array.push(item);
}

function songVotes() {

  // Initialize songVotes array with zeros based on the questionList length
  const votes = new Array(data.status.questionList.length).fill(0);

  // Traverse each player's votedSongs array
  data.players.forEach(player => {
    if(player.votedSongs)
    {
      player.votedSongs.forEach(songIndex => {
        // Increment the count for the song at the corresponding index
        votes[songIndex]++;
      });
    }
  });

  return votes;
}

/******************************************************************************
 * Socket.io code for ADMINISTRATIVE EVENTS
 ******************************************************************************/

io.on('connection', function(socket){
  console.log(new Date().toLocaleTimeString() + ' ' + socket.id + ' connected. Team: ' + socket.handshake.session.team);
  if (socket.handshake.session.team) {
    console.log('Returning user ' + socket.handshake.session.team);
    //var player = data.players.filter( obj => obj.team === socket.handshake.session.team)[0];
    var player = getCurrentPlayer(socket.handshake.session.team);
    if(player != undefined)
    {
      player.active = true;
      player.socketId = socket.id;
      player.teamName = socket.handshake.session.teamName != null ? socket.handshake.session.teamName : "Team " + socket.handshake.session.team;
//      player.score = 0;
      socket.handshake.session.save();
      io.emit('UpdatePlayers', {status: data.status, players: data.players });
    }
    else {
      // We have a session, but no player entry. A state caused by purge.
      console.log("Error restoring session. No entry in Players-object for team "+socket.handshake.session.team);
      player =  {
              "id" : socket.handshake.session.team,
              "team" : socket.handshake.session.team,
              "score" : 0,
              "active" : true,
              "socketId" : socket.id,
              "teamName" : "Team " + socket.handshake.session.teamName != null ? socket.handshake.session.teamName : "Team " + socket.handshake.session.team,
              "NumberOfWins": 0,
              "votedSongs": []
            };
      data.players.push(player);
    }
  } else {
    // New player
    socket.handshake.session.team = nextTeamNumber++;
    socket.handshake.session.save();
    console.log("New user " + socket.handshake.session.team);
    var emote = share.getEmoteFromConfidenceLevel(0);
    player =  {
            "id" : socket.handshake.session.team,
            "team" : socket.handshake.session.team,
            "score" : 0,
            "active" : true,
            "socketId" : socket.id,
            "teamName" : "Team " + socket.handshake.session.team,
            "HasBuzzd": false,
            "buzzOrder": null,
            "isCorrect": null,
            "answer" : null,  
            "lastAnswer": 0,
            "questionScore" : 0,
            "NumberOfWins": 0,
            "emote": emote,
            "confidenceLevel": 0,
            "votedSongs": []
          };
    data.players.push(player);

    //io.sockets.connected[socket.id].emit('Ping',  new Date().getTime());
    io.emit('UpdatePlayers', {status: data.status, players: data.players });
  }

  io.sockets.connected[socket.id].emit('Welcome',
    {
        id: player.id,
        teamName: player.teamName,
        answer: "",
        pendingAnswer: "",
        isQuizMaster: (player.id == data.status.quizMasterId ? true : false),
        answer: null, // TODO: Hur återställer vi "answer" vid reconnect? //getCurrentObject(data.answers, socket.handshake.session.team) ? getCurrentObject(data.answers, socket.handshake.session.team).answer : null,
        confidenceLevel: player.confidenceLevel,
        votedSongs: player.votedSongs
    }
  );

  socket.on('new chat message', function(msgJson){
    msgJson.date = new Date();
    io.emit('chat message', msgJson);
    chatHistory.push(msgJson);
  });

  socket.on('Purge', function()
  {
    if(!verifyQM(socket.handshake.session.team, "Purge")) {
      return;
    }
    data.players = data.players.filter( obj => obj.active);
    io.emit('UpdatePlayers', {status: data.status, players: data.players });
  });

  socket.on('SetName', function(name) {
    if(!name || name == "")
    {
      return;
    }
    /*
    if(Object.values(Array.from(players.values())).includes(name)) // BUGG: Kontrollen verkar inte fungera.
    {
      return;
    }
    */
    try {
      var player = getCurrentPlayer(socket.handshake.session.team);
      player.teamName = name;
      //players.get(socket.handshake.session.team).teamName = name;
      socket.handshake.session.teamName = name;
      socket.handshake.session.save();
      io.emit('UpdatePlayers', {status: data.status, players: data.players});
    } catch (error) {
      console.error(error);
    }
  });

  socket.on('SetConfidenceLevel', function(confidenceLevel)
  {
    try {
      var player = getCurrentPlayer(socket.handshake.session.team);
      player.confidenceLevel = confidenceLevel;
      player.emote = share.getEmoteFromConfidenceLevel(confidenceLevel);
      io.emit('UpdatePlayers', {status: data.status, players: data.players});
    } catch (error) {
      console.error(error);
    }
  });

  socket.on('disconnect', function(){
    console.log(new Date().toLocaleTimeString() + ' ' + socket.id + ' disconnected');
//    players.get(socket.handshake.session.team).active = false;
    var player = getCurrentPlayer(socket.handshake.session.team);
    if(player)
    {
      player.active = false;
      io.emit('UpdatePlayers', {status: data.status, players: data.players });
    }
  });

  socket.on('StartPing', function() {
    console.log('Ping Request from QM.')

    var allConnectedClients = Object.keys(io.sockets.connected);
    //var clients_in_the_room = io.sockets.adapter.rooms[roomId];
    //console.log(allConnectedClients);
    //console.log(Object.keys(io.sockets.connected));
    for (var clientId in allConnectedClients ) {
      var client = io.sockets.connected[allConnectedClients[clientId]];
      //console.log(client);
      //var client_socket = io.sockets.connected[clientId];//Do whatever you want with this
      console.log('client: %s', client.id); //Seeing is believing
      //console.log(client_socket); //Seeing is believing
    }

    console.log('List all players:');
    console.log ('Team #  Id                   Ping TeamName');
    io.emit('Ping', new Date().getTime());

    let dataToSave = JSON.stringify(data);
    fs.writeFileSync('data.json', dataToSave);
  });

  socket.on('PingResponse', function(pingResponse) {
    console.log(
      socket.handshake.session.team.toString().padStart(6, " ") + "  " + socket.id + " " +
      (new Date().getTime() - pingResponse.pingTime).toString().padStart(4, " ") + " " + pingResponse.teamName
    );
    //players.get(socket.handshake.session.team).teamName = pingResponse.teamName;
    //socket.handshake.session.teamName = pingResponse.teamName;
    var player = getCurrentPlayer(socket.handshake.session.team);
    player.teamName = pingResponse.teamName;
    io.emit('UpdatePlayers', {status: data.status, players: data.players });
  });

  // Quizmaster functions below.
  socket.on('MakeMeQuizMaster', function(password) {
    var player = getCurrentPlayer(socket.handshake.session.team);
    console.log(`Player ${player.teamName} wants to be SingMaster`);
    if(password == data.quizMasterPassword)
    {
      data.status.quizMasterId = socket.handshake.session.team;
      player.teamName = 'SingMaster';
      socket.handshake.session.teamName = player.teamName;

      io.sockets.connected[socket.id].emit('Welcome',
        {
            id: player.id,
            teamName: player.teamName,
            answer: "",
            pendingAnswer: "",
            isQuizMaster: true,
            confidenceLevel: 0,
            votedSongs: []
        }
      );

      io.emit('UpdatePlayers', {status: data.status, players: data.players });
    }
    else {
      console.log("Wrong password: " + password);
    }

  });

  socket.on('Save', function(filename) {
    if(!verifyQM(socket.handshake.session.team, "Save")) { return; }
    if(!filename) {
      filename = 'data';
    }
    let dataToSave = JSON.stringify(data);
    try {
      fs.writeFileSync('saves/'+filename+'.json', dataToSave);
    } catch (error) {
      console.error(error);
    }
  });

  socket.on('Load', function(filename)
  {
    if(!verifyQM(socket.handshake.session.team, "Load")) { return; }
    if(!filename) {
      filename = 'data';
    }
    try {
      let dataToLoad = fs.readFileSync('saves/'+filename+'.json', null);
      data = JSON.parse(dataToLoad);
      io.emit('UpdatePlayers', {status: data.status, players: data.players } );
    } catch (error) {
      console.error(error);
    }
  });

  /*
   * Load server side with questions from a file and return the full list to the QM.
   */
  
  socket.on('LoadQuestions', function(filename)
  {
    if(!verifyQM(socket.handshake.session.team, "LoadQuestions")) { return; }
    if(!filename) {
      filename = 'question';
    }
    try {
      let dataToLoad = fs.readFileSync('games/'+filename+'.json', null);
      data.questionList = JSON.parse(dataToLoad);
      data.status.questionList = data.questionList; // Make list of songs public.
      console.log("Loaded questions");
      console.log(data.questionList);
      io.emit('UpdatePlayers',  {status: data.status, players: data.players } );

      io.sockets.connected[socket.id].emit("ReturnLoadQuestions", data.questionList);

    } catch (error) {
      console.error(error);
    }
  });

  socket.on('SaveQuestions', ({questionList, filename}) => {
    if(!verifyQM(socket.handshake.session.team, "SaveQuestions")) { return; }
    if(!filename) {
      filename = 'songbook';
    }
    let dataToSave = JSON.stringify(questionList, null, '\t');
    
    try {
      fs.writeFileSync('games/'+filename+'.json', dataToSave);

      data.questionList = questionList;
      data.status.questionList = data.questionList; // Make list of songs public.
      io.sockets.connected[socket.id].emit("ReturnLoadQuestions", data.questionList);

    } catch (error) {
      console.error(error);
    }
  });
  
  socket.on('PublishQuestions', ({questionList }) => {
    if(!verifyQM(socket.handshake.session.team, "PublishQuestions")) { return; }
    try {
      data.questionList = questionList;
      data.status.questionList = data.questionList; // Make list of songs public.
      io.sockets.connected[socket.id].emit("ReturnLoadQuestions", data.questionList);

      io.emit('UpdatePlayers', {status: data.status, players: data.players, action: 'none' });
      
    } catch (error) {
      console.error(error);
    }
  });
  
  


/******************************************************************************
 * Socket.io code for GAME EVENTS
 ******************************************************************************/
  
  // Update playeres votes
  socket.on('Buzz2', function(votedSongs, fn){
    var player = getCurrentPlayer(socket.handshake.session.team);
    teamName = player.teamName;

    if(!data.status.isBuzzActive)
    {
      console.log("Answer from team " + player.teamName + " out of question time.");
      return;
    }

     console.log('Buzz2 from ' + teamName);

    // Handle wishes for songs.
    addOrReplace(data.answers, {
      "id" : socket.handshake.session.team,
      // "answer": answer,
      "questionScore": data.status.question.questionScore,
      "clueScore": null,
      "votedSongs": votedSongs
    });

    player.votedSongs = votedSongs; // Make answers public.
    player.lastAnswer = Date.now();

    data.status.songVotes = songVotes(); // Calculate totals.

    var player = getCurrentPlayer(socket.handshake.session.team);


    console.log("Player " + (player.name ?? player.id )+ " wished: "+ votedSongs);

    io.emit('UpdatePlayers', {status: data.status, players: data.players } );

    //console.log(data.status);
  });


  socket.on('Buzz', function(answer, fn){
    var player = getCurrentPlayer(socket.handshake.session.team);
    teamName = player.teamName;

    if(!data.status.isBuzzActive)
    {
      console.log("Answer from team " + player.teamName + " out of question time.");
      return;
    }

    // If we choose to include a buzzer for attention in the singing book, then use this.
    if(data.status.question.questionType == 'BUZZ_RUSH')
    {

      if(data.status.buzzList.includes(socket.handshake.session.team))
      {
        console.log('Extra buzz from ' + teamName);
        fn('Extra buzz from ' + teamName);
        return;
      }
      else {
        data.status.buzzList.push(socket.handshake.session.team);
      }

      if(data.status.isBuzzed)
      {
        console.log('Too slow buzz from ' + teamName + '. In queue as #' + (data.status.buzzList.length + 1));
        //io.emit('UpdatePlayers', {status: data.status, players: data.players } );
      }
      else if (!data.status.isBuzzActive) {
        console.log('Random buzz from ' + teamName);
      }
      else if(player.HasBuzzed)
      {
        console.log('Double buzz from '+ teamName +'. Has already buzzed this round.');
        return;
      } else {
        console.log('Buzz from ' + teamName);
        data.status.isBuzzed = true;
        data.status.isBuzzActive = false;
        data.status.winningTeamName = teamName;
        data.status.winningTeam = socket.handshake.session.team;
        data.status.winningId = socket.id;
        player.HasBuzzed = true;

        addOrReplace(data.answers, {
          "id" : socket.handshake.session.team,
          "answer": null,
          "questionScore": data.status.question.questionScore,
          "clueScore": null
        });

        fn("Buzz!");
        io.emit('UpdatePlayers', {status: data.status, players: data.players } );

        //io.emit('Buzzed', {id : data.status.winningTeam, teamName: teamName, status: data.status, players: data.players});
      }
      return;
    }

    // Handle wishes for songs.
    addOrReplace(data.answers, {
      "id" : socket.handshake.session.team,
      "answer": answer,
      "questionScore": data.status.question.questionScore,
      "clueScore": null
    });

    var player = getCurrentPlayer(socket.handshake.session.team);

    player.answer = answer; // Make answers public.
    player.lastAnswer = Date.now();

    console.log("Player " + player.name + " wished: "+ answer);

    // Sort player array according to last answer.
      data.players.sort(function (a, b) {
        if (a.lastAnswer > b.lastAnswer) {
            return -1;
        }
        if (b.lastAnswer > a.lastAnswer) {
            return 1;
        }
        return 0;
    });

    io.emit('UpdatePlayers', {status: data.status, players: data.players } );

    //console.log(data.status);
    
    if (typeof fn === 'function')
    {
      fn(answer);
    }
    else{
      console.log("No callback function in buzz. Hacker?");
    }
  });

  // UPDATE a question without triggering calculation of scores or anything.
  // Or start a NEW question on a clean sheet.
  socket.on('UpdateQuestion', function(action, question) {
    console.log(action);
    console.log(question);
    if(!verifyQM(socket.handshake.session.team, "UpdateQuestion")) {
      return;
    }

    if(question == null)
    {
      console.log("Missing question in call to UpdateQuestion");
      return;
    }

    var clientAction = 'none';

    if(action == 'NEW')
    {
      clientAction = "clear";
      if(question.questionNumber == "" || question.questionNumber == "0")
      {
        console.log("Old value");
        console.log(data.status.question.questionNumber);
        console.log(data.status.question.questionNumber + 1);
        question.questionNumber = (parseInt(data.status.question.questionNumber) + 1);
      }

      //resetPlayers(false);
    }
    else if(question.questionNumber == "" || question.questionNumber == "0")
    {
        // Se till att behålla frågenummer även om vi uppdaterar frågan med blankt.
      question.questionNumber = data.status.question.questionNumber
    }


    if(data.status.question.questionType == "BUZZ_RUSH")
    {
      data.status.isBuzzed = false;
      data.status.isBuzzActive = true;
      data.status.winningTeamName = null;
      data.status.winningTeam = null;
      data.status.buzzList = [];  // TODO: poppa buzz list, eller hur skall den här fungera egentligen?
      //io.emit('ResetBuzz', {status: data.status});
    }
    // Skip automatic start of buzzers for songs.
    /*
    else
    {
      data.status.isBuzzActive = true;
    }
    */

    data.status.question = question;

    // Skip timers for songs.
    /*
    data.status.questionTime = question.questionTime;
    if(data.status.questionTime && data.status.questionTime != 0)
    {
      // Start the countdown again
      data.status.questionTime = question.questionTime;
    }
    */
    //io.emit('QuestionUpdated', data.status.question);

    io.emit('UpdatePlayers', {status: data.status, players: data.players, action: 'new' });

  });

  socket.on('StartQuestion', function() {
    if(!verifyQM(socket.handshake.session.team, "StartQuestion")) { return; }

    startQuestion();
  });

  socket.on('CompleteQuestion', function(playerList) {
    if(!verifyQM(socket.handshake.session.team, "CompleteQuestion")) { return; }

    completeQuestion();

  });

  socket.on('ResetBuzz', function() {
    data.status.isBuzzed = false;
    data.status.isBuzzActive = true;
    data.status.winningTeamName = null;
    data.status.winningTeam = null;
    data.status.buzzList = [];
    console.log(data.players);
    io.emit('ResetBuzz', null);
  });

  // If scoreValue > 0, count as a win.
  // If scoreValue <= 0, cont as a fail and proceede to next player in queue.
  socket.on('AwardPoints', function(scoreValue) {
    if(!verifyQM(socket.handshake.session.team, "AwardPoints")) {
      return;
    }

    if(data.status.winningTeam)
    {
      console.log("Awarding points: " + scoreValue);
      getCurrentPlayer(data.status.winningTeam).score += scoreValue;
      //players.get(status.winningTeam).score += scoreValue;
      if(scoreValue <= 0)
      {
        data.status.buzzOrder++;
      }
    }
    else {
      console.log("No winning team");
    }
    console.log(data.players);
    io.emit('UpdatePlayers', {status: data.status, players: data.players });
    io.emit('ScorePoint', { team: data.status.winningTeam, scoreValue: scoreValue });
  });

  socket.on('AwardPointsToTeam', function(score, teamId, isCorectAnswer) {
    if(!verifyQM(socket.handshake.session.team, "AwardPointsToTeam")) { return; }

    var player = getCurrentPlayer(teamId);

    // if we are to update correctness, make it a toggle.  If false, just update the score directly.


    if(player != undefined)
    {
      if(!player.score)
      {
        player.score = 0;
      }

      if(isCorectAnswer)
      {
        player.isCorrect = !player.isCorrect;
        if(!player.isCorrect)
        {
          score = -parseInt(score);
        }
      }


      player.score += parseInt(score);


    }
    else {
      console.log("No player with id = " + teamId);
    }
    io.emit('UpdatePlayers', { status: data.status, players: data.players });
  });

  socket.on('NewGame', function() {
    if(!verifyQM(socket.handshake.session.team, "NewGame")) { return; }

    data.questionList.forEach(clearIsSung);
    io.emit('UpdatePlayers', { status: data.status, players: data.players, action: 'clear' });
  });

  // Unused for now.
  socket.on('ListPlayers', function() {
    io.emit('UpdatePlayers', {status: data.status, players: data.players });
    var allConnectedClients = Object.keys(io.sockets.connected);
    //var clients_in_the_room = io.sockets.adapter.rooms[roomId];
    for (var clientId in allConnectedClients ) {
      console.log('client: %s', clientId); //Seeing is believing
      var client_socket = io.sockets.connected[clientId];//Do whatever you want with this
    }
  });


});

function clearIsSung(song) {
  song.isSung = false;
}

function resetPlayers(endTheGame) {
  data.status.isBuzzed = false;
  data.status.questionTime = "";
  //data.status.isBuzzActive = true;
  data.status.winningTeamName = null;
  data.status.winningTeam = null;
  data.status.buzzList = [];

  // Clear any previously entered answers.
  data.status.pendingAnswers = [{}];
  data.answers = [{}];

  var winningScore;
  if(endTheGame)
  {
    winningScore = Math.max.apply(Math, data.players.map(function(o) { return o.score; }));
    player.confidenceLevel = 0;
  }


  data.players.forEach(player => {
    player.buzzOrde = 0,
    player.isCorrect = null,
    player.answer = null,
    player.HasBuzzed = false,
    //player.confidenceLevel = 0,
    //player.emote = 0),
    //player.emote = share.getEmoteFromConfidenceLevel(endTheGame && player.score == winningScore ? 100 : 0),
    
    player.questionScore = 0,
    player.NumberOfWins += (endTheGame && player.score == winningScore ? 1 : 0), // Om vi avslutar spelet får winnaren en pinne i totalen.
    player.score = (endTheGame ? 0 : player.score) // Om vi avslutar spelet, nolla allas poäng.

  });

}

// Avslutar frågan, eller egentligen bara stänger av möjligheten att mata in nya förslag, då alla förslag är öppna i sångboken.
function completeQuestion() {
  console.log("Avslutar frågan.");
  data.status.isBuzzActive = false;

  /*
  data.players.forEach(player => {
    // TODO: Aslo check if the answer was correct.
    if(data.answers != null)
    {
      var answer = getCurrentObject(data.answers, player.team);
      if(answer == null || answer == undefined) {
        return;
      }
      player.answer = answer.answer;
    }
    //player.score += answer.questionScore;
    //player.questionScore = 0;
  });
  */

  data.status.questionTimeActive = false;

  io.emit('UpdatePlayers', {status: data.status, players: data.players });
}


// Starta frågan och rensa tidigare önskemål.
function startQuestion() {
  console.log("Startar frågan.");
  data.status.isBuzzActive = true;

  data.players.forEach(player => {
      player.answer = null;
  });
  io.emit('UpdatePlayers', {status: data.status, players: data.players });

}

// Initial song book after server restart.
try {
  let dataToLoad = fs.readFileSync('games/sommar2025.json', null);
  data.questionList = JSON.parse(dataToLoad);
  data.status.questionList = data.questionList; // Make list of songs public.
  io.emit('UpdatePlayers',  {status: data.status, players: data.players } );
  io.emit("ReturnLoadQuestions", data.questionList);
} catch (error) {
  console.error(error);
}

