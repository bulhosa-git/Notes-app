import "https://cdn.jsdelivr.net/npm/@editorjs/editorjs@latest";
import "https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js";
import "https://cdn.jsdelivr.net/npm/@editorjs/editorjs@latest";
import "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
import * as app from "./notes.js";

/*
================
Switch theme
================
*/

//Apply
const storedTheme = localStorage.getItem('theme') || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
if (storedTheme) { 
	document.documentElement.setAttribute('data-theme', storedTheme);
	console.log("[theme] Set " + storedTheme + " mode");
}

//Switch
app.themeBtns.forEach(themeBtn => {
	themeBtn.addEventListener("click", function(e) {
		localStorage.setItem("theme", e.target.dataset.theme);
		document.documentElement.setAttribute("data-theme", e.target.dataset.theme);
		console.log("[theme] Set " + e.target.dataset.theme + " mode");
	});
});

/*
================
Switch users
================
*/

//Switch users
app.userBtns.forEach(userBtn => {
	userBtn.addEventListener("click", function(e) {
		app.notes.switchUser(e.target.dataset.id, e.target.textContent);
	});
});

/*
================
Notes
================
*/

//Add
app.addBtns.forEach(addBtn => {
	addBtn.addEventListener("click", function(e) {
		app.notes.add();
	});
});

//Save
app.saveBtn.addEventListener("click", function(e) {
	app.notes.save();
});

//Save with ctrl+s and cmd+s
document.addEventListener("keydown", function(e) {
	if ((window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)  && e.keyCode == 83) {
		e.preventDefault();

		app.noteTitle.blur();
		app.notes.save();
	}
}, false);

//Delete
document.querySelector(".delete-all-notes").addEventListener('click', function(e) {
	app.notes.deleteAll();
});

/*
================
Other
================
*/

//Search
app.searchInput.addEventListener("keyup", function(){
	app.search.lookup();
});

//Reset saveBtn state
app.noteTitle.addEventListener("keydown", function(e){
	/* For more complex and/or larger projects it would be better to use a JS translate tool ie. i18n. */
	app.saveBtn.textContent = "Save";

	/* Titles needs to be trimmed to only X charcaters */
	let count = e.target.textContent;
	// (...)
});

document.querySelector(".export-pdf").addEventListener('click', function(e) {
	app.notes.save(true);
});

