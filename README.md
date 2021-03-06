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

* [x] A public list of all songs, so each user can check them out beforhand. 

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

* [x] The possibility to enter and edit song texts easily. (textarea to string array and back.)

* [x] The possibility to add songs easily and store them.

* [ ] Remove the pending question object and only work on the quizMaster.questionList. This makes it possible to make misstakes for no gain at all. 

## Songboard only mode
* [ ] A way to only show songs.
* [ ] A way to not be part of the singing board, but still recieve singing updates.

## Singing modes
### Buzz
* [ ] First person to buzz gets to choose the next song.

### Quiz
  - [ ] Standard quiz mode where the most voted type of song wins. Beer, wine, schnaps, funny etc.

### More song modes
  - [x] Majority rules. Everyone types in a song. The most voted one wins. The Song Master will have to search and find the lyrics and paste it into the "up next" song.

## Technical
* [ ] Use Bootstrap-vue?
* [ ] Make use of vue components
* [ ] Use vuex for state?
* [ ] Upgrade to newer versions of socket.io.
  
# How to run as SongMaster
Tanken ??r att songnummer skall r??kans upp automatiskt om man bara l??mnar det blankt. Sen m??ste man v??lja en s??ngtyp. Den ??r inte vad fr??n b??rjan d?? det blir lite skumt innan amn tryckt p?? "Ny s??ng" en g??ng efter omstart.  
 
Det som man sen beh??ver ha koll p?? ??r att anv??nda "uppdatera s??ng" om man beh??ver r??tta n??got. N??r man ??r redo f??r n??sta s??ng ??r det viktigt att st??lla in alla f??lt r??tt f??rst och sen trycka p?? "Ny s??ng". D?? animeras det s?? att den gamla s??ngen f??rsvinner och en ny kommer in. 

Det jag oftast g??r fel p?? ??r att trycka "Ny s??ng" innan jag st??llt in alla f??lt r??tt f??rst. Men det g??r att justera f??lten och trycka p?? "uppdatera s??ng" f??r att komma undan med det... men det ??r inte lika snyggt.
