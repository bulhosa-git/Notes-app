export let currentUser = 0;
export let currentNote = 0;
export const notesWrapper = document.querySelector(".notes");
export const noteTitle = notesWrapper.querySelector(".notes-right h1");
export const addBtns = document.querySelectorAll(".add-note");
export const userBtns = document.querySelectorAll(".switch-user");
export const saveBtn = document.querySelector(".save-note");
export const themeBtns = document.querySelectorAll(".ts-wrapper button");
export const searchInput = document.getElementById("search");

export let notes = {};
export let helpers = {};
export const paint = {};
export const search = {};

//Init editor
export const editor = new EditorJS({
	holder: "editor",
	placeholder: "Let's write an awesome story!",

	onReady: function(){
		notes.init();
    },
	onChange: function() {
		//Reset button state
		saveBtn.textContent = "Save";
    }
});

notes.switchUser = function ($id, $username) {
	//Set global var
	currentUser = $id;

	//Set new username on dropdown
	document.getElementById("ddUsersMenu").textContent = $username;

	//Reset disabled state on all elements
	userBtns.forEach(userBtn => {
		userBtn.classList.remove("disabled");
	});

	//Set disabled state
	document.querySelector(".switch-user[data-id=\"" + $id + "\"]").classList.add("disabled");

	//Refresh and load notes
	notes.init();
}

notes.init = function () {
	//Set currentNote
	currentNote = 0;

	console.log("[initNotes] currentUser: " + currentUser);
	console.log("[initNotes] currentNote: " + currentNote);

	//Empty the scroller
	document.querySelectorAll(".note-row").forEach(noteRow => {
		noteRow.remove();
	});

	//Reset & set inactive
	notesWrapper.classList.remove("active");
	noteTitle.textContent = "";
	noteTitle.contentEditable = "false";
	editor.blocks.clear();

	//Get current user notes from localStorage
	const userNotes = helpers.getlocalStorage();

	if(!userNotes) {
		console.log("[initNotes] Unable to load user notes from localStorage");
		return false;
	}

	console.log("[initNotes] User notes loaded successfully");
	
	//Loop through the fetched data and build the scroller
	for (let i=0; i <= userNotes.length-1; i++){
		//Final iteration
		if(i == userNotes.length-1) {
			//Set currentNote
			currentNote = userNotes[i].id;
			paint.createScrollerEntry(userNotes[i], true);
			return;
		}
        paint.createScrollerEntry(userNotes[i]);
    }
}

notes.add = function ($noteTitle) {
	//Get current user notes from localStorage
	let userNotes = helpers.getlocalStorage();

	if(!userNotes) {
		userNotes = [];
	}

	//Create new note object
	let note = {
	    id: helpers.genID(),
	    created: Math.floor(Date.now() / 1000),
	    ...($noteTitle !== undefined && {title: $noteTitle})
	};

	//Push newly created note object to array
	userNotes.push(note);

	//Write to localStorage
	localStorage.setItem("notes-user-" + currentUser, JSON.stringify(userNotes));

	//Set currentNote
	currentNote = note.id;

	paint.createScrollerEntry(note, true);
	document.querySelector(".scroller").scroll({top:0,behavior:'smooth'});
}

notes.load = function ($id) {	
	if($id === undefined) {
		console.log("[load] Missing $id parameter");
		return false;
	}

	//Get current user notes from localStorage
	const userNotes = helpers.getlocalStorage();

	if(!userNotes) {
		console.log("[load] Unable to load user notes from localStorage");
		return false;
	}

	//Loop userNotes for a note with matching .id
	for (let i=0; i<=userNotes.length-1; i++) {
        if(userNotes[i].id === $id) {
			//Set currentNote
			currentNote = $id;
			notesWrapper.querySelector(".notes-right").classList.add("active"); //Mobile view overlap
			paint.loadEntry(userNotes[i]);
        } 
	}
}

notes.save = function ($exportPDF = false) {
	if(currentNote == 0) { return false; }

	editor.save().then(savedData => {
		//Get current user notes from localStorage
		const userNotes = helpers.getlocalStorage();

		if(!userNotes) {
			console.log("[save] Unable to load user notes");
			return false;
		}

		//Search userNotes array for a note with matching .id as currentNote
		for (let i=0; i<=userNotes.length-1; i++) {
	        if(userNotes[i].id === currentNote) {
	        	//Sanitize and save note title
				const svTitle = noteTitle.textContent.trim();

				if(svTitle !== "") { //Is empty?
					userNotes[i].title = svTitle;
				}

				//Set note "blocks" (editorJS)
				if(savedData.blocks.length != 0) {
					userNotes[i].note = JSON.stringify(savedData);
				}

				//Set timestamp
				//It would be *nice* to save 2 diferent timestamps, one for created and other for last edited
			    userNotes[i].created = Math.floor(Date.now() / 1000);

			    //Hurray!
			    //Write to localStorage
				localStorage.setItem("notes-user-" + currentUser, JSON.stringify(userNotes));

				//Update save button
				saveBtn.textContent = "Saved";

				//Update scroller
				document.getElementById(userNotes[i].id).remove(); //Mobile view overlap
				paint.createScrollerEntry(userNotes[i]);
				document.querySelector(".scroller").scroll({top:0,behavior:'smooth'});

				//Mobile view overlap
				notesWrapper.querySelector(".notes-right").classList.remove("active");

				console.log("[save] Saved successfully");

				if($exportPDF) {
					notes.exportPDF(userNotes[i]);
				}
	        } 
		}
	}).catch((error) => {
		console.log("[save] EditorJS error: " + error);
		return false;
	});
}

