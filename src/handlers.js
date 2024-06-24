// Callback functions for various actions
// All callback functions must accept a variable containing an xhr.responseXML
// It can parse this and invoke other functions as needed
// We use an XML handler because all site-side actions should be done as HTML documents

function moveCallback(responseDocument) { 
	console.debug(responseDocument);
	if (responseDocument.body.textContent.includes("Success!") && responseDocument.body.textContent.includes("is now located in")) { 
		region = responseDocument.body.getElementsByClassName("rlink")[0].href.split("region=")[1].split("=")[0];
		successStatus(`Moved to region ${region} successfully`);
		localStorage.setItem("rgregion", region);
	} else { 
		failStatus(`Could not move to region`);
	}
}

function ROCallback(responseDocument) { 
	if (responseDocument.body.textContent.includes("Appointed") && responseDocument.body.textContent.includes("authority over Appearance, Communications, Embassies, and Polls")) { 
		successStatus(`ROd in ${region}`);
	} else { 
		failStatus(`Could not RO in ${region}`);
		// TODO: get ROs while we're at it.
		// Check if there are too many
		// Check if we're already an RO
		// Adjust error message accordingly
		// Can steal code from YAFF for this
	}
}

function joinCallback(responseDocument) { 
	if (responseDocument.body.textContent.includes("Welcome to the World Assembly, new member")) { 
		let appnation = responseDocument.getElementsByClassName("bellink")[0].href.split("=")[1];
		successStatus(`Joined WA with ${appnation}`);
		localStorage.setItem("rgnation", appnation); // Current nation

		// Copy to clipboard if switching succeeded
		navigator.clipboard.writeText(`https://www.nationstates.net/nation=${appnation}`); 
	} else if (responseDocument.body.textContent.includes("Another WA member nation is currently using the same email")) {
		failStatus("Already in WA");
	} else { 
		failStatus("Failed to join WA");
	}
}

function resignCallback(responseDocument) { 
	if (responseDocument.body.textContent.includes("You inform the World Assembly that") && responseDocument.body.textContent.includes("will no longer participate in its corrupt, hollow debates. From this moment forward, your nation is on its own.")) { 
		successStatus(`Resigned from the WA on ${nation}`);
	} else { 
		failStatus(`Failed to resign from the WA on ${nation}`);
	}
}

function endorseCallback(responseDocument) { 
	// <form method="POST" action="/cgi-bin/endorse.cgi"><input type="hidden" name="nation" value="insula_navarra"><input type="hidden" name="localid" value="0lQjjI9Ogdl3X"><input type="hidden" name="action" value="unendorse"><p><button type="submit" class="endorse button icon wa danger">Withdraw Your Endorsement </button></form>
	if (responseDocument.body.textContent.includes("Withdraw Your Endorsement")) { 
		successStatus("Endorsed");
	} else { 
		failStatus("Did not endorse");
	}
}
