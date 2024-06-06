function loadSettings(settings) { 
	//Whenever this function fires, we know that we have new data from settings
	//This means we can discard whatever we had, and update to the new stuff
	//This way, we can change things and have it reflected on the next refresh
	if (settings.user) { 
		if (settings.user != "null") { 
			USER = settings.user;
			localStorage.setItem("rguser", settings.user);
		} else { 
			USER = ""; // Set to empty string to blow up future parsing
		}
	}

	if (settings.ro) { 
		rotitle = settings.ro;
		localStorage.setItem("rgrotitle",settings.ro);
	}

	if (settings.gov) { 
		govtitle = settings.gov;
		localStorage.setItem("rggovtitle",settings.gov);
	}

	if (settings.suc) { 
		suctitle = settings.suc;
		localStorage.setItem("rgsuctitle",settings.suc);
	}

	if (settings.jp) { 
		JUMP_POINT = settings.jp;
		localStorage.setItem("rgjumppoint",settings.jp);
	}
}

function settingsFailed(error) { 
	console.error("Railgun: Failed to load settings");
	console.error(error);

	// Assume failed condition
	// If we already have a good value, use that. Otherwise, use defaults.
	if (!localStorage.getItem("rguser")) { 
		failStatus("Railgun failed to load user from settings and cannot acquire cached value");
		lockSimul();
	} else { 
		let USER = localStorage.getItem("rguser");
	}

	let rotitle = localStorage.getItem("rgrotitle") || "Railgun";
	let suctitle = localStorage.getItem("rgsuctitle") || "Task Failed Successorly";
	let govtitle = localStorage.getItem("rggovtitle") || "Maintain A";
	let JUMP_POINT = localStorage.getItem("rgjumppoint") || "Suspicious";
}