notes.delete = function ($id) {
	if($id === undefined) {
		console.log("[delete] Missing $id parameter");
		return false;
	}

	//Get current user notes from localStorage
	const userNotes = helpers.getlocalStorage();

	if(!userNotes) {
		console.log("[delete] Unable to load user notes");
		return false;
	}		

	//Search userNotes array for a note with matching .id and delete it's key
	for(let i=0; i<=userNotes.length-1; i++) {
        if(userNotes[i].id === $id) {
        	//Delete from array
        	userNotes.splice(i,1);        	
        } 
	}
	
    //Write to localStorage
	localStorage.setItem("notes-user-" + currentUser, JSON.stringify(userNotes));

	notes.init();
}

notes.deleteAll = function () {
    //Delete from localStorage
	localStorage.removeItem("notes-user-" + currentUser);

	//Refresh
	notes.init();
}

notes.exportPDF = function ($note) {
	//Simple PDF export
	//Needs work ...

	//Convert editorJS blocks and .map it
	let blocks2Html = "";
	if($note.note) {
		let noteBlocks = JSON.parse($note.note).blocks;
		noteBlocks.map(noteBlock => {
    		blocks2Html += "<p>" + noteBlock.data.text + "</p>";
    	});
	}

	let EXP = document.createElement('div');
    EXP.setAttribute("id", "EXP");
    EXP.innerHTML = "<h1>" + $note.title + "</h1>";
    EXP.innerHTML += blocks2Html;
	html2pdf().set({ filename: $note.title.replace(/ /g,"_") + '.pdf' }).from(EXP).save();

	console.log("[exportPDF] PDF exported successfully");
}

//Helpers
helpers.genID = function () {
    let g1 = (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    let g2 = (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
    return (g1 + g2);
}

helpers.getlocalStorage = function () {
	const lsNotes = localStorage.getItem("notes-user-" + currentUser);
	
	if(lsNotes === null) {
		return false;
	}

	return JSON.parse(lsNotes);
};

paint.createScrollerEntry = function ($note, $loadEntry = false) {
	if($note === undefined) {
		console.log("[createScrollerEntry] Missing $note parameter");
		return false;
	}

	//Format title
	let entryTitle = "Untitled";
	let ntClass = "";

	if($note.hasOwnProperty("title")) {
		entryTitle = $note.title;
	} else { ntClass = "no-title"; }

	//Format entry date
	const entryDate = new Date($note.created * 1000).toLocaleDateString("pt-PT", {weekday: "long", year: "numeric", month: "long", day: "numeric", hour: '2-digit', minute: '2-digit'});

	//Item
    let noteEl = document.createElement('div');
    noteEl.classList.add("note-row");
    noteEl.setAttribute("id", $note.id);
    noteEl.innerHTML += "<div class=\"row-left\"><h3 class=\"" + ntClass + "\">" + entryTitle + "</h3><p>" + entryDate + "</p></div>";
    noteEl.innerHTML += "<div class=\"row-right\"><button class=\"btn btn-outline-danger delete-note\" data-id=\"" + $note.id + "\">Delete</button></div>";

    //Append to scroller
    const scroller = document.querySelector(".scroller");
    scroller.insertBefore(noteEl, scroller.firstChild)

    //Create an eventListener for note
    noteEl.addEventListener("click", function(e) {
		notes.load(e.target.id);
	});

    //Create an eventListener for delete button
    noteEl.querySelector("button.delete-note").addEventListener("click", function(e) {
		notes.delete(e.target.dataset.id);
	});

	if($loadEntry) {
		paint.loadEntry($note);
	} else {
		//Set selected
		document.querySelectorAll(".note-row").forEach(noteRow => {
			noteRow.classList.remove("selected");
			if(noteRow.id == $note.id) {
				noteRow.classList.add("selected");
			}
		});
	}
}

paint.loadEntry = function ($note) {
	//Set title
	if($note.hasOwnProperty("title")) {
		noteTitle.textContent = $note.title;
	} else {
		noteTitle.textContent = "";
	}

	//Load note to editorJS
	if($note.hasOwnProperty("note")) {
		editor.render(JSON.parse($note.note));
	} else {
		editor.blocks.clear();
	}

	//Set selected
	document.querySelectorAll(".note-row").forEach(noteRow => {
		noteRow.classList.remove("selected");
		if(noteRow.id == $note.id) {
			noteRow.classList.add("selected");
		}
	});

	//Set active
	notesWrapper.classList.add("active");
	noteTitle.contentEditable = "true";

	if(!$note.hasOwnProperty("title")) {
		//Automaticaly set focus on title if it's empty
		noteTitle.focus();
	}

	console.log("[loadEntry] Loaded (" + $note.id + ")")
}

search.lookup = function () {
	const filter = searchInput.value.toLowerCase();
	const scrollerItems = document.querySelectorAll(".note-row");

	//Loop through all list items, and hide those who don't match the search query
	//Eventually I would automatically .loadEntry if items count is 1

	for (let i=0; i<scrollerItems.length; i++) {
		let title = scrollerItems[i].getElementsByTagName("h3")[0].textContent ;

		if (title.toLowerCase().indexOf(filter) > -1) {
			scrollerItems[i].style.display = "";
		} else {
			scrollerItems[i].style.display = "none";
		}
	}
}
