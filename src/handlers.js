// Callback functions for various actions
// All callback functions must accept a variable containing an xhr.responseXML
// It can parse this and invoke other functions as needed
// We use an XML handler because all site-side actions should be done as HTML documents
// These also return true/false bools which can be caught by resolving .then on the makeRequest
// function, allowing us to programmatically determine if the action succeeded or failed, and 
// to respond accordingly - e.g., whether or not to update the cached RO list

function moveCallback(responseDocument) { 
	console.debug(responseDocument);
	if (responseDocument.body.textContent.includes("Success!") && responseDocument.body.textContent.includes("is now located in")) { 
		region = responseDocument.body.getElementsByClassName("rlink")[0].href.split("region=")[1].split("=")[0];
		successStatus(`Moved to region ${region} successfully`);
		localStorage.setItem("rgregion", region);
		return true;
	} else { 
		failStatus(`Could not move to region`);
		return false;
	}
}

function ROCallback(responseDocument) { 
	if (responseDocument.body.textContent.includes("Appointed") && responseDocument.body.textContent.includes("authority over Appearance, Communications, Embassies, and Polls")) { 
		successStatus(`ROd in ${region}`);
		return true;
	} else { 
		failStatus(`Could not RO in ${region}`);
		return false;
	}
}

function successorCallback(responseDocument) { 
	if (responseDocument.getElementsByClassName("info").length == 0) { 
		failStatus("Failed to dismiss RO");
		return false;
	} else { 
		successStatus(`Renamed successor ${responseDocument.getElementsByClassName("info")[0].getElementsByClassName("nlink")[0].href.split("=")[1]}`);
		return true;
	}
}

function dismissCallback(responseDocument) { 
	if (responseDocument.getElementsByClassName("info").length == 0) { 
		failStatus("Failed to dismiss RO");
		return false;
	}

	if (responseDocument.getElementsByClassName("info")[0].textContent.includes("Dismissed ")) {
		successStatus(`Dismissed ${responseDocument.getElementsByClassName("info")[0].getElementsByClassName("nlink")[0].href.split("=")[1]}`);
		return true;
	} else { 
		failStatus("Could not dismiss RO");
		return false;
	}
}

function joinCallback(responseDocument) { 
	if (responseDocument.body.textContent.includes("Welcome to the World Assembly, new member")) { 
		let appnation = responseDocument.getElementsByClassName("bellink")[0].href.split("=")[1];
		successStatus(`Joined WA with ${appnation}`);
		localStorage.setItem("rgnation", appnation); // Current nation

		// Copy to clipboard if switching succeeded
		// navigator.clipboard.writeText(`https://www.nationstates.net/nation=${appnation}`); 
		return true;
	} else if (responseDocument.body.textContent.includes("Another WA member nation is currently using the same email")) {
		failStatus("Already in WA");
		return false;
	} else { 
		// Generic fail
		failStatus("Failed to join WA");
		return false;
	}
}

function resignCallback(responseDocument) { 
	if (responseDocument.body.textContent.includes("You inform the World Assembly that") && responseDocument.body.textContent.includes("will no longer participate in its corrupt, hollow debates. From this moment forward, your nation is on its own.")) { 
		successStatus(`Resigned from the WA on ${nation}`);
		return true;
	} else { 
		failStatus(`Failed to resign from the WA on ${nation}`);
		return false;
	}
}

function endorseCallback(responseDocument) { 
	// <form method="POST" action="/cgi-bin/endorse.cgi"><input type="hidden" name="nation" value="insula_navarra"><input type="hidden" name="localid" value="0lQjjI9Ogdl3X"><input type="hidden" name="action" value="unendorse"><p><button type="submit" class="endorse button icon wa danger">Withdraw Your Endorsement </button></form>
	if (responseDocument.body.textContent.includes("Withdraw Your Endorsement")) { 
		successStatus("Endorsed");
		return true;
	} else { 
		failStatus("Did not endorse");
		return false;
	}
}
