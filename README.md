# Quiz
Sing book sytem with syncing of texts and maybe voting of the next song, using websockets.

Requires node.js. Download and install.

Run
npm install express
npm install socket.io
npm install request
npm install gm

The server will now listen to port 3000.

Visit localhost:3000/ to get to the singer view
Enter the SingMaster password to enter as Sing Master to control the singing.
The SingMaster controls all singing.

# Sing modes
* TBD

# TODO:

## Player GUI
* [ ] Add modal for name prompt if no name has been entered for the session.

* [ ] Store a players old name in a cookie for next time.

* [ ] Hide the SingMaster-password field as it is not important for the majority of players.

* [ ] "I'm ready"-notification for players to signal that we're ready to sing
  
* "I'm happy" emotion indicator as well as "I have no clue"-indicator. Just for fun. 
  - [x] Partly implemented, with no impact on the singing.

* [ ] Help sections for the rules for all singing.

* [ ] Countdown timers for singing.

* [ ] Sounds, music (if no one can sing)

* [ ] Sing along-text, with a kareoke-style indicator.

* [ ] Revelation of lyrics in time with the song. Good for when you want to preform live, want everyone to follow along but not spoil the whole song until you get there.

## SingMaster GUI

* [ ] New public sing board and song display.
  This one is supposed to be streamed online or just let everyone have surf to the page
  directly. To be used in tandem with the phone. So far you can always use an
  unused client as the sing board.

* [x] Preconfigured songs.

* [ ] Save/load functions. 
  - [x] Save/load within existing singing.
  - [ ] "Restore session" function if the server crashes, and reconnect existing users to their old users.

* [ ] Comments field to songs.

## Songboard only mode
* [ ] A way to only show songs.
* [ ] A way to not be part of the singing board, but still recieve singing updates.

## Singing modes
### Buzz
* [ ] First person to buzz gets to choose the next song.

### Quiz
  - [x] Standard quiz mode where the most voted type of song wins. Beer, wine, schnaps, funny etc.

### More song modes
  - [ ] Majority rules. Everyone types in a song. The most voted one wins. The Song Master will have to search and find the lyrics and paste it into the "up next" song.

## Technical
* [ ] Use Bootstrap-vue?
* [ ] Make use of vue components
* [ ] Use vuex for state?
* [ ] Upgrade to newer versions of socket.io.
  
# How to run as SongMaster
Tanken är att songnummer skall räkans upp automatiskt om man bara lämnar det blankt. Sen måste man välja en sångtyp. Den är inte vad från början då det blir lite skumt innan amn tryckt på "Ny sång" en gång efter omstart.  
 
Det som man sen behöver ha koll på är att använda "uppdatera sång" om man behöver rätta något. När man är redo för nästa sång är det viktigt att ställa in alla fält rätt först och sen trycka på "Ny sång". Då animeras det så att den gamla sången försvinner och en ny kommer in. 

Det jag oftast gör fel på är att trycka "Ny sång" innan jag ställt in alla fält rätt först. Men det går att justera fälten och trycka på "uppdatera sång" för att komma undan med det... men det är inte lika snyggt.
