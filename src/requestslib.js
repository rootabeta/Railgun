// Force submit buttons to enforce simultaneity once clicked
// This submits the parent form, but only if the button is clicked
// If the button is disabled, onclick never triggers and the submission never occurs
function prepareButtons() { 
	let allButtons = document.querySelectorAll('button[type=submit]');
	for (i=0;i<allButtons.length;i++) { 
		allButtons[i].setAttribute("onclick", "$('form input[type=\"submit\"], form button').attr(\"disabled\", true).addClass(\"disabledForSimultaneity\");");
	}
}

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

// Convenient wrapper around POST requests that attaches user agent, userclick, and handles simultaneity
function makeRequest(userclick, url, payload, handlerCallback) { 
	function failed_response(error) {
		failStatus("Request timed out");
		unlockSimul();
	}

	// No user agent! Refuse to create/send the request.
	if (!(USER && USER != "" && USER != "null")) {
			failStatus("Cannot make web requests until user agent is set!");
			return;
	}

	// If we are already in simul, refuse to honor the request
	// Otherwise, engage simultaneity and prepare to go warp speed
	if (window.simulLocked) { 
		failStatus("Tried to run request during simultaneity");
		return;
	} else { 
		// Lock simultaneity items
		lockSimul()
	}

	// Debugging: make sure user identifiers are available and correct
	console.debug(USER_AGENT);
	console.debug(USER_URL);


	fetch(`${url}/template-overall=none/?script=${USER_URL}&userclick=${userclick}`, { 
		method: "POST",
		redirect: "follow", // https://forum.nationstates.net/viewtopic.php?p=41718911#p41718911
		signal: AbortSignal.timeout(30_000), // A signal to timeout after 30s if no response has come back
		headers: { 
			"User-Agent": USER_AGENT, // Set user agent for identification
			"Content-Type": "application/x-www-form-urlencoded",
			"Accept": "text/html"
		},
		body: payload,
	})
	.then((response) => response.text())
	.then((text) => { 
		unlockSimul(); // Now that we have a response, unlock simultaneity

		// Parse the response into an HTML document - easier to work with
		var parser = new DOMParser();
		var responseDocument = parser.parseFromString(text, "text/html");

		// Pull chk and localid from page in all cases, just in case we can get refreshed values
		if (responseDocument.getElementsByName("chk").length > 0) { 
			localStorage.setItem("rgchk", responseDocument.getElementsByName("chk")[0].value); 
		}
		if (responseDocument.getElementsByName("localid").length > 0) { 
			localStorage.setItem("rglocalid", responseDocument.getElementsByName("localid")[0].value);
		}

		// Pass the resulting document to the callback for it to handle
		handlerCallback(responseDocument);

	});

	/*
        const xhr = new XMLHttpRequest();
	xhr.timeout = 30_000; // 30 second timeout for requests
	xhr.responseType = "document"; // Expect an HTML document response

        // Attach userclick and user-agent to URL
        xhr.open("POST", `${url}/template-overall=none/?script=${USER_URL}&userclick=${userclick}`);
        xhr.setRequestHeader("User-Agent", USER_AGENT); // Additionally attach user-agent to request if possible

        // Deliver URL-Encoded form data, like NS site normally does
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

	// After 30 seconds, it is safe to assume no response will be coming from the server
	// https://forum.nationstates.net/viewtopic.php?p=40650385&sid=2dcae866b436082e3e30427e0dce4cc0#p40650385
	xhr.ontimeout = (e) => { 
	}

        // Only allow unlock once the request is done and responded to
        xhr.onload = () => { 
                if (xhr.readyState === XMLHttpRequest.DONE) { 
			// Let the user decide how to parse the response now that we have it
			handlerCallback(xhr.responseXML);

			// Shut down the web request after parsing, but before unlocking simul
			// Just in case it gets any funny ideas about refreshing or something
			xhr.abort();

                        // Finished request, unlock simultaneity
                        unlockSimul();

                }
        };

        // Fire off web request
        xhr.send(payload)
	*/
}
