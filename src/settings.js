function saveOptions(e) {
	e.preventDefault();
	
	if (!document.querySelector("#user").value) { 
		alert("Please enter your nation for compliance with script rules. This is required to use Railgun.");
		return;
	} else { 
		chrome.storage.sync.set({ 
			user: document.querySelector("#user").value,	
			ro: document.querySelector("#ro").value,
			gov: document.querySelector("#gov").value,
			suc: document.querySelector("#suc").value,
			jp: document.querySelector("#jp").value.toLowerCase().replace(/ /gi,"_"), //Set region, all lowercase, underscores instead of spaces
		});
	}
}

function restoreOptions() {
	function setCurrentChoice(result) {
		if (result.user) { 
			document.querySelector("#user").value = result.user;
		}
		document.querySelector("#ro").value = result.ro || "Railgun";
		document.querySelector("#gov").value = result.gov || "Maintain A";
		document.querySelector("#suc").value = result.suc || "Task Failed Successorly";
		document.querySelector("#jp").value = result.jp || "suspicious";
	}

	function onError(error) {
		console.error(`Oh nyo: ${error}`);
	}

	let getting = chrome.storage.sync.get();
	getting.then(setCurrentChoice, onError);
}

async function checkPermissions() { 
        // Check if we have permissions for NS
        let hostPerms = {origins: ["https://*.nationstates.net/*"]};
        let getContains = await browser.permissions.contains(hostPerms);
        return getContains;
}

function requestPermissions(result) { 
	if (result) {
		console.log("We have host permissions for nationstates");
	} else { 
		console.log("Missing host permissions");
		alert("Missing host permissions. Please enable them in the extension settings.");

		// Disable button if missing host permission - we can't use railgun without it
		document.getElementsByTagName("button")[0].disabled = true;
	}
}

function permissionError(error) { 
	alert("Failed to query permissions. Please press F12 and send the developer the logs.");
	console.error(error);
}

checkPermissions().then(requestPermissions, permissionError);

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
