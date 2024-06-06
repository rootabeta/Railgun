// Functions to lock or unlock elements for simultaneity
function lockSimul() { 
	console.debug(`You are ${USER}`);
	window.simulLocked = true;
	let elements = document.querySelectorAll('button[type=submit]');
	for (i=0;i<elements.length;i++) { 
		let element = elements[i];
		// Set simultaneity flag
		element.setAttribute("disabledforsimultaneity", true);
		// Disable element
		element.setAttribute("disabled", true);
	}
}

function unlockSimul() { 
	window.simulLocked = false;
	let elements = document.querySelectorAll('[disabledforsimultaneity]');
	for (i=0;i<elements.length;i++) { 
		let element = elements[i];
		// Remove simultaneity flag
		element.removeAttribute("disabledforsimultaneity");
		// Re-enable element
		element.removeAttribute("disabled");
	}
}
